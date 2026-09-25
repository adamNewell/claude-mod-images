import { MAX_IMAGE_CELLS } from '../limits'

/**
 * The `maxRows` option as a count of rows: a picture's image and its caption
 * together, so 2 (one row of image) to 256 (an image's 255 and the caption).
 *
 * @param value `options.maxRows`, as the manifest's `userConfig` declares it
 * @returns the rows
 * @throws on anything else, so the module does not load and the transcript
 *   names the value, where a quiet fallback would hide the typo
 */
export const maxRowsOf = (value: unknown): number => {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 2 || value > MAX_IMAGE_CELLS + 1) {
    throw new RangeError(`images: maxRows must be a whole number from 2 to ${MAX_IMAGE_CELLS + 1}; it is ${JSON.stringify(value)}`)
  }

  return value
}
