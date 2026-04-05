import { describe, expect, it } from 'vitest'
import { arrowSegment, layoutPositions } from './topology'

describe('arrowSegment', () => {
  it('returns finite endpoints and label point inside view for a horizontal pair', () => {
    const from = { x: 100, y: 200 }
    const to = { x: 500, y: 200 }
    const s = arrowSegment(from, to, 10, 40)
    expect(Number.isFinite(s.x1)).toBe(true)
    expect(Number.isFinite(s.x2)).toBe(true)
    expect(s.x1).toBeLessThan(s.x2)
    expect(Math.abs(s.y1 - s.y2)).toBeLessThan(1)
    expect(s.lx).toBeGreaterThan(0)
    expect(s.ly).toBeGreaterThan(0)
  })

  it('respects screenParallel offset', () => {
    const from = { x: 100, y: 400 }
    const to = { x: 100, y: 100 }
    const base = arrowSegment(from, to, 0, 30)
    const parallel = arrowSegment(from, to, 0, 30, { screenParallel: { x: -28, y: 0 } })
    expect(parallel.x1 - base.x1).toBeCloseTo(-28, 5)
  })
})

describe('layoutPositions', () => {
  it('places nodes at finite, separated positions', () => {
    const p = layoutPositions(800, 480)
    const ids = ['Root', 'Tld', 'Auth', 'Local', 'Host'] as const
    for (const id of ids) {
      expect(Number.isFinite(p[id].x)).toBe(true)
      expect(Number.isFinite(p[id].y)).toBe(true)
    }
    expect(p.Root.y).toBeLessThan(p.Host.y)
    expect(p.Tld.x).not.toBe(p.Local.x)
  })
})
