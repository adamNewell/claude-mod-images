// The environment's Uint8Array base64 methods (TC39 proposal-arraybuffer-base64),
// which the engine's own examples use and es2023's lib does not declare.
declare global {
  interface Uint8Array {
    toBase64(): string
  }
  interface Uint8ArrayConstructor {
    fromBase64(base64: string): Uint8Array
  }
}

export {}
