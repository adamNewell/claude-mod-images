import { describe, expect, test, tier } from 'claude-code/testing'

import { cellsOf } from '../hooks/cells-of'

tier('user')

describe('cells-of', () => {
  const ROOM = { columns: 95, rows: 20 }

  test('a square photo is as tall as the room, twice as wide in cells', () => {
    expect(cellsOf(800, 800, ROOM)).toEqual({ columns: 40, rows: 20 })
  })

  test('a wide screenshot fills the width and keeps its aspect', () => {
    expect(cellsOf(1920, 400, ROOM)).toEqual({ columns: 95, rows: 10 })
  })

  test('an icon draws near its own size', () => {
    expect(cellsOf(32, 32, ROOM)).toEqual({ columns: 4, rows: 2 })
  })

  test('a room of none still draws one cell', () => {
    expect(cellsOf(800, 800, { columns: 0, rows: 0 })).toEqual({ columns: 1, rows: 1 })
  })

  test('a tall strip is held to 255 rows at most', () => {
    expect(cellsOf(10, 100_000, { columns: 95, rows: 1000 }).rows).toBe(255)
  })
})
