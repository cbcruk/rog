export type RecommendationType = 'warning' | 'suggestion' | 'info'

export interface Recommendation {
  type: RecommendationType
  message: string
}

export interface RecommendationInput {
  tsb: number
  weeklyZ4Seconds: number
  weeklyZ5Seconds: number
  weeklyDistance: number
  fourWeekAvgDistance: number
}

/** 현재 훈련 상태를 기반으로 다음 주 훈련 추천을 생성한다. */
export function getRecommendations(input: RecommendationInput): Recommendation[] {
  const results: Recommendation[] = []
  const z4min = Math.round(input.weeklyZ4Seconds / 60)
  const z5min = Math.round(input.weeklyZ5Seconds / 60)

  if (input.tsb < -20) {
    results.push({
      type: 'warning',
      message: `피로 누적 경고 (TSB ${input.tsb.toFixed(1)}). 이번 주는 이지 위주로 구성하세요.`,
    })
  }

  if (z4min < 40 && input.tsb > -15) {
    results.push({
      type: 'suggestion',
      message: `주간 Z4(역치) 시간이 ${z4min}분으로 부족합니다. 역치 세션 1회 추가를 고려하세요.`,
    })
  }

  if (z5min > 10) {
    results.push({
      type: 'warning',
      message: `주간 Z5 시간이 ${z5min}분으로 초과했습니다. 다음 역치 세션에서 세트 수를 줄이세요.`,
    })
  }

  if (input.fourWeekAvgDistance > 0 && input.weeklyDistance > input.fourWeekAvgDistance * 1.3) {
    const pct = Math.round(
      ((input.weeklyDistance - input.fourWeekAvgDistance) / input.fourWeekAvgDistance) * 100,
    )
    results.push({
      type: 'warning',
      message: `이번 주 거리(${input.weeklyDistance.toFixed(1)}km)가 4주 평균 대비 +${pct}% 증가했습니다. 부상 위험에 주의하세요.`,
    })
  }

  if (input.tsb > 15) {
    results.push({
      type: 'info',
      message: '컨디션이 좋습니다. 핵심 훈련이나 레이스에 도전할 시점이에요.',
    })
  }

  if (results.length === 0) {
    results.push({
      type: 'info',
      message: '훈련이 잘 균형 잡혀 있어요. 현재 페이스를 유지하세요.',
    })
  }

  return results
}
