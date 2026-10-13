import { describe, it, expect } from 'vite-plus/test'
import {
  buildWeekComparison,
  formatWeekLabel,
  getCompletionPercent,
  getMonday,
  toDateKey,
} from './week-plan'
import type { PlannedSession } from '@/types/program'
import type { SessionWithFeedback } from '@/types/running'

/** 2026-03-16은 월요일이다. 이 주(월~일)를 모든 테스트의 기준으로 삼는다. */
const MONDAY = new Date(2026, 2, 16)
const WEDNESDAY = new Date(2026, 2, 18)

function makePlan(overrides: Partial<PlannedSession> = {}): PlannedSession {
  return {
    id: overrides.id ?? 'plan-1',
    dayIndex: 0,
    type: 'easy',
    durationMinutes: 45,
    distanceKm: 7.5,
    thresholdMinutes: 0,
    supraMinutes: 0,
    ...overrides,
  }
}

interface ActualOptions {
  id?: string
  date: string
  /** ISO 8601 시작 시각. 같은 날 여러 세션의 순서를 정한다 */
  startTime?: string
  type?: string
  distance?: number
  durationSeconds?: number
  avgHeartRate?: number
  thresholdSeconds?: number
  supraSeconds?: number
}

/** 테스트에 필요한 필드만 채운 세션 로그. 나머지 필드는 이 로직에서 읽지 않는다. */
function makeActual(options: ActualOptions): SessionWithFeedback {
  const { thresholdSeconds = 0, supraSeconds = 0 } = options

  return {
    id: options.id ?? options.date,
    date: options.date,
    startTime: options.startTime ?? `${options.date}T06:00:00Z`,
    metadata: options.type ? { type: options.type } : null,
    summary: {
      distance: options.distance ?? 8,
      durationSeconds: options.durationSeconds ?? 45 * 60,
      avgHeartRate: options.avgHeartRate ?? 130,
    },
    zoneDistribution:
      thresholdSeconds || supraSeconds
        ? {
            z1: { seconds: 0, pct: 0 },
            z2: { seconds: 0, pct: 0 },
            z3: { seconds: thresholdSeconds, pct: 0 },
            z4: { seconds: 0, pct: 0 },
            z5: { seconds: supraSeconds, pct: 0 },
          }
        : null,
  } as unknown as SessionWithFeedback
}

describe('toDateKey', () => {
  it('로컬 기준 YYYY-MM-DD로 변환한다', () => {
    expect(toDateKey(new Date(2026, 0, 5))).toBe('2026-01-05')
  })
})

describe('getMonday', () => {
  it('주 중간 날짜에서 그 주 월요일을 찾는다', () => {
    expect(toDateKey(getMonday(WEDNESDAY))).toBe('2026-03-16')
  })

  it('일요일은 그 주의 월요일로 되돌아간다', () => {
    expect(toDateKey(getMonday(new Date(2026, 2, 22)))).toBe('2026-03-16')
  })

  it('월요일은 그대로 유지한다', () => {
    expect(toDateKey(getMonday(MONDAY))).toBe('2026-03-16')
  })

  it('오프셋만큼 주 단위로 이동한다', () => {
    expect(toDateKey(getMonday(WEDNESDAY, -1))).toBe('2026-03-09')
    expect(toDateKey(getMonday(WEDNESDAY, 2))).toBe('2026-03-30')
  })
})

describe('formatWeekLabel', () => {
  it('월요일부터 일요일까지 범위를 표시한다', () => {
    expect(formatWeekLabel(MONDAY)).toBe('3/16 - 3/22')
  })
})

describe('getCompletionPercent', () => {
  it('계획 대비 비율을 반올림해 반환한다', () => {
    expect(getCompletionPercent(45, 50)).toBe(90)
  })

  it('계획을 초과하면 100을 넘는 값을 반환한다', () => {
    expect(getCompletionPercent(60, 50)).toBe(120)
  })

  it('계획이 0이면 null을 반환한다', () => {
    expect(getCompletionPercent(10, 0)).toBeNull()
  })
})

describe('buildWeekComparison', () => {
  it('항상 월~일 7일을 반환한다', () => {
    const result = buildWeekComparison([], [], MONDAY, WEDNESDAY)

    expect(result.days).toHaveLength(7)
    expect(result.days[0].date).toBe('2026-03-16')
    expect(result.days[6].date).toBe('2026-03-22')
  })

  it('오늘과 지난 날짜를 표시한다', () => {
    const result = buildWeekComparison([], [], MONDAY, WEDNESDAY)

    expect(result.days[2].isToday).toBe(true)
    expect(result.days[1].isPast).toBe(true)
    expect(result.days[2].isPast).toBe(false)
    expect(result.days[3].isPast).toBe(false)
  })

  it('다른 주의 세션은 집계에서 제외한다', () => {
    const sessions = [makeActual({ date: '2026-03-09', distance: 12 })]
    const result = buildWeekComparison([], sessions, MONDAY, WEDNESDAY)

    expect(result.actual.sessionCount).toBe(0)
    expect(result.actual.distance).toBe(0)
  })

  it('같은 날 같은 유형이면 계획과 실적을 맺어준다', () => {
    const plans = [makePlan({ id: 'mon-easy', dayIndex: 0, type: 'easy', distanceKm: 7.5 })]
    const sessions = [makeActual({ date: '2026-03-16', type: 'easy', distance: 8 })]

    const result = buildWeekComparison(plans, sessions, MONDAY, WEDNESDAY)
    const entries = result.days[0].entries

    expect(entries).toHaveLength(1)
    expect(entries[0].status).toBe('done')
    expect(entries[0].planned?.id).toBe('mon-easy')
    expect(entries[0].actual?.date).toBe('2026-03-16')
    expect(result.missedCount).toBe(0)
    expect(result.unplannedCount).toBe(0)
  })

  it('유형이 다르면 맺지 않고 미실시와 계획 외로 나눈다', () => {
    const plans = [makePlan({ id: 'mon-threshold', dayIndex: 0, type: 'threshold_interval' })]
    const sessions = [makeActual({ date: '2026-03-16', type: 'easy' })]

    const result = buildWeekComparison(plans, sessions, MONDAY, WEDNESDAY)
    const statuses = result.days[0].entries.map((entry) => entry.status)

    expect(statuses).toContain('missed')
    expect(statuses).toContain('unplanned')
    expect(result.missedCount).toBe(1)
    expect(result.unplannedCount).toBe(1)
  })

  it('계획만 있고 실적이 없으면 미실시로 표시한다', () => {
    const plans = [makePlan({ id: 'sun-long', dayIndex: 6, type: 'long_run' })]

    const result = buildWeekComparison(plans, [], MONDAY, WEDNESDAY)

    expect(result.days[6].entries[0].status).toBe('missed')
    expect(result.missedCount).toBe(1)
  })

  it('계획에 없던 세션은 계획 외로 표시한다', () => {
    const sessions = [makeActual({ date: '2026-03-18', type: 'easy' })]

    const result = buildWeekComparison([], sessions, MONDAY, WEDNESDAY)

    expect(result.days[2].entries[0].status).toBe('unplanned')
    expect(result.unplannedCount).toBe(1)
  })

  it('같은 날 같은 유형 두 세션은 각각 하나씩만 맺는다', () => {
    const plans = [
      makePlan({ id: 'tue-am', dayIndex: 1, type: 'threshold_interval' }),
      makePlan({ id: 'tue-pm', dayIndex: 1, type: 'threshold_interval' }),
    ]
    const sessions = [
      makeActual({ id: 'am', date: '2026-03-17', type: 'threshold_interval' }),
      makeActual({ id: 'pm', date: '2026-03-17', type: 'threshold_interval' }),
    ]

    const result = buildWeekComparison(plans, sessions, MONDAY, WEDNESDAY)
    const entries = result.days[1].entries

    expect(entries).toHaveLength(2)
    expect(entries.every((entry) => entry.status === 'done')).toBe(true)
    expect(new Set(entries.map((entry) => entry.actual?.id)).size).toBe(2)
  })

  it('더블 역치는 실적 순서와 무관하게 시작 시각 순으로 맺는다', () => {
    const plans = [
      makePlan({ id: 'tue-am', dayIndex: 1, type: 'threshold_interval' }),
      makePlan({ id: 'tue-pm', dayIndex: 1, type: 'threshold_interval' }),
    ]
    const sessions = [
      makeActual({
        id: 'pm',
        date: '2026-03-17',
        startTime: '2026-03-17T18:00:00Z',
        type: 'threshold_interval',
      }),
      makeActual({
        id: 'am',
        date: '2026-03-17',
        startTime: '2026-03-17T06:00:00Z',
        type: 'threshold_interval',
      }),
    ]

    const result = buildWeekComparison(plans, sessions, MONDAY, WEDNESDAY)
    const byPlan = new Map(
      result.days[1].entries.map((entry) => [entry.planned?.id, entry.actual?.id]),
    )

    expect(byPlan.get('tue-am')).toBe('am')
    expect(byPlan.get('tue-pm')).toBe('pm')
  })

  it('계획이 실적보다 많으면 남은 계획만 미실시가 된다', () => {
    const plans = [
      makePlan({ id: 'tue-am', dayIndex: 1, type: 'threshold_interval' }),
      makePlan({ id: 'tue-pm', dayIndex: 1, type: 'threshold_interval' }),
    ]
    const sessions = [makeActual({ date: '2026-03-17', type: 'threshold_interval' })]

    const result = buildWeekComparison(plans, sessions, MONDAY, WEDNESDAY)

    expect(result.missedCount).toBe(1)
    expect(result.unplannedCount).toBe(0)
  })

  it('계획과 실적 합계를 각각 집계한다', () => {
    const plans = [
      makePlan({ id: 'mon', dayIndex: 0, distanceKm: 7.5, durationMinutes: 45 }),
      makePlan({
        id: 'tue',
        dayIndex: 1,
        type: 'threshold_interval',
        distanceKm: 10,
        durationMinutes: 60,
        thresholdMinutes: 30,
        supraMinutes: 5,
      }),
    ]
    const sessions = [
      makeActual({ date: '2026-03-16', type: 'easy', distance: 8, durationSeconds: 48 * 60 }),
      makeActual({
        date: '2026-03-17',
        type: 'threshold_interval',
        distance: 9.5,
        durationSeconds: 55 * 60,
        thresholdSeconds: 25 * 60,
        supraSeconds: 3 * 60,
      }),
    ]

    const result = buildWeekComparison(plans, sessions, MONDAY, WEDNESDAY)

    expect(result.planned).toEqual({
      distance: 17.5,
      minutes: 105,
      thresholdMinutes: 30,
      supraMinutes: 5,
      sessionCount: 2,
    })
    expect(result.actual).toEqual({
      distance: 17.5,
      minutes: 103,
      thresholdMinutes: 25,
      supraMinutes: 3,
      sessionCount: 2,
    })
  })

  it('존 분포가 없는 세션은 역치 시간을 0으로 본다', () => {
    const sessions = [makeActual({ date: '2026-03-16', type: 'easy' })]

    const result = buildWeekComparison([], sessions, MONDAY, WEDNESDAY)

    expect(result.actual.thresholdMinutes).toBe(0)
    expect(result.actual.supraMinutes).toBe(0)
  })
})
