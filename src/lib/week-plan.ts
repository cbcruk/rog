import { getSessionTypeLabel } from '@/components/sessions-table/sessions-table.utils'
import { getPlannedTypeLabel } from '@/components/program-editor/program-editor.utils'
import { toBakkenZones } from '@/lib/hr-zones'
import type { PlannedSession } from '@/types/program'
import type { SessionWithFeedback } from '@/types/running'

/** 계획과 실적을 한 칸에 묶은 결과. */
export interface WeekEntry {
  /** 렌더링 키. 계획이 있으면 계획 id, 없으면 실적 id를 쓴다 */
  key: string
  /** 계획된 세션. 계획 없이 뛴 경우 undefined */
  planned?: PlannedSession
  /** 실제 뛴 세션. 아직 수행하지 않았으면 undefined */
  actual?: SessionWithFeedback
  /**
   * - `done`: 계획대로 수행
   * - `missed`: 계획했으나 아직 수행하지 않음
   * - `unplanned`: 계획에 없던 세션을 수행
   */
  status: 'done' | 'missed' | 'unplanned'
}

/** 주간 그리드의 하루. */
export interface WeekPlanDay {
  dayIndex: number
  dayLabel: string
  /** YYYY-MM-DD */
  date: string
  dateNum: number
  isToday: boolean
  /** 지난 날짜인지 여부. 미수행 계획을 강조할지 판단할 때 사용한다 */
  isPast: boolean
  entries: WeekEntry[]
}

/** 계획/실적 각각의 주간 합계. */
export interface WeekTotals {
  distance: number
  minutes: number
  thresholdMinutes: number
  supraMinutes: number
  sessionCount: number
}

/** 한 주의 계획-실적 대비 결과. */
export interface WeekComparison {
  days: WeekPlanDay[]
  planned: WeekTotals
  actual: WeekTotals
  /** 계획 대비 미수행 세션 수 */
  missedCount: number
  /** 계획에 없던 세션 수 */
  unplannedCount: number
}

const DAY_LABELS = ['월', '화', '수', '목', '금', '토', '일']

/** Date를 로컬 기준 YYYY-MM-DD 문자열로 변환한다. */
export function toDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * 기준일이 속한 주의 월요일을 반환한다.
 * @param reference - 기준 날짜
 * @param weekOffset - 주 단위 이동량 (-1은 지난주, 1은 다음주)
 */
export function getMonday(reference: Date, weekOffset: number = 0): Date {
  const day = reference.getDay()
  const diffToMonday = day === 0 ? -6 : 1 - day

  const monday = new Date(reference)
  monday.setHours(0, 0, 0, 0)
  monday.setDate(reference.getDate() + diffToMonday + weekOffset * 7)

  return monday
}

/** 월요일 기준 주간 범위를 "M/D - M/D" 형식으로 표시한다. */
export function formatWeekLabel(monday: Date): string {
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)

  return `${monday.getMonth() + 1}/${monday.getDate()} - ${sunday.getMonth() + 1}/${sunday.getDate()}`
}

/** 실적 세션의 Bakken 존 체류 시간(분)을 구한다. 존 분포가 없으면 0을 반환한다. */
function getActualZoneMinutes(session: SessionWithFeedback): {
  threshold: number
  supra: number
} {
  if (!session.zoneDistribution) {
    return { threshold: 0, supra: 0 }
  }

  const zones = toBakkenZones(session.zoneDistribution)

  return {
    threshold: Math.round(zones.threshold.seconds / 60),
    supra: Math.round(zones.supra.seconds / 60),
  }
}

/**
 * 하루치 계획과 실적을 짝지어 준다.
 *
 * 같은 유형끼리 먼저 맺어주고, 남은 계획은 미수행, 남은 실적은 계획 외로 표시한다.
 * 유형이 다르면 굳이 붙이지 않는데, 역치를 계획했다가 이지를 뛴 경우를
 * "계획대로 수행"으로 보이게 하는 것보다 둘 다 드러내는 편이 정확하기 때문이다.
 *
 * 더블 역치처럼 같은 날 같은 유형이 둘이면 실적을 시작 시각 순으로 정렬해 맺는다.
 * 계획도 오전/오후 순으로 적히므로, 오전 계획이 오전 세션과 짝지어진다.
 */
function pairDay(planned: PlannedSession[], actual: SessionWithFeedback[]): WeekEntry[] {
  const remainingActual = [...actual].sort((a, b) => a.startTime.localeCompare(b.startTime))
  const entries: WeekEntry[] = []
  const unmatchedPlans: PlannedSession[] = []

  for (const plan of planned) {
    const planLabel = getPlannedTypeLabel(plan.type)
    const matchIndex = remainingActual.findIndex(
      (session) => getSessionTypeLabel(session) === planLabel,
    )

    if (matchIndex === -1) {
      unmatchedPlans.push(plan)
      continue
    }

    const [matched] = remainingActual.splice(matchIndex, 1)
    entries.push({ key: plan.id, planned: plan, actual: matched, status: 'done' })
  }

  for (const plan of unmatchedPlans) {
    entries.push({ key: plan.id, planned: plan, status: 'missed' })
  }

  for (const session of remainingActual) {
    entries.push({ key: session.id, actual: session, status: 'unplanned' })
  }

  return entries
}

function emptyTotals(): WeekTotals {
  return { distance: 0, minutes: 0, thresholdMinutes: 0, supraMinutes: 0, sessionCount: 0 }
}

/**
 * 주간 프로그램과 실제 세션을 요일별로 대비시킨다.
 *
 * @param plannedSessions - 적용 중인 프로그램의 계획 세션. 프로그램이 없으면 빈 배열
 * @param sessions - 전체 세션 로그. 해당 주에 속한 것만 골라 쓴다
 * @param monday - 대상 주의 월요일
 * @param today - 오늘 날짜. 지난 날짜 판정에 사용한다
 */
export function buildWeekComparison(
  plannedSessions: PlannedSession[],
  sessions: SessionWithFeedback[],
  monday: Date,
  today: Date,
): WeekComparison {
  const todayKey = toDateKey(today)
  const planned = emptyTotals()
  const actual = emptyTotals()

  const days: WeekPlanDay[] = DAY_LABELS.map((dayLabel, dayIndex) => {
    const date = new Date(monday)
    date.setDate(monday.getDate() + dayIndex)

    const dateKey = toDateKey(date)
    const dayPlans = plannedSessions.filter((session) => session.dayIndex === dayIndex)
    const daySessions = sessions.filter((session) => session.date === dateKey)

    for (const plan of dayPlans) {
      planned.distance += plan.distanceKm ?? 0
      planned.minutes += plan.durationMinutes
      planned.thresholdMinutes += plan.thresholdMinutes
      planned.supraMinutes += plan.supraMinutes
      planned.sessionCount += 1
    }

    for (const session of daySessions) {
      const zones = getActualZoneMinutes(session)

      actual.distance += session.summary.distance
      actual.minutes += session.summary.durationSeconds / 60
      actual.thresholdMinutes += zones.threshold
      actual.supraMinutes += zones.supra
      actual.sessionCount += 1
    }

    return {
      dayIndex,
      dayLabel,
      date: dateKey,
      dateNum: date.getDate(),
      isToday: dateKey === todayKey,
      isPast: dateKey < todayKey,
      entries: pairDay(dayPlans, daySessions),
    }
  })

  const entries = days.flatMap((day) => day.entries)

  return {
    days,
    planned: { ...planned, distance: Math.round(planned.distance * 10) / 10 },
    actual: {
      ...actual,
      distance: Math.round(actual.distance * 10) / 10,
      minutes: Math.round(actual.minutes),
    },
    missedCount: entries.filter((entry) => entry.status === 'missed').length,
    unplannedCount: entries.filter((entry) => entry.status === 'unplanned').length,
  }
}

/**
 * 계획 대비 달성률(%)을 구한다.
 * 계획이 0이면 비교 대상이 없으므로 null을 반환해 호출부가 표시를 생략할 수 있게 한다.
 */
export function getCompletionPercent(actual: number, planned: number): number | null {
  if (planned <= 0) return null
  return Math.round((actual / planned) * 100)
}
