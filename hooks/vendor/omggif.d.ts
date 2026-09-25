/**
 * omggif's reader, as `hooks/vendor/omggif.js` bundles it: a whole GIF file,
 * each frame blitted as RGBA onto a canvas of the file's size.
 */
declare const omggif: {
  GifReader: new (gif: Uint8Array) => {
    width: number
    height: number
    decodeAndBlitFrameRGBA: (frame: number, pixels: Uint8Array) => void
  }
}

export default omggif
