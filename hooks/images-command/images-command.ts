/**
 * What `session.start` hands `$.command.register` for `/images`.
 */
export const IMAGES_COMMAND = {
  name: 'images',
  description: 'Stop or start drawing pictures in the transcript',
  argumentHint: '[on|off]',
  immediate: true,
} as const

/**
 * Whether pictures are off once `/images` runs with `args`: `on` and `off`
 * say, nothing flips the current state.
 *
 * @param args what followed `/images`
 * @param isOff whether pictures are off now
 * @returns whether they are off after, or null for any other argument
 */
export const isOffAfter = (args: string, isOff: boolean): boolean | null => {
  switch (args.trim().toLowerCase()) {
    case '':
      return !isOff
    case 'on':
      return false
    case 'off':
      return true
    default:
      return null
  }
}
