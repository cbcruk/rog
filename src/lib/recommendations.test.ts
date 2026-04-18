import { describe, it, expect } from 'vite-plus/test'
import { getRecommendations } from './recommendations'
import type { RecommendationInput } from './recommendations'

function makeInput(overrides: Partial<RecommendationInput> = {}): RecommendationInput {
  return {
    tsb: 0,
    weeklyZ4Seconds: 50 * 60,
    weeklyZ5Seconds: 3 * 60,
    weeklyDistance: 40,
    fourWeekAvgDistance: 40,
    ...overrides,
  }
}

describe('getRecommendations', () => {
  it('TSB < -20 → 피로 경고', () => {
    const recs = getRecommendations(makeInput({ tsb: -25 }))
    expect(recs.some((r) => r.type === 'warning' && r.message.includes('피로'))).toBe(true)
  })

  it('Z4 < 40분 + TSB > -15 → 역치 부족 제안', () => {
    const recs = getRecommendations(makeInput({ weeklyZ4Seconds: 20 * 60 }))
    expect(recs.some((r) => r.type === 'suggestion' && r.message.includes('역치'))).toBe(true)
  })

  it('Z5 > 10분 → 강도 초과 경고', () => {
    const recs = getRecommendations(makeInput({ weeklyZ5Seconds: 15 * 60 }))
    expect(recs.some((r) => r.type === 'warning' && r.message.includes('Z5'))).toBe(true)
  })

  it('거리 4주 평균 +30% → 급격한 증가 경고', () => {
    const recs = getRecommendations(makeInput({ weeklyDistance: 60, fourWeekAvgDistance: 40 }))
    expect(recs.some((r) => r.type === 'warning' && r.message.includes('거리'))).toBe(true)
  })

  it('TSB > 15 → 좋은 컨디션 info', () => {
    const recs = getRecommendations(makeInput({ tsb: 20 }))
    expect(recs.some((r) => r.type === 'info' && r.message.includes('컨디션'))).toBe(true)
  })

  it('균형 잡힌 상태 → 유지 메시지', () => {
    const recs = getRecommendations(makeInput())
    expect(recs.some((r) => r.message.includes('균형'))).toBe(true)
  })
})
