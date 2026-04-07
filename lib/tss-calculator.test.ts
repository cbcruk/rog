import { describe, it, expect } from 'vite-plus/test'
import {
  calculateIntensityFactor,
  calculateHrTSS,
  calculateSessionTSS,
  getTSSZone,
} from './tss-calculator'

describe('calculateIntensityFactor', () => {
  it('HR Reserve 기반으로 IF를 계산한다', () => {
    const result = calculateIntensityFactor(150, 50, 170)
    expect(result).toBeCloseTo(0.833, 2)
  })

  it('LTHR이 안정시 심박 이하이면 null을 반환한다', () => {
    expect(calculateIntensityFactor(150, 170, 170)).toBeNull()
  })

  it('입력값이 0이면 null을 반환한다', () => {
    expect(calculateIntensityFactor(0, 50, 170)).toBeNull()
  })
})

describe('calculateHrTSS', () => {
  it('운동 시간과 IF로 TSS를 계산한다', () => {
    const result = calculateHrTSS(3600, 0.8)
    expect(result).toBeCloseTo(64, 0)
  })

  it('운동 시간이 0이면 null을 반환한다', () => {
    expect(calculateHrTSS(0, 0.8)).toBeNull()
  })
})

describe('calculateSessionTSS', () => {
  it('직접 필드에서 TSS를 계산한다', () => {
    const result = calculateSessionTSS(
      { avgHeartRate: 150, durationSeconds: 3600 },
      { lthr: 170, rest_hr: 50 },
    )
    expect(result.rtss).toBeGreaterThan(0)
    expect(result.intensityFactor).toBeGreaterThan(0)
  })

  it('summary 하위 객체에서 TSS를 계산한다', () => {
    const result = calculateSessionTSS(
      { summary: { avgHeartRate: 150, durationSeconds: 3600 } },
      { lthr: 170, rest_hr: 50 },
    )
    expect(result.rtss).toBeGreaterThan(0)
  })

  it('심박 데이터가 없으면 null을 반환한다', () => {
    const result = calculateSessionTSS({ durationSeconds: 3600 }, { lthr: 170, rest_hr: 50 })
    expect(result.rtss).toBeNull()
    expect(result.intensityFactor).toBeNull()
  })
})

describe('getTSSZone', () => {
  it('TSS < 100이면 low로 분류한다', () => {
    expect(getTSSZone(50).zone).toBe('low')
    expect(getTSSZone(50).recovery).toBe('< 24h')
  })

  it('TSS 100-150이면 medium으로 분류한다', () => {
    expect(getTSSZone(120).zone).toBe('medium')
  })

  it('TSS 150-250이면 high로 분류한다', () => {
    expect(getTSSZone(200).zone).toBe('high')
  })

  it('TSS > 250이면 very_high로 분류한다', () => {
    expect(getTSSZone(300).zone).toBe('very_high')
  })

  it('null이면 unknown으로 분류한다', () => {
    expect(getTSSZone(null).zone).toBe('unknown')
  })
})
