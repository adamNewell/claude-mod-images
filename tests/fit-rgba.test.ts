import { describe, expect, test, tier } from 'claude-code/testing'

import { fitRgba } from '../hooks/fit-rgba'
import { MAX_RGBA_SIDE, MAX_SOURCE_BYTES } from '../hooks/limits'

tier('user')

const solid = (width: number, height: number, pixel: number[]) => ({
  data: Uint8Array.from({ length: width * height * 4 }, (_, at) => pixel[at % 4]!),
  width,
  height,
})

describe('fit-rgba', () => {
  test('pixels that fit are kept as they are', () => {
    const rgba = solid(16, 12, [1, 2, 3, 4])

    expect(fitRgba(rgba, MAX_SOURCE_BYTES)).toBe(rgba)
  })

  test('a 1600 by 1200 picture shrinks under 2 MiB, its aspect and colour kept', () => {
    const { data, width, height } = fitRgba(solid(1600, 1200, [200, 100, 50, 255]), MAX_SOURCE_BYTES)

    expect(data.length).toBeLessThanOrEqual(MAX_SOURCE_BYTES)
    expect(data.length).toBe(width * height * 4)
    expect([width, height]).toEqual([836, 627])
    expect([...data.subarray(0, 4)]).toEqual([200, 100, 50, 255])
  })

  test('a strip wider than 2048 pixels is cut to 2048 across', () => {
    const { width, height } = fitRgba(solid(4096, 2, [0, 0, 0, 255]), MAX_SOURCE_BYTES)

    expect(width).toBe(MAX_RGBA_SIDE)
    expect(height).toBe(1)
  })

  test('each pixel out is the mean of the block it covers', () => {
    // 3000 by 1: halves of black and white, shrunk to 2048 across.
    const data = new Uint8Array(3000 * 4)
    data.fill(255, 1500 * 4)

    const out = fitRgba({ data, width: 3000, height: 1 }, MAX_SOURCE_BYTES).data

    expect(out[0]).toBe(0)
    expect(out[out.length - 1]).toBe(255)
  })
})
