import { describe, it, expect } from 'vite-plus/test'
import { detectEnvironment, compareLT2, formatPaceFromSeconds } from './lt2-comparison'
import type { Metadata } from '@/types/running'

function makeMeta(overrides: Partial<Metadata> = {}): Metadata {
  return { type: 'easy', location: 'road', ...overrides }
}

describe('detectEnvironment', () => {
  it('null 메타데이터 → null', () => {
    expect(detectEnvironment(null)).toBeNull()
  })

  it('trail 위치 → trail', () => {
    expect(detectEnvironment(makeMeta({ location: 'trail' }))).toBe('trail')
  })

  it('트레드밀 경사 6% → incline_6', () => {
    expect(
      detectEnvironment(
        makeMeta({ location: 'treadmill', treadmill: { incline: 6, workSpeed: 10, restSpeed: 6 } }),
      ),
    ).toBe('incline_6')
  })

  it('트레드밀 경사 2% → incline_2', () => {
    expect(
      detectEnvironment(
        makeMeta({ location: 'treadmill', treadmill: { incline: 2, workSpeed: 10, restSpeed: 6 } }),
      ),
    ).toBe('incline_2')
  })

  it('트레드밀 경사 없음 → flat', () => {
    expect(detectEnvironment(makeMeta({ location: 'treadmill' }))).toBe('flat')
  })

  it('도로 → flat', () => {
    expect(detectEnvironment(makeMeta({ location: 'road' }))).toBe('flat')
  })
})

describe('compareLT2', () => {
  const benchmark = {
    id: 1,
    environment: 'flat',
    paceSeconds: 270,
    date: '2026-04-01',
    notes: null,
  }

  it('실제 페이스가 더 빠르면 improved=true', () => {
    const result = compareLT2('4:20', benchmark)
    expect(result).not.toBeNull()
    expect(result!.improved).toBe(true)
    expect(result!.diffSeconds).toBe(10)
  })

  it('실제 페이스가 더 느리면 improved=false', () => {
    const result = compareLT2('4:40', benchmark)
    expect(result).not.toBeNull()
    expect(result!.improved).toBe(false)
    expect(result!.diffSeconds).toBe(-10)
  })

  it('null 페이스 → null', () => {
    expect(compareLT2(null, benchmark)).toBeNull()
  })
})

describe('formatPaceFromSeconds', () => {
  it('270초 → 4:30', () => {
    expect(formatPaceFromSeconds(270)).toBe('4:30')
  })

  it('305초 → 5:05', () => {
    expect(formatPaceFromSeconds(305)).toBe('5:05')
  })
})
