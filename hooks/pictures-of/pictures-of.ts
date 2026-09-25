/**
 * A picture to draw: an id unique in the session (its call's or message's,
 * with its place there), the bytes as the model saw them (Read may re-encode,
 * a PNG read as JPEG), their MIME type and a name to show.
 */
export type Picture = {
  id: string
  base64: string
  mediaType: string
  name: string
}

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

/**
 * The picture a Messages API image block holds (`{ type: 'image', source:
 * { type: 'base64', media_type, data } }`), as MCP results and pasted
 * images carry them.
 *
 * @param block any content block
 * @param id the picture's id
 * @param name the name to show
 * @returns the picture, or null for any other block
 */
export const pictureOfBlock = (block: unknown, id: string, name: string): Picture | null => {
  if (!isRecord(block) || block.type !== 'image' || !isRecord(block.source)) {
    return null
  }

  const { type, media_type, data } = block.source

  if (type !== 'base64' || typeof media_type !== 'string' || typeof data !== 'string') {
    return null
  }

  return { id, base64: data, mediaType: media_type, name }
}

const readPictureOf = (id: string, input: unknown, output: unknown): Picture[] => {
  if (!isRecord(output) || output.type !== 'image' || !isRecord(output.file)) {
    return []
  }

  const { base64, type } = output.file

  if (typeof base64 !== 'string' || typeof type !== 'string') {
    return []
  }

  const path = isRecord(input) && typeof input.file_path === 'string' ? input.file_path : 'image'

  return [{ id: `${id}#0`, base64, mediaType: type, name: path.slice(path.lastIndexOf('/') + 1) }]
}

const mcpPicturesOf = (id: string, tool: string, output: unknown): Picture[] => {
  if (!Array.isArray(output)) {
    return []
  }

  const images = output.filter(block => isRecord(block) && block.type === 'image')
  const name = tool.slice(tool.lastIndexOf('__') + 2)

  return images.flatMap(
    (block, at) => pictureOfBlock(block, `${id}#${at}`, images.length > 1 ? `${name} ${at + 1}` : name) ?? [],
  )
}

/**
 * The pictures a finished tool call returned: a Read of an image, or the
 * image blocks of an MCP tool's result, in order.
 *
 * @param call a `ToolUse` row's props or one of a `ToolGroup`'s calls
 * @returns its pictures; none for any other call, a running one, and a group
 *   call with no id (a desktop host's, never the terminal's)
 */
export const picturesOf = (call: {
  tool_use_id?: string
  tool: string
  input: unknown
  output?: unknown
}): Picture[] => {
  const { tool_use_id, tool, input, output } = call

  if (tool_use_id === undefined) {
    return []
  }

  if (tool === 'Read') {
    return readPictureOf(tool_use_id, input, output)
  }

  return tool.startsWith('mcp__') ? mcpPicturesOf(tool_use_id, tool, output) : []
}
