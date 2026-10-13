/**
 * 주간 훈련 프로그램(마이크로사이클) 도메인 타입.
 *
 * 세션 로그(`RunSession`)가 "실제로 뛴 것"을 기술한다면, 이 파일의 타입은
 * "뛰기로 계획한 것"을 기술한다. 프로그램은 특정 날짜에 묶이지 않고
 * 월~일 7일 슬롯으로만 구성되므로, 매주 재사용할 수 있다.
 */

/** 계획 세션의 훈련 유형. 세션 로그의 `metadata.type`과 키를 공유한다. */
export type PlannedSessionType =
  | 'easy'
  | 'recovery'
  | 'long_run'
  | 'tempo'
  | 'threshold_interval'
  | 'progression'
  | 'trail'

/** 계획 세션 하나. 월요일이 dayIndex 0, 일요일이 6이다. */
export interface PlannedSession {
  /** 프로그램 내에서 고유한 식별자 */
  id: string
  /** 요일 인덱스 (0=월 ... 6=일) */
  dayIndex: number
  /** 훈련 유형 */
  type: PlannedSessionType
  /** 총 세션 시간 목표 (분) */
  durationMinutes: number
  /** 총 거리 목표 (km). 시간 기반 세션은 생략 가능 */
  distanceKm?: number
  /** 역치 존(Bakken Z2, Friel Z3~Z4) 체류 목표 (분) */
  thresholdMinutes: number
  /** 역치 초과 존(Bakken Z3, Friel Z5) 체류 목표 (분) */
  supraMinutes: number
  /** 세션 메모 (예: "6 x 5분 / 1분 조깅") */
  note?: string
}

/** 재사용 가능한 주간 훈련 프로그램. */
export interface WeeklyProgram {
  id: string
  /** 프로그램 이름 (예: "더블 역치 주") */
  name: string
  /** 프로그램 설명 */
  description?: string
  /** 계획 세션 목록. 요일 순서는 보장되지 않는다 */
  sessions: PlannedSession[]
  /** 현재 적용 중인 프로그램인지 여부 */
  isActive: boolean
  /** ISO timestamp */
  createdAt: string
  /** ISO timestamp */
  updatedAt: string
}

/** 프로그램 저장 시 사용하는 입력값. id가 없으면 새로 생성한다. */
export interface WeeklyProgramInput {
  id?: string
  name: string
  description?: string
  sessions: PlannedSession[]
  isActive?: boolean
}

/** 프로그램 전체를 집계한 주간 지표. */
export interface ProgramTotals {
  /** 총 계획 거리 (km) */
  totalDistance: number
  /** 총 계획 시간 (분) */
  totalMinutes: number
  /** 이지 존(Bakken Z1) 시간 (분). 총 시간에서 역치/초과분을 뺀 값 */
  easyMinutes: number
  /** 역치 존(Bakken Z2) 시간 (분) */
  thresholdMinutes: number
  /** 역치 초과 존(Bakken Z3) 시간 (분) */
  supraMinutes: number
  /** 이지 시간 비율 (%). 폴라라이즈드 80/20 판정에 사용 */
  easyPercent: number
  /** 계획 세션 수 */
  sessionCount: number
  /** 훈련하는 날의 수 (하루 2세션은 1일로 계산) */
  trainingDays: number
  /** 역치 세션이 배치된 날의 수 */
  thresholdDays: number
  /** 존 구성으로 추정한 주간 TSS */
  estimatedTSS: number
}

/** 프로그램 검증 결과 한 건. */
export interface ProgramCheck {
  /** 검증 규칙 식별자 */
  id: string
  /** 규칙 이름 (예: "주간 역치량") */
  label: string
  /** 통과 / 주의 / 위반 */
  status: 'pass' | 'warn' | 'fail'
  /** 사용자에게 보여줄 설명 */
  message: string
}

/** 검증에 필요한 프로그램 외부 컨텍스트. */
export interface ProgramValidationContext {
  /** 최근 4주 평균 주간 거리 (km). 0이면 볼륨 증가 검사를 건너뛴다 */
  fourWeekAvgDistance: number
}
