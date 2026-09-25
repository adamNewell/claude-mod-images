import { describe, type Engine, expect, test, tier } from 'claude-code/testing'

import { MAX_SOURCE_BYTES } from '../hooks/limits'
import { engineRow, MEDIUM_JPEG, readRow, TINY_GIF, TINY_JPEG, TINY_PNG, VIEWPORT } from './fixtures'

tier('user')

const PRESENTATION = { isFullscreen: true, columns: 100 }

const mountRow = (
  $: Engine,
  props: ReturnType<typeof readRow>,
  surface: 'terminal' | 'desktop' = 'terminal',
) =>
  $.ui.mount({
    plugin: 'images',
    surface,
    component: 'ToolUse',
    requestId: props.tool_use_id,
    props,
    viewport: VIEWPORT,
  })

describe('register', () => {
  test('a Read of a PNG draws it under the row as the PNG it is', async ($, on) => {
    engineRow(on)
    const ui = await mountRow($, readRow('png', 'image/png', TINY_PNG, '/work/shot.png'))
    const image = await ui.find({ type: 'Image' })

    expect(await ui.find({ type: 'Text', text: 'engine ToolUse' })).toBeDefined()
    expect(image?.props).toEqual({
      source: { png: TINY_PNG },
      columns: 2,
      rows: 1,
      alt: 'shot.png · 16×12',
    })
  })

  test('a Read of a JPEG draws its decoded pixels', async ($, on) => {
    engineRow(on)
    const ui = await mountRow($, readRow('jpeg', 'image/jpeg', TINY_JPEG))
    const source = (await ui.find({ type: 'Image' }))?.props.source as {
      rgba: string
      width: number
      height: number
    }

    expect(source.width).toBe(16)
    expect(source.height).toBe(12)
    expect(Uint8Array.fromBase64(source.rgba).length).toBe(16 * 12 * 4)
  })

  test("a Read of a GIF draws its first frame's pixels", async ($, on) => {
    engineRow(on)
    const ui = await mountRow($, readRow('gif', 'image/gif', TINY_GIF))
    const source = (await ui.find({ type: 'Image' }))?.props.source as {
      rgba: string
    }

    expect(Uint8Array.fromBase64(source.rgba).length).toBe(16 * 12 * 4)
  })

  test('a WebP says why it is not drawn', async ($, on) => {
    engineRow(on)
    const ui = await mountRow($, readRow('webp', 'image/webp', TINY_PNG, '/work/a.webp'))

    expect(await ui.find({ type: 'Image' })).toBeUndefined()
    expect((await ui.find({ type: 'Text', text: /a\.webp not drawn/ }))?.text).toBe(
      'a.webp not drawn: no decoder for image/webp here',
    )
  })

  test('a JPEG that does not decode says so', async ($, on) => {
    engineRow(on)
    const ui = await mountRow($, readRow('bad', 'image/jpeg', 'AAAA', '/work/bad.jpg'))

    expect(await ui.find({ type: 'Text', text: /^bad\.jpg not drawn: it did not decode/ })).toBeDefined()
  })

  test('a Read of text draws the row alone', async ($, on) => {
    engineRow(on)
    const ui = await mountRow($, { ...readRow('text', 'image/png', TINY_PNG), output: { type: 'text', file: { content: 'hi' } } })

    expect(await ui.drawn()).toEqual({ type: 'Text', children: ['engine ToolUse'] })
  })

  test('the desktop draws its own row, untouched', async ($, on) => {
    engineRow(on)
    const ui = await mountRow($, readRow('desk', 'image/png', TINY_PNG), 'desktop')

    expect(await ui.drawn()).toEqual({ type: 'Text', children: ['engine ToolUse'] })
  })

  test("a collapsed group draws each Read's picture under its line", async ($, on) => {
    engineRow(on)
    const calls = [
      readRow('one', 'image/png', TINY_PNG),
      { ...readRow('two', 'image/png', TINY_PNG), tool: 'Grep', output: { numFiles: 0 } },
      readRow('three', 'image/gif', TINY_GIF),
    ]

    const ui = await $.ui.mount({
      plugin: 'images',
      surface: 'terminal',
      component: 'ToolGroup',
      props: { calls, isActive: false, isExpanded: false },
      viewport: VIEWPORT,
    })

    expect((await ui.findAll({ type: 'Image' })).map(image => image.props.alt)).toEqual([
      'one.img · 16×12',
      'three.img · 16×12',
    ])
  })

  test("a group's pictures share one drawing's 2 MiB of source", async ($, on) => {
    engineRow(on)
    const calls = ['one', 'two', 'three'].map(id => readRow(id, 'image/jpeg', MEDIUM_JPEG))

    const ui = await $.ui.mount({
      plugin: 'images',
      surface: 'terminal',
      component: 'ToolGroup',
      props: { calls, isActive: false, isExpanded: false },
      viewport: VIEWPORT,
    })

    const bytes = (await ui.findAll({ type: 'Image' })).map(
      image => Uint8Array.fromBase64((image.props.source as { rgba: string }).rgba).length,
    )

    expect(bytes).toHaveLength(3)
    expect(bytes.reduce((sum, each) => sum + each, 0)).toBeLessThanOrEqual(MAX_SOURCE_BYTES)
  })

  test('pressing the caption hides the picture, and again shows it', async ($, on) => {
    engineRow(on)
    const ui = await mountRow($, readRow('shot', 'image/png', TINY_PNG, '/work/shot.png'))

    await ui.press({ key: 'shot#0' })

    expect(await ui.find({ type: 'Image' })).toBeUndefined()
    expect((await ui.find({ type: 'Button' }))?.text).toBe('▸ shot.png · 16×12')

    await ui.press({ key: 'shot#0' })

    expect(await ui.find({ type: 'Image' })).toBeDefined()
    expect((await ui.find({ type: 'Button' }))?.text).toBe('▾ shot.png · 16×12')
  })

  test("a picture hidden under a group's line stays hidden on its call's row", async ($, on) => {
    engineRow(on)
    const row = readRow('both', 'image/png', TINY_PNG)

    const group = await $.ui.mount({
      plugin: 'images',
      surface: 'terminal',
      component: 'ToolGroup',
      props: { calls: [row], isActive: false, isExpanded: false },
      viewport: VIEWPORT,
    })

    await group.press({ key: 'both#0' })

    expect(await (await mountRow($, row)).find({ type: 'Image' })).toBeUndefined()
  })

  test('a click on the picture hides it', async ($, on) => {
    engineRow(on)
    const ui = await mountRow($, readRow('click', 'image/png', TINY_PNG))
    const target = { in: 'click click#0' }

    await ui.resize({ columns: 2, rows: 1, ...target })
    await ui.pointer({ type: 'down', x: 1, y: 0, button: 'left', ...target })
    await ui.pointer({ type: 'up', x: 1, y: 0, button: 'left', ...target })

    expect(await ui.find({ type: 'Image' })).toBeUndefined()
  })

  test('a press dragged off the picture, or a right click, leaves it shown', async ($, on) => {
    engineRow(on)
    const ui = await mountRow($, readRow('drag', 'image/png', TINY_PNG))
    const target = { in: 'click drag#0' }

    await ui.resize({ columns: 2, rows: 1, ...target })
    await ui.pointer({ type: 'down', x: 0, y: 0, button: 'left', ...target })
    await ui.pointer({ type: 'up', x: 9, y: 3, button: 'left', ...target })
    await ui.pointer({ type: 'down', x: 0, y: 0, button: 'right', ...target })
    await ui.pointer({ type: 'up', x: 0, y: 0, button: 'right', ...target })

    expect(await ui.find({ type: 'Image' })).toBeDefined()
  })

  test("an MCP tool's image blocks draw under its row, each named for the tool", async ($, on) => {
    engineRow(on)
    const image = { type: 'image', source: { type: 'base64', media_type: 'image/png', data: TINY_PNG } }

    const ui = await mountRow($, {
      ...readRow('mcp', 'image/png', TINY_PNG),
      tool: 'mcp__shots__screenshot',
      output: [{ type: 'text', text: 'two shots' }, image, image],
    })

    expect((await ui.findAll({ type: 'Image' })).map(found => found.props.alt)).toEqual([
      'screenshot 1 · 16×12',
      'screenshot 2 · 16×12',
    ])
  })

  test('an image pasted into a prompt draws under it', async ($, on) => {
    engineRow(on)
    on('session.messages', () => ({
      value: [
        { role: 'user' as const, content: [{ type: 'text', text: 'earlier' }] },
        {
          role: 'user' as const,
          content: [
            { type: 'text', text: '[Image #1] what is this?' },
            { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: TINY_JPEG } },
          ],
        },
      ],
    }))

    const ui = await $.ui.mount({
      plugin: 'images',
      surface: 'terminal',
      component: 'UserMessage',
      requestId: 'message-1',
      props: { text: '[Image #1] what is this?', origin: { kind: 'composer' }, isExpanded: false },
      viewport: VIEWPORT,
    })

    expect((await ui.find({ type: 'Image' }))?.props.alt).toBe('Image #1 · 16×12')
    expect((await ui.find({ type: 'Button' }))?.key).toBe('message-1#0')
  })

  test('a prompt whose message is not stored yet draws its row alone', async ($, on) => {
    engineRow(on)
    on('session.messages', () => ({ value: [] }))

    const ui = await $.ui.mount({
      plugin: 'images',
      surface: 'terminal',
      component: 'UserMessage',
      props: { text: '[Image #1] what is this?', origin: { kind: 'composer' }, isExpanded: false },
      viewport: VIEWPORT,
    })

    expect(await ui.drawn()).toEqual({ type: 'Text', children: ['engine UserMessage'] })
  })

  test('the session registers /images', async ($, on) => {
    const registered: string[] = []
    on('session.start', ($, e) => ({ cwd: e.cwd }))
    on('command.register', ($, e) => {
      registered.push(e.name)

      return { value: { command: e.name } }
    })

    await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/work' })

    expect(registered).toEqual(['images'])
  })

  test('/images off draws every row alone, and /images turns them back on', async ($, on) => {
    engineRow(on)
    const run = (args: string) => $.command.run({ command: 'images', args, origin: { kind: 'composer' }, presentation: PRESENTATION })

    expect((await run('off')).text).toBe('Pictures are off for this session.')

    const ui = await mountRow($, readRow('off', 'image/png', TINY_PNG))

    expect(await ui.drawn()).toEqual({ type: 'Text', children: ['engine ToolUse'] })
    expect((await run('')).text).toBe('Pictures are on.')
    expect(await ui.find({ type: 'Image' })).toBeDefined()
  })

  test('/images with another argument says how to use it and changes nothing', async ($, on) => {
    engineRow(on)
    const { text } = await $.command.run({
      command: 'images',
      args: 'maybe',
      origin: { kind: 'composer' },
      presentation: PRESENTATION,
    })

    expect(text).toBe('Usage: /images [on|off]. "maybe" is neither.')
    expect(await (await mountRow($, readRow('kept', 'image/png', TINY_PNG))).find({ type: 'Image' })).toBeDefined()
  })

  test('an expanded group leaves the pictures to its rows', async ($, on) => {
    engineRow(on)
    const ui = await $.ui.mount({
      plugin: 'images',
      surface: 'terminal',
      component: 'ToolGroup',
      props: { calls: [readRow('one', 'image/png', TINY_PNG)], isActive: false, isExpanded: true },
      viewport: VIEWPORT,
    })

    expect(await ui.findAll({ type: 'Image' })).toEqual([])
  })
})
