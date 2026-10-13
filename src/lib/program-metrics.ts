import type { PlannedSession, ProgramTotals } from '@/types/program'

/**
 * 존별 대표 Intensity Factor.
 * 계획 단계에서는 실제 심박이 없으므로, 존 체류 시간에 이 계수를 적용해 TSS를 추정한다.
 * 값은 Friel의 %LTHR 존 중앙값을 HR Reserve 기준 IF로 환산한 근사치다.
 */
const ZONE_INTENSITY_FACTOR = {
  easy: 0.72,
  threshold: 0.97,
  supra: 1.1,
} as const

/**
 * 존 체류 시간으로 TSS를 추정한다.
 * hrTSS 공식(`시간(h) x IF^2 x 100`)을 존별로 나눠 합산한 값이다.
 * @param easyMinutes - 이지 존 시간 (분)
 * @param thresholdMinutes - 역치 존 시간 (분)
 * @param supraMinutes - 역치 초과 존 시간 (분)
 */
export function estimateTSS(
  easyMinutes: number,
  thresholdMinutes: number,
  supraMinutes: number,
): number {
  const contributions = [
    (easyMinutes / 60) * ZONE_INTENSITY_FACTOR.easy ** 2,
    (thresholdMinutes / 60) * ZONE_INTENSITY_FACTOR.threshold ** 2,
    (supraMinutes / 60) * ZONE_INTENSITY_FACTOR.supra ** 2,
  ]

  return Math.round(contributions.reduce((sum, value) => sum + value, 0) * 100)
}

/**
 * 단일 계획 세션의 이지 존 시간을 계산한다.
 * 총 시간에서 역치/초과 존 시간을 뺀 나머지이며, 음수가 되지 않도록 0에서 잘린다.
 * @param session - 대상 계획 세션
 */
export function getEasyMinutes(session: PlannedSession): number {
  return Math.max(0, session.durationMinutes - session.thresholdMinutes - session.supraMinutes)
}

/**
 * 계획 세션 목록을 주간 지표로 집계한다.
 * 프로그램 에디터의 요약 패널과 검증 로직이 공통으로 사용하는 단일 집계 지점이다.
 * @param sessions - 프로그램의 계획 세션 목록
 */
export function calculateProgramTotals(sessions: PlannedSession[]): ProgramTotals {
  let totalDistance = 0
  let totalMinutes = 0
  let thresholdMinutes = 0
  let supraMinutes = 0

  const activeDays = new Set<number>()
  const thresholdDays = new Set<number>()

  for (const session of sessions) {
    totalDistance += session.distanceKm ?? 0
    totalMinutes += session.durationMinutes
    thresholdMinutes += session.thresholdMinutes
    supraMinutes += session.supraMinutes

    activeDays.add(session.dayIndex)

    if (session.thresholdMinutes > 0 || session.supraMinutes > 0) {
      thresholdDays.add(session.dayIndex)
    }
  }

  const easyMinutes = Math.max(0, totalMinutes - thresholdMinutes - supraMinutes)

  return {
    totalDistance: Math.round(totalDistance * 10) / 10,
    totalMinutes,
    easyMinutes,
    thresholdMinutes,
    supraMinutes,
    easyPercent: totalMinutes > 0 ? Math.round((easyMinutes / totalMinutes) * 100) : 0,
    sessionCount: sessions.length,
    trainingDays: activeDays.size,
    thresholdDays: thresholdDays.size,
    estimatedTSS: estimateTSS(easyMinutes, thresholdMinutes, supraMinutes),
  }
}

/**
 * 계획 세션을 월~일 7개 요일 슬롯으로 분배한다.
 * 같은 날에 여러 세션이 있으면 배열에 순서대로 담긴다. (더블 역치 등)
 * @param sessions - 프로그램의 계획 세션 목록
 */
export function groupSessionsByDay(sessions: PlannedSession[]): PlannedSession[][] {
  const days: PlannedSession[][] = Array.from({ length: 7 }, () => [])

  for (const session of sessions) {
    if (session.dayIndex < 0 || session.dayIndex > 6) continue
    days[session.dayIndex].push(session)
  }

  return days
}
