import { describe, it, expect } from 'vite-plus/test'
import { getZone, getZoneBoundaries, calculateZoneDistribution } from './hr-zones'

describe('getZoneBoundaries', () => {
  it('LTHR 165 기준으로 올바른 경계값을 반환한다', () => {
    const bounds = getZoneBoundaries(165)
    expect(bounds.z1.max).toBe(135)
    expect(bounds.z2.min).toBe(135)
    expect(bounds.z2.max).toBe(147)
    expect(bounds.z3.min).toBe(147)
    expect(bounds.z3.max).toBe(155)
    expect(bounds.z4.min).toBe(155)
    expect(bounds.z4.max).toBe(165)
    expect(bounds.z5.min).toBe(165)
  })
})

describe('getZone', () => {
  const lthr = 165

  it('Z1: LTHR의 82% 미만', () => {
    expect(getZone(130, lthr)).toBe(1)
  })

  it('Z2: 82%~89%', () => {
    expect(getZone(140, lthr)).toBe(2)
  })

  it('Z3: 89%~94%', () => {
    expect(getZone(150, lthr)).toBe(3)
  })

  it('Z4: 94%~100%', () => {
    expect(getZone(160, lthr)).toBe(4)
  })

  it('Z5: 100% 이상', () => {
    expect(getZone(170, lthr)).toBe(5)
  })

  it('경계값: 정확히 LTHR이면 Z5', () => {
    expect(getZone(165, lthr)).toBe(5)
  })
})

describe('calculateZoneDistribution', () => {
  it('모든 HR이 동일 존이면 해당 존 100%', () => {
    const hrs = Array(100).fill(130)
    const dist = calculateZoneDistribution(hrs, 165)
    expect(dist.z1.pct).toBe(100)
    expect(dist.z1.seconds).toBe(100)
    expect(dist.z2.seconds).toBe(0)
  })

  it('두 존에 고르게 분포하면 각 50%', () => {
    const hrs = [...Array(50).fill(130), ...Array(50).fill(170)]
    const dist = calculateZoneDistribution(hrs, 165)
    expect(dist.z1.pct).toBe(50)
    expect(dist.z5.pct).toBe(50)
  })

  it('빈 배열이면 모두 0', () => {
    const dist = calculateZoneDistribution([], 165)
    expect(dist.z1.seconds).toBe(0)
    expect(dist.z1.pct).toBe(0)
  })
})
