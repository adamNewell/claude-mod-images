import { describe, expect, test, tier } from 'claude-code/testing'

import { maxRowsOf } from '../hooks/max-rows-of'

tier('user')

describe('max-rows-of', () => {
  test('a whole number from 2 to 256 is the rows', () => {
    expect(maxRowsOf(2)).toBe(2)
    expect(maxRowsOf(20)).toBe(20)
    expect(maxRowsOf(256)).toBe(256)
  })

  test('anything else throws, naming the value', () => {
    expect(() => maxRowsOf(1)).toThrow('images: maxRows must be a whole number from 2 to 256; it is 1')
    expect(() => maxRowsOf(257)).toThrow('it is 257')
    expect(() => maxRowsOf(7.5)).toThrow('it is 7.5')
    expect(() => maxRowsOf('20')).toThrow('it is "20"')
    expect(() => maxRowsOf(undefined)).toThrow('it is undefined')
  })
})
