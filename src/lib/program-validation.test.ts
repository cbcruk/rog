import { describe, it, expect } from 'vite-plus/test'
import { PROGRAM_PRESETS, instantiatePreset } from './program-presets'
import { getOverallStatus, validateProgram } from './program-validation'
import type { PlannedSession, ProgramCheck } from '@/types/program'

const NO_BASELINE = { fourWeekAvgDistance: 0 }

function makeSession(overrides: Partial<PlannedSession> = {}): PlannedSession {
  return {
    id: overrides.id ?? `session-${overrides.dayIndex ?? 0}`,
    dayIndex: 0,
    type: 'easy',
    durationMinutes: 45,
    distanceKm: 7.5,
    thresholdMinutes: 0,
    supraMinutes: 0,
    ...overrides,
  }
}

/** 검증 결과에서 특정 규칙 한 건을 찾는다. */
function pick(checks: ProgramCheck[], id: string): ProgramCheck {
  const check = checks.find((item) => item.id === id)
  if (!check) throw new Error(`check not found: ${id}`)
  return check
}

/** 위반 없이 통과하는 기준 주간 구성. 개별 규칙 테스트의 출발점으로 사용한다. */
function baseWeek(): PlannedSession[] {
  return [
    makeSession({ id: 'mon', dayIndex: 0, durationMinutes: 45 }),
    makeSession({
      id: 'tue',
      dayIndex: 1,
      type: 'threshold_interval',
      durationMinutes: 60,
      thresholdMinutes: 30,
    }),
    makeSession({ id: 'wed', dayIndex: 2, durationMinutes: 45 }),
    makeSession({
      id: 'fri',
      dayIndex: 4,
      type: 'threshold_interval',
      durationMinutes: 50,
      thresholdMinutes: 20,
    }),
    makeSession({ id: 'sat', dayIndex: 5, durationMinutes: 40 }),
    makeSession({ id: 'sun', dayIndex: 6, type: 'long_run', durationMinutes: 90 }),
  ]
}

describe('validateProgram', () => {
  it('빈 프로그램은 안내 항목 하나만 반환한다', () => {
    const checks = validateProgram([], NO_BASELINE)

    expect(checks).toHaveLength(1)
    expect(checks[0].id).toBe('empty')
    expect(checks[0].status).toBe('warn')
  })

  it('기준 주간 구성은 위반 없이 통과한다', () => {
    const checks = validateProgram(baseWeek(), NO_BASELINE)

    expect(checks.some((check) => check.status === 'fail')).toBe(false)
  })

  it('기준선이 없으면 볼륨 증가율 검사를 건너뛴다', () => {
    const checks = validateProgram(baseWeek(), NO_BASELINE)

    expect(checks.some((check) => check.id === 'volume-ramp')).toBe(false)
  })
})

describe('주간 역치량', () => {
  it('40~75분이면 통과한다', () => {
    const checks = validateProgram(baseWeek(), NO_BASELINE)

    expect(pick(checks, 'threshold-volume').status).toBe('pass')
  })

  it('40분 미만이면 주의를 표시한다', () => {
    const sessions = baseWeek().map((session) =>
      session.id === 'tue' ? { ...session, thresholdMinutes: 10 } : session,
    )

    expect(pick(validateProgram(sessions, NO_BASELINE), 'threshold-volume').status).toBe('warn')
  })

  it('20분 미만이면 위반으로 처리한다', () => {
    const sessions = baseWeek().map((session) => ({ ...session, thresholdMinutes: 0 }))

    expect(pick(validateProgram(sessions, NO_BASELINE), 'threshold-volume').status).toBe('fail')
  })

  it('75분을 넘으면 주의를 표시한다', () => {
    const sessions = baseWeek().map((session) =>
      session.id === 'tue' ? { ...session, thresholdMinutes: 60 } : session,
    )

    expect(pick(validateProgram(sessions, NO_BASELINE), 'threshold-volume').status).toBe('warn')
  })
})

describe('고강도 상한과 배치', () => {
  it('Z3 초과가 10분을 넘으면 주의를 표시한다', () => {
    const sessions = baseWeek().map((session) =>
      session.id === 'fri' ? { ...session, supraMinutes: 15 } : session,
    )

    expect(pick(validateProgram(sessions, NO_BASELINE), 'supra-volume').status).toBe('warn')
  })

  it('Z3 초과가 20분을 넘으면 위반으로 처리한다', () => {
    const sessions = baseWeek().map((session) =>
      session.id === 'fri' ? { ...session, supraMinutes: 25 } : session,
    )

    expect(pick(validateProgram(sessions, NO_BASELINE), 'supra-volume').status).toBe('fail')
  })

  it('역치 세션이 3일에 걸치면 위반으로 처리한다', () => {
    const sessions = baseWeek().map((session) =>
      session.id === 'sun' ? { ...session, thresholdMinutes: 15 } : session,
    )

    expect(pick(validateProgram(sessions, NO_BASELINE), 'threshold-days').status).toBe('fail')
  })

  it('같은 날 두 세션은 역치일 1일로 계산한다', () => {
    const sessions = [
      ...baseWeek(),
      makeSession({
        id: 'tue-pm',
        dayIndex: 1,
        type: 'threshold_interval',
        durationMinutes: 45,
        thresholdMinutes: 15,
      }),
    ]

    expect(pick(validateProgram(sessions, NO_BASELINE), 'threshold-days').status).toBe('pass')
  })

  it('역치 세션이 연달아 있으면 주의를 표시한다', () => {
    const sessions = baseWeek().map((session) =>
      session.id === 'wed' ? { ...session, thresholdMinutes: 10 } : session,
    )

    expect(pick(validateProgram(sessions, NO_BASELINE), 'hard-day-spacing').status).toBe('warn')
  })

  it('템플릿은 반복되므로 일요일과 월요일도 연속으로 본다', () => {
    const sessions = [
      makeSession({
        id: 'sun',
        dayIndex: 6,
        type: 'threshold_interval',
        durationMinutes: 60,
        thresholdMinutes: 30,
      }),
      makeSession({
        id: 'mon',
        dayIndex: 0,
        type: 'threshold_interval',
        durationMinutes: 60,
        thresholdMinutes: 20,
      }),
    ]

    expect(pick(validateProgram(sessions, NO_BASELINE), 'hard-day-spacing').status).toBe('warn')
  })
})

describe('강도 분포와 구성', () => {
  it('이지 비율이 75% 미만이면 위반으로 처리한다', () => {
    const sessions = [
      makeSession({
        id: 'tue',
        dayIndex: 1,
        type: 'threshold_interval',
        durationMinutes: 60,
        thresholdMinutes: 40,
      }),
      makeSession({ id: 'thu', dayIndex: 3, durationMinutes: 40 }),
    ]

    expect(pick(validateProgram(sessions, NO_BASELINE), 'polarization').status).toBe('fail')
  })

  it('롱런이 없으면 주의를 표시한다', () => {
    const sessions = baseWeek().filter((session) => session.type !== 'long_run')

    expect(pick(validateProgram(sessions, NO_BASELINE), 'long-run').status).toBe('warn')
  })

  it('7일 모두 훈련하면 휴식일 주의를 표시한다', () => {
    const sessions = [
      ...baseWeek(),
      makeSession({ id: 'thu', dayIndex: 3, type: 'recovery', durationMinutes: 30 }),
    ]

    expect(pick(validateProgram(sessions, NO_BASELINE), 'rest-day').status).toBe('warn')
  })
})

describe('볼륨 증가율', () => {
  it('4주 평균 대비 30%를 넘으면 위반으로 처리한다', () => {
    const checks = validateProgram(baseWeek(), { fourWeekAvgDistance: 20 })

    expect(pick(checks, 'volume-ramp').status).toBe('fail')
  })

  it('4주 평균과 비슷하면 통과한다', () => {
    const checks = validateProgram(baseWeek(), { fourWeekAvgDistance: 45 })

    expect(pick(checks, 'volume-ramp').status).toBe('pass')
  })
})

describe('getOverallStatus', () => {
  it('위반이 하나라도 있으면 fail을 반환한다', () => {
    const checks: ProgramCheck[] = [
      { id: 'a', label: 'A', status: 'pass', message: '' },
      { id: 'b', label: 'B', status: 'warn', message: '' },
      { id: 'c', label: 'C', status: 'fail', message: '' },
    ]

    expect(getOverallStatus(checks)).toBe('fail')
  })

  it('주의만 있으면 warn을 반환한다', () => {
    const checks: ProgramCheck[] = [
      { id: 'a', label: 'A', status: 'pass', message: '' },
      { id: 'b', label: 'B', status: 'warn', message: '' },
    ]

    expect(getOverallStatus(checks)).toBe('warn')
  })

  it('모두 통과면 pass를 반환한다', () => {
    const checks: ProgramCheck[] = [{ id: 'a', label: 'A', status: 'pass', message: '' }]

    expect(getOverallStatus(checks)).toBe('pass')
  })
})

describe('프리셋', () => {
  it('모든 프리셋이 위반 없이 통과한다', () => {
    for (const preset of PROGRAM_PRESETS) {
      const checks = validateProgram(instantiatePreset(preset), NO_BASELINE)
      const fails = checks.filter((check) => check.status === 'fail')

      expect(fails, `${preset.name}: ${fails.map((f) => f.message).join(', ')}`).toHaveLength(0)
    }
  })

  it('프리셋 세션 id는 프리셋 안에서 고유하다', () => {
    for (const preset of PROGRAM_PRESETS) {
      const sessions = instantiatePreset(preset)
      const ids = new Set(sessions.map((session) => session.id))

      expect(ids.size).toBe(sessions.length)
    }
  })
})
