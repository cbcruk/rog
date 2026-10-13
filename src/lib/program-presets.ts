import type { PlannedSession, PlannedSessionType } from '@/types/program'

/** 프리셋 정의에서 사용하는 축약 세션 형태. id는 프리셋 로드 시 생성한다. */
interface PresetSession {
  dayIndex: number
  type: PlannedSessionType
  durationMinutes: number
  distanceKm?: number
  thresholdMinutes?: number
  supraMinutes?: number
  note?: string
}

export interface ProgramPreset {
  id: string
  name: string
  description: string
  sessions: PresetSession[]
}

/**
 * Bakken 노르웨이 모델의 대표적인 주간 마이크로사이클.
 *
 * 네 프리셋 모두 `validateProgram`에서 위반(fail) 없이 나오도록 구성되어 있으므로,
 * 빈 화면에서 시작하지 않고 검증된 주를 불러와 조정하는 흐름을 만든다.
 * 레이스 주는 매주 반복되는 템플릿이 아니므로 프리셋에 포함하지 않는다.
 */
export const PROGRAM_PRESETS: ProgramPreset[] = [
  {
    id: 'double-threshold',
    name: '더블 역치 주',
    description: '화요일에 하루 두 번 역치를 소화하는 노르웨이 모델의 시그니처 주간 구성',
    sessions: [
      { dayIndex: 0, type: 'easy', durationMinutes: 45, distanceKm: 7.5 },
      {
        dayIndex: 1,
        type: 'threshold_interval',
        durationMinutes: 50,
        distanceKm: 8,
        thresholdMinutes: 25,
        note: '오전 · 5 x 5분 / 1분 조깅',
      },
      {
        dayIndex: 1,
        type: 'threshold_interval',
        durationMinutes: 45,
        distanceKm: 7,
        thresholdMinutes: 20,
        note: '오후 · 10 x 1000m / 1분 조깅',
      },
      { dayIndex: 2, type: 'easy', durationMinutes: 45, distanceKm: 7.5 },
      {
        dayIndex: 3,
        type: 'threshold_interval',
        durationMinutes: 50,
        distanceKm: 8,
        thresholdMinutes: 25,
        note: '6 x 5분 / 1분 조깅',
      },
      { dayIndex: 5, type: 'easy', durationMinutes: 40, distanceKm: 6.5 },
      { dayIndex: 6, type: 'long_run', durationMinutes: 85, distanceKm: 14 },
    ],
  },
  {
    id: 'volume',
    name: '볼륨 주',
    description: '역치는 하루로 모으고 이지 주행량을 늘려 유산소 기반을 쌓는 주',
    sessions: [
      { dayIndex: 0, type: 'easy', durationMinutes: 50, distanceKm: 8.5 },
      {
        dayIndex: 1,
        type: 'threshold_interval',
        durationMinutes: 65,
        distanceKm: 11,
        thresholdMinutes: 40,
        note: '8 x 5분 / 1분 조깅',
      },
      { dayIndex: 2, type: 'easy', durationMinutes: 50, distanceKm: 8.5 },
      { dayIndex: 4, type: 'recovery', durationMinutes: 35, distanceKm: 5.5 },
      { dayIndex: 5, type: 'easy', durationMinutes: 55, distanceKm: 9 },
      { dayIndex: 6, type: 'long_run', durationMinutes: 100, distanceKm: 17 },
    ],
  },
  {
    id: 'threshold-vo2max',
    name: '역치 + VO2max 주',
    description: '역치 세션에 짧은 VO2max 자극을 더해 상단 강도를 건드리는 주',
    sessions: [
      { dayIndex: 0, type: 'easy', durationMinutes: 45, distanceKm: 7.5 },
      {
        dayIndex: 1,
        type: 'threshold_interval',
        durationMinutes: 60,
        distanceKm: 10,
        thresholdMinutes: 35,
        note: '7 x 5분 / 1분 조깅',
      },
      { dayIndex: 2, type: 'easy', durationMinutes: 45, distanceKm: 7.5 },
      {
        dayIndex: 4,
        type: 'threshold_interval',
        durationMinutes: 50,
        distanceKm: 8,
        thresholdMinutes: 10,
        supraMinutes: 8,
        note: '5 x 3분 VO2max / 2분 조깅',
      },
      { dayIndex: 5, type: 'easy', durationMinutes: 35, distanceKm: 6 },
      { dayIndex: 6, type: 'long_run', durationMinutes: 90, distanceKm: 15 },
    ],
  },
  {
    id: 'deload',
    name: '디로드 주',
    description: '3~4주 블록 뒤 흡수 주간. 강도의 형태만 남기고 총량을 크게 줄인다',
    sessions: [
      { dayIndex: 0, type: 'easy', durationMinutes: 35, distanceKm: 6 },
      {
        dayIndex: 1,
        type: 'threshold_interval',
        durationMinutes: 45,
        distanceKm: 7.5,
        thresholdMinutes: 20,
        note: '4 x 5분 / 1분 조깅',
      },
      { dayIndex: 2, type: 'recovery', durationMinutes: 30, distanceKm: 5 },
      { dayIndex: 4, type: 'easy', durationMinutes: 40, distanceKm: 6.5 },
      { dayIndex: 6, type: 'long_run', durationMinutes: 60, distanceKm: 10 },
    ],
  },
]

/**
 * 프리셋을 편집 가능한 계획 세션 목록으로 변환한다.
 * 각 세션에 프리셋 내에서 안정적인 id를 부여해 React key와 편집 대상 추적에 사용한다.
 * @param preset - 변환할 프리셋
 */
export function instantiatePreset(preset: ProgramPreset): PlannedSession[] {
  return preset.sessions.map((session, index) => ({
    id: `${preset.id}-${index}`,
    dayIndex: session.dayIndex,
    type: session.type,
    durationMinutes: session.durationMinutes,
    distanceKm: session.distanceKm,
    thresholdMinutes: session.thresholdMinutes ?? 0,
    supraMinutes: session.supraMinutes ?? 0,
    note: session.note,
  }))
}
