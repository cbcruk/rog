import { calculateProgramTotals, groupSessionsByDay } from '@/lib/program-metrics'
import type {
  PlannedSession,
  ProgramCheck,
  ProgramTotals,
  ProgramValidationContext,
} from '@/types/program'

/**
 * Bakken 노르웨이 모델 기반 주간 프로그램 제약.
 * 값의 근거는 `recommendations.ts`의 사후 추천 규칙과 동일하며,
 * 여기서는 주가 끝난 뒤가 아니라 주를 설계하는 시점에 적용된다.
 */
const LIMITS = {
  /** 주간 역치 존 목표 하한 (분) */
  thresholdMin: 40,
  /** 주간 역치 존 목표 상한 (분) */
  thresholdMax: 75,
  /** 역치량이 이 값 미만이면 역치 주로 보기 어렵다 (분) */
  thresholdFloor: 20,
  /** 주간 역치 초과 존 허용치 (분) */
  supraMax: 10,
  /** 주간 역치 초과 존 한계치 (분) */
  supraCeiling: 20,
  /** 역치 세션을 배치할 수 있는 최대 일수 */
  thresholdDaysMax: 2,
  /** 폴라라이즈드 훈련의 이지 비율 목표 (%) */
  easyPercentTarget: 80,
  /** 이지 비율이 이 값 미만이면 위반 (%) */
  easyPercentFloor: 75,
  /** 4주 평균 대비 주의 배율 */
  volumeWarnRatio: 1.15,
  /** 4주 평균 대비 위반 배율 */
  volumeFailRatio: 1.3,
} as const

function checkThresholdVolume(totals: ProgramTotals): ProgramCheck {
  const minutes = totals.thresholdMinutes
  const base = { id: 'threshold-volume', label: '주간 역치량' }

  if (minutes < LIMITS.thresholdFloor) {
    return {
      ...base,
      status: 'fail',
      message: `역치 존 ${minutes}분. 주간 목표 ${LIMITS.thresholdMin}~${LIMITS.thresholdMax}분에 크게 못 미칩니다.`,
    }
  }

  if (minutes < LIMITS.thresholdMin) {
    return {
      ...base,
      status: 'warn',
      message: `역치 존 ${minutes}분. ${LIMITS.thresholdMin}분까지 ${LIMITS.thresholdMin - minutes}분 남았습니다.`,
    }
  }

  if (minutes > LIMITS.thresholdMax) {
    return {
      ...base,
      status: 'warn',
      message: `역치 존 ${minutes}분. 상한 ${LIMITS.thresholdMax}분을 넘어 회복이 밀릴 수 있습니다.`,
    }
  }

  return {
    ...base,
    status: 'pass',
    message: `역치 존 ${minutes}분. 목표 구간(${LIMITS.thresholdMin}~${LIMITS.thresholdMax}분) 안에 있습니다.`,
  }
}

function checkSupraVolume(totals: ProgramTotals): ProgramCheck {
  const minutes = totals.supraMinutes
  const base = { id: 'supra-volume', label: '고강도(Z3) 상한' }

  if (minutes > LIMITS.supraCeiling) {
    return {
      ...base,
      status: 'fail',
      message: `역치 초과 존 ${minutes}분. ${LIMITS.supraMax}분 이하로 줄이세요.`,
    }
  }

  if (minutes > LIMITS.supraMax) {
    return {
      ...base,
      status: 'warn',
      message: `역치 초과 존 ${minutes}분으로 권장치(${LIMITS.supraMax}분)를 넘었습니다.`,
    }
  }

  return {
    ...base,
    status: 'pass',
    message: `역치 초과 존 ${minutes}분. 권장치(${LIMITS.supraMax}분) 이내입니다.`,
  }
}

function checkThresholdDays(totals: ProgramTotals): ProgramCheck {
  const days = totals.thresholdDays
  const base = { id: 'threshold-days', label: '역치 세션 배치' }

  if (days > LIMITS.thresholdDaysMax) {
    return {
      ...base,
      status: 'fail',
      message: `역치 세션이 ${days}일에 걸쳐 있습니다. 주 ${LIMITS.thresholdDaysMax}일 이내로 모으세요.`,
    }
  }

  if (days === 0) {
    return {
      ...base,
      status: 'warn',
      message: '역치 세션이 없습니다. 이지 주가 아니라면 1~2일 배치하세요.',
    }
  }

  return {
    ...base,
    status: 'pass',
    message: `역치 세션이 ${days}일에 배치되어 있습니다.`,
  }
}

const DAY_LABELS = ['월', '화', '수', '목', '금', '토', '일']

/**
 * 역치 세션이 연속된 날에 배치됐는지 검사한다.
 * 프로그램은 매주 반복되는 템플릿이므로 일요일 다음은 월요일로 이어서 판단한다.
 */
function checkHardDaySpacing(sessions: PlannedSession[]): ProgramCheck {
  const byDay = groupSessionsByDay(sessions)
  const isHard = byDay.map((day) =>
    day.some((session) => session.thresholdMinutes > 0 || session.supraMinutes > 0),
  )

  const collisions: string[] = []

  for (let i = 0; i < 7; i++) {
    const next = (i + 1) % 7
    if (isHard[i] && isHard[next]) {
      collisions.push(`${DAY_LABELS[i]}→${DAY_LABELS[next]}`)
    }
  }

  const base = { id: 'hard-day-spacing', label: '고강도 간격' }

  if (collisions.length > 0) {
    return {
      ...base,
      status: 'warn',
      message: `역치 세션이 연달아 있습니다 (${collisions.join(', ')}). 사이에 이지 데이를 두세요.`,
    }
  }

  return { ...base, status: 'pass', message: '역치 세션 사이에 회복일이 확보되어 있습니다.' }
}

function checkPolarization(totals: ProgramTotals): ProgramCheck {
  const percent = totals.easyPercent
  const base = { id: 'polarization', label: '강도 분포' }

  if (percent < LIMITS.easyPercentFloor) {
    return {
      ...base,
      status: 'fail',
      message: `이지 비율 ${percent}%. 80/20 원칙에서 벗어나 중강도 함정에 빠질 위험이 있습니다.`,
    }
  }

  if (percent < LIMITS.easyPercentTarget) {
    return {
      ...base,
      status: 'warn',
      message: `이지 비율 ${percent}%. 목표 ${LIMITS.easyPercentTarget}% 이상입니다.`,
    }
  }

  return { ...base, status: 'pass', message: `이지 비율 ${percent}%. 폴라라이즈드 구성입니다.` }
}

function checkLongRun(sessions: PlannedSession[]): ProgramCheck {
  const count = sessions.filter((session) => session.type === 'long_run').length
  const base = { id: 'long-run', label: '롱런' }

  if (count === 0) {
    return { ...base, status: 'warn', message: '롱런이 없습니다. 주 1회 배치를 권장합니다.' }
  }

  return { ...base, status: 'pass', message: `롱런 ${count}회가 포함되어 있습니다.` }
}

function checkRestDay(totals: ProgramTotals): ProgramCheck {
  const base = { id: 'rest-day', label: '휴식일' }

  if (totals.trainingDays >= 7) {
    return { ...base, status: 'warn', message: '완전 휴식일이 없습니다. 최소 1일을 비우세요.' }
  }

  return {
    ...base,
    status: 'pass',
    message: `훈련 ${totals.trainingDays}일 / 휴식 ${7 - totals.trainingDays}일.`,
  }
}

function checkVolumeRamp(totals: ProgramTotals, avgDistance: number): ProgramCheck {
  const base = { id: 'volume-ramp', label: '볼륨 증가율' }
  const ratio = totals.totalDistance / avgDistance
  const percent = Math.round((ratio - 1) * 100)
  const sign = percent >= 0 ? '+' : ''

  if (ratio > LIMITS.volumeFailRatio) {
    return {
      ...base,
      status: 'fail',
      message: `4주 평균(${avgDistance.toFixed(1)}km) 대비 ${sign}${percent}%. 부상 위험 구간입니다.`,
    }
  }

  if (ratio > LIMITS.volumeWarnRatio) {
    return {
      ...base,
      status: 'warn',
      message: `4주 평균(${avgDistance.toFixed(1)}km) 대비 ${sign}${percent}%. 증가폭이 다소 큽니다.`,
    }
  }

  return {
    ...base,
    status: 'pass',
    message: `4주 평균(${avgDistance.toFixed(1)}km) 대비 ${sign}${percent}%.`,
  }
}

/**
 * 주간 프로그램이 Bakken 모델 제약을 만족하는지 검증한다.
 * 프로그램 에디터에서 세션을 편집할 때마다 호출되어 실시간 피드백을 제공한다.
 * @param sessions - 검증 대상 계획 세션 목록
 * @param context - 최근 훈련량 등 프로그램 외부 컨텍스트
 */
export function validateProgram(
  sessions: PlannedSession[],
  context: ProgramValidationContext,
): ProgramCheck[] {
  if (sessions.length === 0) {
    return [
      {
        id: 'empty',
        label: '프로그램 구성',
        status: 'warn',
        message: '아직 세션이 없습니다. 프리셋을 불러오거나 요일을 눌러 추가하세요.',
      },
    ]
  }

  const totals = calculateProgramTotals(sessions)

  const checks: ProgramCheck[] = [
    checkThresholdVolume(totals),
    checkSupraVolume(totals),
    checkThresholdDays(totals),
    checkHardDaySpacing(sessions),
    checkPolarization(totals),
    checkLongRun(sessions),
    checkRestDay(totals),
  ]

  if (context.fourWeekAvgDistance > 0) {
    checks.push(checkVolumeRamp(totals, context.fourWeekAvgDistance))
  }

  return checks
}

/** 검증 결과 목록에서 가장 심각한 상태를 반환한다. */
export function getOverallStatus(checks: ProgramCheck[]): 'pass' | 'warn' | 'fail' {
  if (checks.some((check) => check.status === 'fail')) return 'fail'
  if (checks.some((check) => check.status === 'warn')) return 'warn'
  return 'pass'
}
