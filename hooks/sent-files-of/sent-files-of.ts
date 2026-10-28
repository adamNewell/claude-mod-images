import { isRecord } from '../pictures-of'

/**
 * An image file a `SendUserFile` call delivered. Its result names the file
 * but holds no bytes, so the picture is read from disk to draw it.
 */
export type SentFile = {
  id: string
  path: string
  mediaType: string
  name: string
}

/**
 * The image attachments of a finished `SendUserFile` call, in order.
 *
 * @param call a `ToolUse` row's props or one of a `ToolGroup`'s calls
 * @returns its image files; none for any other call, a running one, and a
 *   group call with no id
 */
export const sentFilesOf = (call: { tool_use_id?: string; tool: string; output?: unknown }): SentFile[] => {
  const { tool_use_id, tool, output } = call

  if (tool_use_id === undefined || tool !== 'SendUserFile' || !isRecord(output) || !Array.isArray(output.attachments)) {
    return []
  }

  const images = output.attachments.filter(
    (attachment): attachment is { path: string; media_type: string } =>
      isRecord(attachment) &&
      attachment.isImage === true &&
      typeof attachment.path === 'string' &&
      typeof attachment.media_type === 'string',
  )

  return images.map(({ path, media_type }, at) => ({
    id: `${tool_use_id}#${at}`,
    path,
    mediaType: media_type,
    name: path.slice(path.lastIndexOf('/') + 1),
  }))
}
