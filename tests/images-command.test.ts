import { describe, expect, test, tier } from 'claude-code/testing'

import { isOffAfter } from '../hooks/images-command'

tier('user')

describe('images-command', () => {
  test('on and off say, in any case and spacing', () => {
    expect(isOffAfter('off', false)).toBe(true)
    expect(isOffAfter(' OFF ', false)).toBe(true)
    expect(isOffAfter('on', true)).toBe(false)
  })

  test('nothing flips the current state', () => {
    expect(isOffAfter('', false)).toBe(true)
    expect(isOffAfter('  ', true)).toBe(false)
  })

  test('any other argument is null', () => {
    expect(isOffAfter('toggle', false)).toBeNull()
  })
})
