import { describe, it, expect } from 'vite-plus/test'
import { getZone, getZoneBoundaries, calculateZoneDistribution, toBakkenZones } from './hr-zones'
import type { ZoneDistribution } from './hr-zones'

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
  function makeRecords(
    entries: Array<{ hr: number | null; deltaSec: number }>,
  ): Array<{ timestamp: string; heartRate: number | null }> {
    const base = new Date('2026-01-01T00:00:00Z').getTime()
    let t = base
    return entries.map((e) => {
      const record = { timestamp: new Date(t).toISOString(), heartRate: e.hr }
      t += e.deltaSec * 1000
      return record
    })
  }

  it('1초 간격 균등 샘플링: 레코드 수 = 초', () => {
    const records = makeRecords(Array(100).fill({ hr: 130, deltaSec: 1 }))
    const dist = calculateZoneDistribution(records, 165)
    expect(dist.z1.pct).toBe(100)
    expect(dist.z1.seconds).toBe(99)
  })

  it('smart recording(7초 간격): 실제 경과 시간으로 집계', () => {
    const records = makeRecords(Array(50).fill({ hr: 130, deltaSec: 7 }))
    const dist = calculateZoneDistribution(records, 165)
    expect(dist.z1.seconds).toBe(49 * 7)
    expect(dist.z1.pct).toBe(100)
  })

  it('두 존에 고르게 분포하면 각각 절반 정도', () => {
    const records = makeRecords([
      ...Array(50).fill({ hr: 130, deltaSec: 1 }),
      ...Array(50).fill({ hr: 170, deltaSec: 1 }),
    ])
    const dist = calculateZoneDistribution(records, 165)
    expect(dist.z1.pct + dist.z5.pct).toBe(100)
    expect(Math.abs(dist.z1.pct - dist.z5.pct)).toBeLessThanOrEqual(2)
  })

  it('HR=null 레코드는 건너뛴다', () => {
    const records = makeRecords([
      { hr: 130, deltaSec: 1 },
      { hr: null, deltaSec: 1 },
      { hr: 130, deltaSec: 1 },
      { hr: 130, deltaSec: 1 },
    ])
    const dist = calculateZoneDistribution(records, 165)
    expect(dist.z1.seconds).toBe(2)
  })

  it('60초 이상 gap은 이상치로 간주하고 제외', () => {
    const records = makeRecords([
      { hr: 130, deltaSec: 1 },
      { hr: 130, deltaSec: 300 },
      { hr: 130, deltaSec: 1 },
    ])
    const dist = calculateZoneDistribution(records, 165)
    expect(dist.z1.seconds).toBe(1)
  })

  it('빈 배열이면 모두 0', () => {
    const dist = calculateZoneDistribution([], 165)
    expect(dist.z1.seconds).toBe(0)
    expect(dist.z1.pct).toBe(0)
  })
})

describe('toBakkenZones', () => {
  it('Friel Z1+Z2 → Easy, Z3+Z4 → Threshold, Z5 → Supra', () => {
    const dist: ZoneDistribution = {
      z1: { seconds: 100, pct: 20 },
      z2: { seconds: 150, pct: 30 },
      z3: { seconds: 50, pct: 10 },
      z4: { seconds: 150, pct: 30 },
      z5: { seconds: 50, pct: 10 },
    }
    const bakken = toBakkenZones(dist)
    expect(bakken.easy.seconds).toBe(250)
    expect(bakken.easy.pct).toBe(50)
    expect(bakken.threshold.seconds).toBe(200)
    expect(bakken.threshold.pct).toBe(40)
    expect(bakken.supra.seconds).toBe(50)
    expect(bakken.supra.pct).toBe(10)
  })
})
