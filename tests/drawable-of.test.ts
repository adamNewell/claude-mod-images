import { describe, expect, test, tier } from 'claude-code/testing'

import { drawableOf } from '../hooks/drawable-of'
import { PNGS, TINY_PNG } from './fixtures'

tier('user')

// Under every fixture PNG's own size and over its 8 bytes of pixels, so each
// is decoded and none shrunk.
const OVER_PNG_UNDER_PIXELS = 16

const pixelsOf = (base64: string) => {
  const drawable = drawableOf({ id: 'p', base64, mediaType: 'image/png', name: 'p.png' }, OVER_PNG_UNDER_PIXELS)

  if (!('source' in drawable) || !('rgba' in drawable.source)) {
    throw new Error(`not drawn as pixels: ${JSON.stringify(drawable)}`)
  }

  return [...Uint8Array.fromBase64(drawable.source.rgba)]
}

describe('drawable-of', () => {
  test('a PNG within its share is drawn as it is, sized by its header', () => {
    expect(drawableOf({ id: 'a', base64: TINY_PNG, mediaType: 'image/png', name: 'a.png' }, 4096)).toEqual({
      source: { png: TINY_PNG },
      width: 16,
      height: 12,
    })
  })

  test('a PNG over its share is decoded, each colour type to RGBA', () => {
    expect(pixelsOf(PNGS.RGB)).toEqual([255, 0, 0, 255, 0, 255, 0, 255])
    expect(pixelsOf(PNGS.RGBA)).toEqual([255, 0, 0, 128, 0, 0, 255, 0])
    expect(pixelsOf(PNGS.GRAY)).toEqual([0, 0, 0, 255, 200, 200, 200, 255])
    expect(pixelsOf(PNGS.GRAY_ALPHA)).toEqual([50, 50, 50, 100, 250, 250, 250, 255])
    expect(pixelsOf(PNGS.RGB16)).toEqual([0xff, 0x80, 0x01, 255, 0, 0, 0xff, 255])
    expect(pixelsOf(PNGS.PALETTE)).toEqual([40, 50, 60, 7, 10, 20, 30, 255])
  })

  test('a 1-bit grayscale PNG over its share says why it is not drawn', () => {
    expect(drawableOf({ id: 'g', base64: PNGS.GRAY1, mediaType: 'image/png', name: 'g.png' }, 1)).toEqual({
      reason: 'it did not decode: 1-bit grayscale PNGs are not unpacked here',
    })
  })

  test('bytes that are not a PNG say so', () => {
    expect(drawableOf({ id: 'x', base64: 'AAAA', mediaType: 'image/png', name: 'x.png' }, 4096)).toEqual({
      reason: 'the file is not a PNG',
    })
  })
})
