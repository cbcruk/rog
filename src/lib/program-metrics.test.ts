import { describe, it, expect } from 'vite-plus/test'
import {
  calculateProgramTotals,
  estimateTSS,
  getEasyMinutes,
  groupSessionsByDay,
} from './program-metrics'
import type { PlannedSession } from '@/types/program'

function makeSession(overrides: Partial<PlannedSession> = {}): PlannedSession {
  return {
    id: overrides.id ?? 'session-1',
    dayIndex: 0,
    type: 'easy',
    durationMinutes: 45,
    distanceKm: 7.5,
    thresholdMinutes: 0,
    supraMinutes: 0,
    ...overrides,
  }
}

describe('estimateTSS', () => {
  it('이지 1시간은 IF 0.72 기준 약 52 TSS', () => {
    expect(estimateTSS(60, 0, 0)).toBe(52)
  })

  it('같은 시간이면 역치가 이지보다 높은 TSS를 만든다', () => {
    expect(estimateTSS(0, 60, 0)).toBeGreaterThan(estimateTSS(60, 0, 0))
  })

  it('존 시간이 모두 0이면 0을 반환한다', () => {
    expect(estimateTSS(0, 0, 0)).toBe(0)
  })
})

describe('getEasyMinutes', () => {
  it('총 시간에서 역치와 초과 존 시간을 뺀다', () => {
    const session = makeSession({ durationMinutes: 60, thresholdMinutes: 25, supraMinutes: 5 })
    expect(getEasyMinutes(session)).toBe(30)
  })

  it('존 시간 합이 총 시간을 넘어도 음수가 되지 않는다', () => {
    const session = makeSession({ durationMinutes: 30, thresholdMinutes: 40, supraMinutes: 10 })
    expect(getEasyMinutes(session)).toBe(0)
  })
})

describe('calculateProgramTotals', () => {
  it('빈 프로그램은 모든 지표가 0이다', () => {
    const totals = calculateProgramTotals([])

    expect(totals.totalDistance).toBe(0)
    expect(totals.totalMinutes).toBe(0)
    expect(totals.easyPercent).toBe(0)
    expect(totals.sessionCount).toBe(0)
    expect(totals.trainingDays).toBe(0)
  })

  it('거리와 시간과 존 시간을 합산한다', () => {
    const totals = calculateProgramTotals([
      makeSession({ id: 'a', dayIndex: 0, durationMinutes: 60, distanceKm: 10 }),
      makeSession({
        id: 'b',
        dayIndex: 1,
        durationMinutes: 40,
        distanceKm: 6.5,
        thresholdMinutes: 20,
        supraMinutes: 5,
      }),
    ])

    expect(totals.totalDistance).toBe(16.5)
    expect(totals.totalMinutes).toBe(100)
    expect(totals.thresholdMinutes).toBe(20)
    expect(totals.supraMinutes).toBe(5)
    expect(totals.easyMinutes).toBe(75)
    expect(totals.easyPercent).toBe(75)
  })

  it('같은 날 두 세션은 훈련일 1일로 계산한다', () => {
    const totals = calculateProgramTotals([
      makeSession({ id: 'a', dayIndex: 1, thresholdMinutes: 25 }),
      makeSession({ id: 'b', dayIndex: 1, thresholdMinutes: 20 }),
    ])

    expect(totals.sessionCount).toBe(2)
    expect(totals.trainingDays).toBe(1)
    expect(totals.thresholdDays).toBe(1)
  })

  it('역치 초과 존만 있는 세션도 역치일로 계산한다', () => {
    const totals = calculateProgramTotals([
      makeSession({ dayIndex: 4, thresholdMinutes: 0, supraMinutes: 8 }),
    ])

    expect(totals.thresholdDays).toBe(1)
  })

  it('거리가 없는 세션은 거리 합계에 기여하지 않는다', () => {
    const totals = calculateProgramTotals([makeSession({ distanceKm: undefined })])

    expect(totals.totalDistance).toBe(0)
    expect(totals.totalMinutes).toBe(45)
  })
})

describe('groupSessionsByDay', () => {
  it('항상 7개 요일 슬롯을 반환한다', () => {
    expect(groupSessionsByDay([])).toHaveLength(7)
  })

  it('세션을 요일 인덱스에 맞게 배치한다', () => {
    const days = groupSessionsByDay([
      makeSession({ id: 'a', dayIndex: 6 }),
      makeSession({ id: 'b', dayIndex: 1 }),
      makeSession({ id: 'c', dayIndex: 1 }),
    ])

    expect(days[0]).toHaveLength(0)
    expect(days[1]).toHaveLength(2)
    expect(days[6]).toHaveLength(1)
  })

  it('범위를 벗어난 요일 인덱스는 무시한다', () => {
    const days = groupSessionsByDay([makeSession({ dayIndex: 9 })])

    expect(days.flat()).toHaveLength(0)
  })
})
