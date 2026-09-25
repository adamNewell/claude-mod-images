// Bundles each decoder into hooks/vendor as one ES module, its licenses on
// top: a hooks module imports only the plugin's own files and has no Node or WASM.

const DECODERS = [
  {
    entry: 'node_modules/jpeg-js/lib/decoder.js',
    licenses: ['node_modules/jpeg-js/lib/decoder.js', 'node_modules/jpeg-js/LICENSE'],
    out: 'jpeg-js.js',
  },
  {
    entry: 'node_modules/omggif/omggif.js',
    licenses: ['node_modules/omggif/omggif.js'],
    out: 'omggif.js',
  },
  {
    entry: 'scripts/fast-png-decode.ts',
    licenses: [
      'node_modules/fast-png/LICENSE',
      'node_modules/fflate/LICENSE',
      'node_modules/iobuffer/LICENSE',
    ],
    out: 'fast-png.js',
  },
]

// The environment's TextDecoder takes UTF-8 alone; fast-png builds a latin1
// one at load for PNG text chunks. Latin-1 is one code point per byte.
const PATCHES = [
  {
    file: /fast-png\/lib\/helpers\/text\.js$/,
    from: "new TextDecoder('latin1')",
    to: '{ decode: bytes => Array.from(bytes, byte => String.fromCharCode(byte)).join(\'\') }',
  },
]

const patching: Bun.BunPlugin = {
  name: 'patch',
  setup(build) {
    for (const { file, from, to } of PATCHES) {
      build.onLoad({ filter: file }, async ({ path }) => {
        const source = await Bun.file(path).text()

        if (!source.includes(from)) {
          throw new Error(`${path} no longer holds ${from}: re-check the patch`)
        }

        return { contents: source.replace(from, to), loader: 'js' }
      })
    }
  },
}

// A source file's license is its leading comment block; a LICENSE file is whole.
const noticeOf = async (path: string) => {
  const text = await Bun.file(path).text()

  if (!/\.[cm]?js$/.test(path)) {
    return `/*\n${text.trim()}\n*/`
  }

  return text.match(/^(?:\s*(?:\/\*[\s\S]*?\*\/|\/\/[^\n]*))+/)?.[0].trim() ?? ''
}

for (const { entry, licenses, out } of DECODERS) {
  const notices = await Promise.all(licenses.map(noticeOf))

  const built = await Bun.build({
    entrypoints: [entry],
    outdir: 'hooks/vendor',
    naming: out,
    format: 'esm',
    target: 'browser',
    plugins: [patching],
    banner: `${notices.join('\n')}\n`,
  })

  if (!built.success) {
    throw new AggregateError(built.logs, `bundling ${entry} failed`)
  }
}
