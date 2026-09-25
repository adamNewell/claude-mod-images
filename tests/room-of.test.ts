import { describe, expect, test, tier } from 'claude-code/testing'

import { roomOf } from '../hooks/room-of'

tier('user')

describe('room-of', () => {
  test('maxRows less the caption, the width past the indent', () => {
    expect(roomOf({ columns: 100, rows: 60 }, 20)).toEqual({ columns: 95, rows: 19 })
  })

  test('a short terminal gives half its height, caption included', () => {
    expect(roomOf({ columns: 100, rows: 24 }, 20)).toEqual({ columns: 95, rows: 11 })
  })

  test('an unmeasured terminal is taken as 80 by 24', () => {
    expect(roomOf(undefined, 20)).toEqual({ columns: 75, rows: 11 })
  })

  test('the image keeps at least one row', () => {
    expect(roomOf({ columns: 100, rows: 2 }, 2)).toEqual({ columns: 95, rows: 1 })
  })
})
