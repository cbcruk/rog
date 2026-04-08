import { describe, it, expect } from 'vite-plus/test'
import {
  getSessionTypeLabel,
  getSessionTypeVariant,
  getSessionTypeColor,
  getLocationLabel,
  isTimeBased,
  isDistanceBased,
  getISOWeek,
  getWeekRange,
  formatWeekRange,
  parseDurationToMinutes,
  calculateWeeklyStats,
  getSessionWeeklyPercent,
} from './sessions-table.utils'
import type { SessionWithFeedback } from '@/types/running'

function createMockSession(overrides: Partial<SessionWithFeedback> = {}): SessionWithFeedback {
  return {
    id: 'test-session',
    date: '2026-03-15',
    startTime: '2026-03-15T07:00:00Z',
    sport: 'running',
    metadata: null,
    summary: {
      distance: 10,
      duration: '50:00',
      durationSeconds: 3000,
      avgPace: '5:00',
      avgHeartRate: 145,
      maxHeartRate: 165,
      calories: 500,
      avgCadence: 180,
    },
    splits: {
      firstHalfPace: '5:00',
      secondHalfPace: '5:05',
      diffSeconds: 5,
      type: 'positive',
    },
    segments: [],
    laps: [],
    consistency: { stdDevSeconds: 3.5, cv: 2.1, rating: 'excellent' },
    highlights: {
      fastestLap: { km: 3, pace: '4:50' },
      slowestLap: { km: 8, pace: '5:15' },
    },
    heartRate: null,
    fatigue: null,
    elevation: { totalAscent: 50, totalDescent: 45 },
    intervals: null,
    ...overrides,
  } as SessionWithFeedback
}

describe('getSessionTypeLabel', () => {
  it('metadata.type을 한글 라벨로 변환한다', () => {
    expect(getSessionTypeLabel(createMockSession({ metadata: { type: 'easy' } } as never))).toBe(
      '이지',
    )
    expect(
      getSessionTypeLabel(createMockSession({ metadata: { type: 'threshold_interval' } } as never)),
    ).toBe('역치')
    expect(
      getSessionTypeLabel(createMockSession({ metadata: { type: 'long_run' } } as never)),
    ).toBe('롱런')
  })

  it('metadata가 없으면 심박으로 분류한다', () => {
    const easy = createMockSession({
      summary: { ...createMockSession().summary, avgHeartRate: 130 },
    })
    expect(getSessionTypeLabel(easy)).toBe('이지')

    const moderate = createMockSession({
      summary: { ...createMockSession().summary, avgHeartRate: 145 },
    })
    expect(getSessionTypeLabel(moderate)).toBe('중강도')

    const hard = createMockSession({
      summary: { ...createMockSession().summary, avgHeartRate: 160 },
    })
    expect(getSessionTypeLabel(hard)).toBe('고강도')
  })
})

describe('getSessionTypeVariant', () => {
  it('한글 라벨을 variant로 변환한다', () => {
    expect(getSessionTypeVariant('이지')).toBe('easy')
    expect(getSessionTypeVariant('역치')).toBe('threshold')
    expect(getSessionTypeVariant('롱런')).toBe('longRun')
    expect(getSessionTypeVariant('트레일')).toBe('trail')
  })

  it('매칭되지 않으면 outline을 반환한다', () => {
    expect(getSessionTypeVariant('unknown')).toBe('outline')
  })
})

describe('getSessionTypeColor', () => {
  it('라벨에 해당하는 CSS 변수를 반환한다', () => {
    expect(getSessionTypeColor('이지')).toBe('var(--green)')
    expect(getSessionTypeColor('역치')).toBe('var(--red)')
    expect(getSessionTypeColor('롱런')).toBe('var(--blue)')
  })

  it('매칭되지 않으면 tx-2 색상을 반환한다', () => {
    expect(getSessionTypeColor('unknown')).toBe('var(--muted-foreground)')
  })
})

describe('getLocationLabel', () => {
  it('location을 한글로 변환한다', () => {
    expect(getLocationLabel(createMockSession({ metadata: { location: 'road' } } as never))).toBe(
      '로드',
    )
    expect(
      getLocationLabel(createMockSession({ metadata: { location: 'treadmill' } } as never)),
    ).toBe('트레드밀')
    expect(getLocationLabel(createMockSession({ metadata: { location: 'trail' } } as never))).toBe(
      '트레일',
    )
  })

  it('metadata가 없으면 null을 반환한다', () => {
    expect(getLocationLabel(createMockSession())).toBeNull()
  })
})

describe('isTimeBased / isDistanceBased', () => {
  it('시간 기반 유형을 식별한다', () => {
    expect(isTimeBased('이지')).toBe(true)
    expect(isTimeBased('회복')).toBe(true)
    expect(isTimeBased('중강도')).toBe(true)
    expect(isTimeBased('롱런')).toBe(false)
  })

  it('거리 기반 유형을 식별한다', () => {
    expect(isDistanceBased('롱런')).toBe(true)
    expect(isDistanceBased('역치')).toBe(true)
    expect(isDistanceBased('이지')).toBe(false)
  })
})

describe('getISOWeek', () => {
  it('날짜를 ISO 주차로 변환한다', () => {
    const week = getISOWeek('2026-03-15')
    expect(week).toMatch(/^\d{4}-W\d{2}$/)
  })

  it('같은 주의 날짜는 같은 주차를 반환한다', () => {
    expect(getISOWeek('2026-03-16')).toBe(getISOWeek('2026-03-17'))
  })
})

describe('getWeekRange', () => {
  it('월요일~일요일 범위를 반환한다', () => {
    const { start, end } = getWeekRange('2026-03-18')
    expect(start.getDay()).toBe(1)
    expect(end.getDay()).toBe(0)
  })

  it('일요일 입력 시 해당 주의 월요일~일요일을 반환한다', () => {
    const { start, end } = getWeekRange('2026-03-15')
    expect(start.getDay()).toBe(1)
    expect(end.getDay()).toBe(0)
    expect(end.getDate() - start.getDate()).toBe(6)
  })
})

describe('formatWeekRange', () => {
  it('M/D - M/D 형식의 주간 범위를 반환한다', () => {
    const range = formatWeekRange('2026-03-18')
    expect(range).toMatch(/^\d{1,2}\/\d{1,2} - \d{1,2}\/\d{1,2}$/)
  })
})

describe('parseDurationToMinutes', () => {
  it('H:MM:SS 형식을 분으로 변환한다', () => {
    expect(parseDurationToMinutes('1:30:00')).toBe(90)
    expect(parseDurationToMinutes('2:00:00')).toBe(120)
  })

  it('M:SS 형식을 분으로 변환한다', () => {
    expect(parseDurationToMinutes('50:00')).toBe(50)
    expect(parseDurationToMinutes('30:30')).toBe(30.5)
  })
})

describe('calculateWeeklyStats', () => {
  it('같은 주 세션의 거리와 시간을 합산한다', () => {
    const sessions = [
      createMockSession({
        date: '2026-03-16',
        summary: { ...createMockSession().summary, distance: 10, duration: '50:00' },
      }),
      createMockSession({
        date: '2026-03-17',
        summary: { ...createMockSession().summary, distance: 5, duration: '25:00' },
      }),
    ]

    const stats = calculateWeeklyStats(sessions)
    const week = getISOWeek('2026-03-16')
    const weekStats = stats.get(week)

    expect(weekStats).toBeDefined()
    expect(weekStats!.totalDistance).toBe(15)
  })

  it('다른 주 세션은 별도로 집계한다', () => {
    const sessions = [
      createMockSession({ date: '2026-03-09' }),
      createMockSession({ date: '2026-03-16' }),
    ]

    const stats = calculateWeeklyStats(sessions)
    expect(stats.size).toBe(2)
  })
})

describe('getSessionWeeklyPercent', () => {
  it('주간 거리/시간 대비 비율을 반환한다', () => {
    const sessions = [
      createMockSession({
        date: '2026-03-16',
        summary: { ...createMockSession().summary, distance: 10, duration: '50:00' },
      }),
      createMockSession({
        date: '2026-03-17',
        summary: { ...createMockSession().summary, distance: 10, duration: '50:00' },
      }),
    ]

    const stats = calculateWeeklyStats(sessions)
    const percent = getSessionWeeklyPercent(sessions[0], stats)

    expect(percent.distancePercent).toBe(50)
    expect(percent.durationPercent).toBe(50)
  })

  it('주간 통계가 없으면 0%를 반환한다', () => {
    const session = createMockSession()
    const emptyStats = new Map()
    const percent = getSessionWeeklyPercent(session, emptyStats)

    expect(percent.distancePercent).toBe(0)
    expect(percent.durationPercent).toBe(0)
  })
})
