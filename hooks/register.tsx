import {
  type EngineInterface,
  type On,
  type PluginOptions,
  read,
  type RenderElement,
  type RenderInput,
  update,
} from 'claude-code'

import { drawableOf, type Drawable } from './drawable-of'
import { IMAGES_COMMAND, isOffAfter } from './images-command'
import { MAX_HELD_PICTURES, MAX_SOURCE_BYTES } from './limits'
import { maxRowsOf } from './max-rows-of'
import { PASTED_IMAGE_MARKER, pastedPicturesOf } from './pasted-pictures-of'
import { type Picture, picturesOf } from './pictures-of'
import { picturesView, type Shown } from './pictures-view'
import { roomOf } from './room-of'

const IS_HIDDEN = { plugin: 'images', key: 'isHidden' } as const
const IS_OFF = { plugin: 'images', key: 'isOff' } as const

/**
 * What every drawing of pictures shares for the module's life: the decoded
 * pictures, each prompt's pasted ones, and the `maxRows` option.
 */
type Held = {
  drawables: Map<string, Drawable>
  pasted: Map<string, Picture[]>
  openable: Map<string, Picture>
  maxRows: number
}

const MAX_OPENABLE_PICTURES = 64

const EXTENSIONS: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/gif': 'gif',
  'image/webp': 'webp',
}

// The viewer is detached (setsid -f on Linux, nohup & where there is none)
// with its streams on /dev/null: run waits for the child's pipes to close,
// so a viewer holding them would block the hook until run's 30 s timeout.
const OPENER_PRELUDE =
  'launch() { if command -v setsid >/dev/null; then setsid -f "$@"; else nohup "$@" & fi; } ' +
  '>/dev/null 2>&1 </dev/null; ' +
  'opener=$(command -v xdg-open || command -v open) || exit 127'
const OPEN_FILE = `${OPENER_PRELUDE}; launch "$opener" "$1"`
const OPEN_BYTES =
  `${OPENER_PRELUDE}; dir="\${XDG_RUNTIME_DIR:-\${TMPDIR:-/tmp}}/claude-images" && mkdir -p -m 700 "$dir" && ` +
  'base64 -d > "$dir/$1" && launch "$opener" "$dir/$1"'

const rememberOpenable = (held: Held, picture: Picture) => {
  held.openable.delete(picture.id)
  held.openable.set(picture.id, picture)

  if (held.openable.size > MAX_OPENABLE_PICTURES) {
    held.openable.delete(held.openable.keys().next().value!)
  }
}

// The file a Read named, at full size, while it is still there; otherwise
// the bytes the model saw (a paste or MCP image has no file) under a name
// made from the picture's id.
async function openPicture($: EngineInterface, picture: Picture) {
  const hasFile = picture.path !== undefined && (await $.fs.exists(picture.path).catch(() => false))
  const extension = EXTENSIONS[picture.mediaType] ?? 'img'
  const fileName = `${picture.id.replace(/[^A-Za-z0-9_-]/g, '_')}.${extension}`

  const { exitCode, stderr } = hasFile
    ? await $.process.run(['sh', '-c', OPEN_FILE, 'sh', picture.path!])
    : await $.process.run(['sh', '-c', OPEN_BYTES, 'sh', fileName], { stdin: picture.base64 })

  if (exitCode !== 0) {
    $.ui.log(`images: could not open ${picture.name}: ${stderr.trim() || `exit ${exitCode}, no xdg-open or open`}`)
  }
}

const drawableFor = (drawables: Map<string, Drawable>, picture: Picture, maxBytes: number) => {
  const key = `${maxBytes}:${picture.base64}`
  const drawable = drawables.get(key) ?? drawableOf(picture, maxBytes)

  drawables.delete(key)
  drawables.set(key, drawable)

  if (drawables.size > MAX_HELD_PICTURES) {
    drawables.delete(drawables.keys().next().value!)
  }

  return drawable
}

// Reading `isHidden` while drawing subscribes the row, so a toggle redraws it.
async function shownOf($: EngineInterface, held: Held, pictures: ReadonlyArray<Picture>): Promise<Shown[]> {
  const maxBytes = Math.floor(MAX_SOURCE_BYTES / pictures.length)

  pictures.forEach(picture => rememberOpenable(held, picture))

  return Promise.all(
    pictures.map(async picture => ({
      id: picture.id,
      drawable: drawableFor(held.drawables, picture, maxBytes),
      name: picture.name,
      isHidden: (await read($, { ...IS_HIDDEN, id: picture.id })) ?? false,
      onToggle: () => void toggle($, picture.id),
    })),
  )
}

async function toggle($: EngineInterface, id: string) {
  await update($, { ...IS_HIDDEN, id }, isHidden => !isHidden)
}

// A prompt row's pictures, found once per row: the conversation is read
// again only while no message holds the row's text yet.
async function pastedOf(
  $: EngineInterface,
  pasted: Map<string, Picture[]>,
  requestId: string,
  text: string,
): Promise<Picture[]> {
  const known = pasted.get(requestId)

  if (known) {
    return known
  }

  const found = pastedPicturesOf(await $.session.messages({ as: 'api' }), text, requestId)

  if (found) {
    pasted.set(requestId, found)
  }

  return found ?? []
}

// The row as the engine drew it, with its pictures under it; the row alone
// while there are none or `/images off` holds (read here, so it redraws).
async function withPictures(
  $: EngineInterface,
  e: RenderInput<'ToolUse' | 'ToolGroup' | 'UserMessage', 'terminal'>,
  drawn: RenderElement,
  pictures: ReadonlyArray<Picture>,
  held: Held,
): Promise<RenderElement> {
  if (pictures.length === 0 || (await read($, IS_OFF))) {
    return drawn
  }

  const { Box, Button, Client, Text, Image } = $.ui.resolve(e)
  const shown = await shownOf($, held, pictures)

  return (
    <Box flexDirection="column">
      {drawn}
      {picturesView({ Box, Button, Client, Text, Image }, shown, roomOf(e.viewport, held.maxRows))}
    </Box>
  )
}

/**
 * Registers the pictures on the terminal: under a Read or MCP row that
 * returned images, under a collapsed group's line for each such call, and
 * under a prompt for each image pasted into it; a click on one opens it in
 * the image viewer, and a click on its caption hides or shows it. `/images`
 * stops and starts them all for the session.
 *
 * An expanded group draws its calls as `ToolUse` rows, so each picture draws
 * once whichever way its call is shown, hidden or not in both.
 *
 * @param on the engine's registrar
 * @param options `maxRows`, the tallest a picture draws, caption included
 */
export function register(on: On, options: PluginOptions) {
  // A row draws many times (running, done, each scroll); decode it once per
  // share, the tree's source bytes split evenly across its pictures.
  const held: Held = {
    drawables: new Map(),
    pasted: new Map(),
    openable: new Map(),
    maxRows: maxRowsOf(options.maxRows),
  }

  on('session.start', async ($, e, next) => {
    await $.command.register(IMAGES_COMMAND)

    return next(e)
  })

  on('command.run', { command: 'images' }, async ($, e) => {
    const isOff = isOffAfter(e.args, (await read($, IS_OFF)) ?? false)

    if (isOff === null) {
      return { text: `Usage: /images [on|off]. "${e.args.trim()}" is neither.` }
    }

    await update($, IS_OFF, () => isOff)

    return { text: isOff ? 'Pictures are off for this session.' : 'Pictures are on.' }
  })

  on('ui.render', { component: 'ToolUse', surface: 'terminal' }, async ($, e, next) =>
    withPictures($, e, await next(e), picturesOf(e.props), held),
  )

  on(
    'ui.render',
    { component: 'ToolGroup', surface: 'terminal', props: { isExpanded: false } },
    async ($, e, next) => withPictures($, e, await next(e), e.props.calls.flatMap(picturesOf), held),
  )

  on(
    'ui.render',
    { component: 'UserMessage', surface: 'terminal', props: { origin: { kind: 'composer' } } },
    async ($, e, next) => {
      const drawn = await next(e)

      if (!e.props.text.includes(PASTED_IMAGE_MARKER)) {
        return drawn
      }

      return withPictures($, e, drawn, await pastedOf($, held.pasted, e.requestId, e.props.text), held)
    },
  )

  on('ui.message', { surface: 'terminal', module: 'hooks/click-to-open.tsx' }, async ($, e, next) => {
    const picture = typeof e.data === 'string' ? held.openable.get(e.data) : undefined

    if (picture) {
      await openPicture($, picture)
    }

    return next(e)
  })
}
