import { CELL_ASPECT, CELL_PIXELS, MAX_IMAGE_CELLS } from '../limits'

/**
 * A box of terminal cells.
 */
export type Cells = {
  columns: number
  rows: number
}

const clampCells = (cells: number) =>
  Math.min(MAX_IMAGE_CELLS, Math.max(1, Math.round(cells)))

/**
 * The box a picture draws in: its own aspect, as wide as the room allows and
 * no taller, never wider than its pixels span.
 *
 * @param width the picture's width in pixels
 * @param height the picture's height in pixels
 * @param room the most cells it may take across and down
 * @returns the columns and rows, each 1 to 255
 */
export const cellsOf = (width: number, height: number, room: Cells): Cells => {
  const columns = clampCells(
    Math.min(
      room.columns,
      width / CELL_PIXELS,
      (room.rows * width) / (height * CELL_ASPECT),
    ),
  )

  return {
    columns,
    rows: clampCells((columns * height * CELL_ASPECT) / width),
  }
}
