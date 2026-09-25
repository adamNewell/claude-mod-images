import type { RenderViewport } from 'claude-code'

import type { Cells } from '../cells-of'
import { INDENT_COLUMNS, UNMEASURED_COLUMNS, UNMEASURED_ROWS } from '../limits'

/**
 * The most cells a picture's image may take under a transcript row: the
 * width past the indent, and `maxRows` or half the terminal's height,
 * whichever is less, less the caption's row.
 *
 * @param viewport the terminal's size, from `e.viewport`
 * @param maxRows the `maxRows` option
 * @returns the room, never under 1 row
 */
export const roomOf = (viewport: RenderViewport | undefined, maxRows: number): Cells => ({
  columns: (viewport?.columns ?? UNMEASURED_COLUMNS) - INDENT_COLUMNS,
  rows: Math.max(1, Math.min(maxRows, Math.floor((viewport?.rows ?? UNMEASURED_ROWS) / 2)) - 1),
})
