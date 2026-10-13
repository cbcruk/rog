import { getSessionTypeColor } from '@/components/sessions-table/sessions-table.utils'
import type { PlannedSession, PlannedSessionType } from '@/types/program'

/** 월요일 시작 요일 라벨. 계획 세션의 dayIndex와 인덱스가 일치한다. */
export const DAY_LABELS = ['월', '화', '수', '목', '금', '토', '일'] as const

/** 계획 세션 유형의 한글 라벨. 세션 로그의 유형 라벨과 표기를 맞춘다. */
const PLANNED_TYPE_LABELS: Record<PlannedSessionType, string> = {
  easy: '이지',
  recovery: '회복',
  long_run: '롱런',
  tempo: '템포',
  threshold_interval: '역치',
  progression: '프로그레션',
  trail: '트레일',
}

/** 세션 유형 선택 UI에 노출할 순서. 강도가 낮은 것부터 나열한다. */
export const PLANNED_TYPE_OPTIONS: PlannedSessionType[] = [
  'recovery',
  'easy',
  'long_run',
  'trail',
  'progression',
  'tempo',
  'threshold_interval',
]

/** 계획 세션 유형의 한글 라벨을 반환한다. */
export function getPlannedTypeLabel(type: PlannedSessionType): string {
  return PLANNED_TYPE_LABELS[type]
}

/**
 * 계획 세션 유형의 표시 색상을 반환한다.
 * 세션 로그와 같은 색 체계를 쓰기 위해 한글 라벨을 거쳐 `getSessionTypeColor`에 위임한다.
 */
export function getPlannedTypeColor(type: PlannedSessionType): string {
  return getSessionTypeColor(PLANNED_TYPE_LABELS[type])
}

/** 유형별 기본 세션 값. 요일을 눌러 세션을 추가할 때 시작점으로 사용한다. */
const TYPE_DEFAULTS: Record<
  PlannedSessionType,
  { durationMinutes: number; distanceKm: number; thresholdMinutes: number; supraMinutes: number }
> = {
  recovery: { durationMinutes: 30, distanceKm: 5, thresholdMinutes: 0, supraMinutes: 0 },
  easy: { durationMinutes: 45, distanceKm: 7.5, thresholdMinutes: 0, supraMinutes: 0 },
  long_run: { durationMinutes: 90, distanceKm: 15, thresholdMinutes: 0, supraMinutes: 0 },
  trail: { durationMinutes: 75, distanceKm: 10, thresholdMinutes: 0, supraMinutes: 0 },
  progression: { durationMinutes: 55, distanceKm: 9, thresholdMinutes: 15, supraMinutes: 0 },
  tempo: { durationMinutes: 50, distanceKm: 8.5, thresholdMinutes: 20, supraMinutes: 0 },
  threshold_interval: {
    durationMinutes: 50,
    distanceKm: 8,
    thresholdMinutes: 25,
    supraMinutes: 0,
  },
}

/**
 * 지정한 요일에 배치할 새 계획 세션을 만든다.
 * 유형별 기본값이 채워져 있어 추가 직후에도 주간 합계와 검증이 의미 있는 값을 보여준다.
 * @param dayIndex - 배치할 요일 (0=월 ... 6=일)
 * @param type - 세션 유형
 */
export function createPlannedSession(
  dayIndex: number,
  type: PlannedSessionType = 'easy',
): PlannedSession {
  return {
    id: crypto.randomUUID(),
    dayIndex,
    type,
    ...TYPE_DEFAULTS[type],
  }
}

/** 세션 유형을 바꾸면서 해당 유형의 기본 존 배분을 다시 적용한다. */
export function applyTypeDefaults(
  session: PlannedSession,
  type: PlannedSessionType,
): PlannedSession {
  return { ...session, type, ...TYPE_DEFAULTS[type] }
}

/** 분 단위 시간을 "1h 25m" 형태로 표시한다. */
export function formatMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = Math.round(minutes % 60)
  if (hours > 0) return `${hours}h ${mins}m`
  return `${mins}m`
}
