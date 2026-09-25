import type { RenderPropsOf } from 'claude-code'

/**
 * A finished Read row's props for a picture of `mediaType`, read from `path`.
 */
export const readRow = (
  tool_use_id: string,
  mediaType: string,
  base64: string,
  path = `/work/${tool_use_id}.img`,
): RenderPropsOf['ToolUse'] => ({
  tool_use_id,
  tool: 'Read',
  input: { file_path: path },
  isRunning: false,
  isErrored: false,
  isInterrupted: false,
  output: {
    type: 'image',
    file: { base64, type: mediaType, originalSize: 1 },
  },
})
