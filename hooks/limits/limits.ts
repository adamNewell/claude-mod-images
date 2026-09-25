/**
 * The most bytes of Image source one drawing may hold, decoded, its pictures
 * together: the engine refuses a tree past it.
 */
export const MAX_SOURCE_BYTES = 2 * 1024 * 1024

/**
 * The widest or tallest `{ rgba }` source, in pixels (ImageSource's 2048).
 */
export const MAX_RGBA_SIDE = 2048

/**
 * The most cells an Image takes on either axis (ImageProps' 255).
 */
export const MAX_IMAGE_CELLS = 255

/**
 * The cells a picture sits in from the transcript's left edge: under a tool
 * row's result, past its `  ⎿  `.
 */
export const INDENT_COLUMNS = 5

/**
 * A terminal cell's width over its height. The viewport reports cells, never
 * pixels, so this is the common monospace ratio.
 */
export const CELL_ASPECT = 0.5

/**
 * The pixels a cell is taken to span across, so a small picture (an icon)
 * draws near its own size and is not blown up to the row's width.
 */
export const CELL_PIXELS = 8

/**
 * How many decoded pictures stay held, most recently drawn first; a row
 * drawn again past them decodes again.
 */
export const MAX_HELD_PICTURES = 16

/**
 * The width assumed where no terminal has measured, as `command.run`'s 80.
 */
export const UNMEASURED_COLUMNS = 80

/**
 * The height assumed where no terminal has measured.
 */
export const UNMEASURED_ROWS = 24
