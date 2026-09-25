import { MAX_RGBA_SIDE } from '../limits'

/**
 * Pixels, 4 bytes each, row-major.
 */
export type Rgba = {
  data: Uint8Array
  width: number
  height: number
}

/**
 * The pixels shrunk, each output pixel the mean of the block it covers, to
 * fit an Image's `{ rgba }` source; the terminal scales them to the box.
 *
 * @param rgba decoded pixels of any size
 * @param maxBytes the most bytes the pixels may take
 * @returns the same pixels when they fit, else a smaller copy that does
 */
export const fitRgba = (rgba: Rgba, maxBytes: number): Rgba => {
  const { data, width, height } = rgba

  const scale = Math.min(
    1,
    Math.sqrt(maxBytes / 4 / (width * height)),
    MAX_RGBA_SIDE / width,
    MAX_RGBA_SIDE / height,
  )

  if (scale === 1) {
    return rgba
  }

  const outWidth = Math.max(1, Math.floor(width * scale))
  const outHeight = Math.max(1, Math.floor(height * scale))
  const out = new Uint8Array(outWidth * outHeight * 4)

  for (let y = 0; y < outHeight; y++) {
    const top = Math.floor((y * height) / outHeight)
    const bottom = Math.max(top + 1, Math.floor(((y + 1) * height) / outHeight))

    for (let x = 0; x < outWidth; x++) {
      const left = Math.floor((x * width) / outWidth)
      const right = Math.max(left + 1, Math.floor(((x + 1) * width) / outWidth))
      const sums = [0, 0, 0, 0]

      for (let sy = top; sy < bottom; sy++) {
        for (let sx = left; sx < right; sx++) {
          const at = (sy * width + sx) * 4

          for (let channel = 0; channel < 4; channel++) {
            sums[channel]! += data[at + channel]!
          }
        }
      }

      const count = (bottom - top) * (right - left)
      const at = (y * outWidth + x) * 4

      for (let channel = 0; channel < 4; channel++) {
        out[at + channel] = Math.round(sums[channel]! / count)
      }
    }
  }

  return { data: out, width: outWidth, height: outHeight }
}
