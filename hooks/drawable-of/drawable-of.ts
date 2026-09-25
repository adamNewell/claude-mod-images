import type { ImageSource } from 'claude-code'

import { fitRgba, type Rgba } from '../fit-rgba'
import type { Picture } from '../pictures-of'
import { convertIndexedToRgb, decode as decodePng, type DecodedPng } from '../vendor/fast-png.js'
import decodeJpeg from '../vendor/jpeg-js.js'
import omggif from '../vendor/omggif.js'

/**
 * A picture ready for an Image, its size in pixels; or why it cannot be.
 */
export type Drawable =
  | { source: ImageSource; width: number; height: number }
  | { reason: string }

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]

const rgbaOfPng = (png: DecodedPng): Rgba => {
  const { width, height, depth, palette } = png

  if (depth < 8 && !palette) {
    throw new Error(`${depth}-bit grayscale PNGs are not unpacked here`)
  }

  const samples = palette ? convertIndexedToRgb(png) : png.data
  const channels = palette ? (palette[0]?.length ?? 3) : png.channels
  const shift = depth === 16 ? 8 : 0
  const data = new Uint8Array(width * height * 4)

  for (let pixel = 0; pixel < width * height; pixel++) {
    const at = pixel * channels
    const sample = (offset: number) => samples[at + offset]! >> shift
    const gray = channels < 3

    data[pixel * 4] = sample(0)
    data[pixel * 4 + 1] = sample(gray ? 0 : 1)
    data[pixel * 4 + 2] = sample(gray ? 0 : 2)
    data[pixel * 4 + 3] = channels === 2 || channels === 4 ? sample(channels - 1) : 255
  }

  return { data, width, height }
}

const pngOf = (bytes: Uint8Array, base64: string, maxBytes: number): Drawable => {
  if (bytes.length < 24 || PNG_SIGNATURE.some((byte, at) => bytes[at] !== byte)) {
    return { reason: 'the file is not a PNG' }
  }

  if (bytes.length > maxBytes) {
    return rgbaOf(rgbaOfPng(decodePng(bytes)), maxBytes)
  }

  // IHDR is always the first chunk: its width and height at bytes 16 and 20.
  const header = new DataView(bytes.buffer, bytes.byteOffset, 24)

  return {
    source: { png: base64 },
    width: header.getUint32(16),
    height: header.getUint32(20),
  }
}

const rgbaOf = (rgba: Rgba, maxBytes: number): Drawable => {
  const { data, width, height } = fitRgba(rgba, maxBytes)

  return { source: { rgba: data.toBase64(), width, height }, width, height }
}

const rgbaOfGif = (bytes: Uint8Array): Rgba => {
  const reader = new omggif.GifReader(bytes)
  const data = new Uint8Array(reader.width * reader.height * 4)

  reader.decodeAndBlitFrameRGBA(0, data)

  return { data, width: reader.width, height: reader.height }
}

/**
 * The picture as an Image source within `maxBytes`: a PNG as it is where it
 * fits, else decoded and shrunk, as a JPEG is and a GIF's first frame.
 *
 * @param picture a Read call's picture
 * @param maxBytes the most source bytes it may take: its share of the tree's
 * @returns the source and pixel size, or the reason it draws as text
 */
export const drawableOf = (picture: Picture, maxBytes: number): Drawable => {
  try {
    const bytes = Uint8Array.fromBase64(picture.base64)

    switch (picture.mediaType) {
      case 'image/png':
        return pngOf(bytes, picture.base64, maxBytes)
      case 'image/jpeg':
        return rgbaOf(decodeJpeg(bytes, { useTArray: true, formatAsRGBA: true }), maxBytes)
      case 'image/gif':
        return rgbaOf(rgbaOfGif(bytes), maxBytes)
      default:
        return { reason: `no decoder for ${picture.mediaType} here` }
    }
  } catch (error) {
    return { reason: `it did not decode: ${error instanceof Error ? error.message : String(error)}` }
  }
}
