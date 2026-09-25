# images

A Claude Mod that draws pictures right in the terminal transcript:

- **Reads.** When Claude runs `Read` on a PNG, JPEG, or GIF, the picture shows
  under the row.
- **MCP tools.** Image blocks in an MCP tool's result (browser screenshots,
  charts) show under its row.
- **Pastes.** Images you paste or drag into a prompt show under that prompt.

In a collapsed group (`Read 3 files`, `Called shots`), the pictures sit side
by side under the line.

It draws through Claude Code's own terminal `Image` element, which speaks the
kitty graphics protocol. That works in kitty and Ghostty. Other terminals get
the `alt` text (`photo.png · 800×800`).

Click a picture to hide it. Its caption stays (`▸ photo.png · 800×800`);
click the caption to show the picture again. Clicking the caption of a shown
picture (`▾`) hides it too. A picture hidden under a group's line stays
hidden on its own row in the ctrl+o transcript. The mouse wheel still scrolls
over a picture.

## Requirements

- Claude Code with function hooks. Built and tested on 2.1.282. Switch them
  on in `~/.claude/settings.json`:

  ```json
  { "env": { "CLAUDE_CODE_ENABLE_FUNCTION_HOOKS": "1" } }
  ```

- A terminal that speaks the kitty graphics protocol (tested in kitty 0.48.2)
- For clicks: Claude Code's fullscreen layout, which is where the terminal
  reports them. `/images` works in either layout.

## Install

From a clone of this repository:

```
/plugin marketplace add /path/to/claude-mod-images
/plugin install images@claude-mod-images
```

Or load it for one session only:

```sh
claude --plugin-dir /path/to/claude-mod-images
```

## Use

- **Click a picture** to hide it; click its caption to show it again.
- **`/images off`** stops every picture for the session, **`/images on`**
  brings them back, and a bare **`/images`** flips between the two. It is the
  way to hide pictures on the main screen, where clicks don't reach them,
  and before you share your screen.
- **Picture height:** `/config` has a *Picture height* row (`maxRows`, 2 to
  256, default 20): the most rows a picture takes, its caption included. A
  short terminal gives a picture half its height at most. In settings:

  ```json
  { "pluginConfigs": { "images@claude-mod-images": { "options": { "maxRows": 12 } } } }
  ```

## What it draws, and what it doesn't

| The image is | Drawn as |
| --- | --- |
| PNG | the PNG as it is, or decoded and shrunk when it is over its share of 2 MiB |
| JPEG | decoded (jpeg-js), shrunk to fit |
| GIF | its first frame (omggif), shrunk to fit |
| WebP | a dim line: `a.webp not drawn: no decoder for image/webp here` |
| 1, 2 or 4-bit grayscale PNG over its share | a dim line saying so |

Note that `Read` re-encodes large images before the model sees them. A 645 KB
PNG arrives as JPEG. The mod draws what the model saw, not the file on disk.

Known limits:

- **Pasted images are found by the prompt's text.** A prompt row carries only
  its text (`[Image #1] what is this?`). The mod finds the latest message in
  the conversation with that exact text and draws its images. Two prompts
  with identical text both show the later one's images. After a compaction
  drops a paste from the conversation, its prompt draws no picture.
- **MCP images by URL** (`source.type: 'url'`) are not fetched. Only base64
  image blocks draw.

## How the click works

`Image` is a leaf with no press handler. Text drawn over it would replace the
placeholder cells that carry its pixels. So each picture has a `Client`
region (`hooks/click-to-hide.tsx`) laid over it that draws nothing. The
pixels show through, and the region hears the pointer. A left press and
release inside it posts the picture's id, and a `ui.message` hook flips its
`isHidden` state.

## Develop

```sh
bun install
bun run check     # typecheck, validate the plugin and marketplace, run the tests
bun run vendor    # rebuild hooks/vendor from node_modules
```

`types/claude-code/` holds the plugin API types, written by `/plugin-types`
from Claude Code 2.1.282 (its first line says which). After a Claude Code
update, run `/plugin-types types/claude-code` in a session here and commit
the result. CI installs the
Claude Code version that first line names, so the engine the tests run
against always matches the types.

`hooks/vendor/` holds the decoders, bundled as ES modules with their licenses
on top. It's committed, because a hooks module can only import the plugin's
own files.
