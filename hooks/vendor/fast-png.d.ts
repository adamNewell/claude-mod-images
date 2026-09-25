/**
 * A PNG as fast-png decodes it: samples of `channels` per pixel at `depth`
 * bits, packed below 8; a palette's indices where `palette` is present.
 */
export type DecodedPng = {
  width: number
  height: number
  data: Uint8Array | Uint8ClampedArray | Uint16Array
  depth: 1 | 2 | 4 | 8 | 16
  channels: number
  palette?: number[][]
}

/**
 * fast-png's decoder, as `hooks/vendor/fast-png.js` bundles it.
 */
export declare const decode: (png: Uint8Array) => DecodedPng

/**
 * A palette PNG's pixels as RGB, or RGBA where its palette carries alpha.
 */
export declare const convertIndexedToRgb: (png: DecodedPng) => Uint8Array
