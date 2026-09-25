import { isRecord, type Picture, pictureOfBlock } from '../pictures-of'

/**
 * The marker a prompt's text holds in place of each image pasted into it.
 */
export const PASTED_IMAGE_MARKER = '[Image #'

/**
 * The images pasted into a prompt, from the conversation as the model reads
 * it: the latest user message with a text block equal to the prompt's text,
 * and its image blocks in order, named as the prompt's markers are.
 *
 * A `UserMessage` row carries its text alone, so the text is the link; two
 * prompts of the same text both show the later one's images.
 *
 * @param messages `$.session.messages({ as: 'api' })`
 * @param text the row's text, as typed
 * @param requestId the row's message id, which the pictures' ids start with
 * @returns the images, or null when no message holds the text (not yet
 *   stored, or compacted away)
 */
export const pastedPicturesOf = (
  messages: ReadonlyArray<{ role: string; content: ReadonlyArray<unknown> }>,
  text: string,
  requestId: string,
): Picture[] | null => {
  const message = messages.findLast(
    ({ role, content }) =>
      role === 'user' && content.some(block => isRecord(block) && block.type === 'text' && block.text === text),
  )

  if (!message) {
    return null
  }

  const images = message.content.filter(block => isRecord(block) && block.type === 'image')

  return images.flatMap((block, at) => pictureOfBlock(block, `${requestId}#${at}`, `Image #${at + 1}`) ?? [])
}
