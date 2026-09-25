/**
 * jpeg-js's decoder, as `hooks/vendor/jpeg-js.js` bundles it: a whole JPEG
 * file to pixels, a Uint8Array under `useTArray` (no `Buffer` here).
 */
declare const decode: (
  jpeg: Uint8Array,
  options: {
    useTArray: true
    formatAsRGBA: true
    maxResolutionInMP?: number
    maxMemoryUsageInMB?: number
  },
) => { width: number; height: number; data: Uint8Array }

export default decode
