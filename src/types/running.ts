export type SessionType =
  /** 역치 인터벌 */
  | 'threshold_interval'
  /** 템포 런 */
  | 'tempo'
  /** 이지 런 */
  | 'easy'
  /** 롱런 */
  | 'long_run'
  /** 프로그레션 런 (점진적 페이스 상승) */
  | 'progression'
  /** 트레일 런 */
  | 'trail'
  /** 회복 런 */
  | 'recovery'

export type Location =
  /** 트레드밀 (실내) */
  | 'treadmill'
  /** 로드 (도로/트랙) */
  | 'road'
  /** 트레일 (산길/비포장) */
  | 'trail'

export type Intent =
  /** Zone 2 볼륨 축적 */
  | 'z2_volume'
  /** 유산소 기반 구축 */
  | 'aerobic_base'
  /** 마라톤 페이스 연습 */
  | 'mp_practice'
  /** 회복 목적 */
  | 'recovery'
  /** 레이스 특화 훈련 */
  | 'race_specific'
  /** 새 코스 탐색 */
  | 'exploration'

export type WeatherCondition =
  /** 맑음 */
  | 'sunny'
  /** 흐림 */
  | 'cloudy'
  /** 비 */
  | 'rainy'
  /** 바람 */
  | 'windy'
  /** 더위 */
  | 'hot'
  /** 추위 */
  | 'cold'

export type SleepQuality =
  /** 나쁨 */
  | 'poor'
  /** 보통 이하 */
  | 'fair'
  /** 양호 */
  | 'good'
  /** 매우 좋음 */
  | 'excellent'

export type FatigueLevel =
  /** 상쾌 */
  | 'fresh'
  /** 보통 */
  | 'normal'
  /** 피곤 */
  | 'tired'
  /** 탈진 */
  | 'exhausted'

export type SplitType =
  /** 후반 느려짐 (포지티브 스플릿) */
  | 'positive'
  /** 후반 빨라짐 (네거티브 스플릿) */
  | 'negative'

export type ConsistencyRating =
  /** CV < 3% */
  | 'excellent'
  /** CV 3-5% */
  | 'good'
  /** CV > 5% */
  | 'needs_improvement'

export interface Weather {
  /** 기온 (°C) */
  temperature: number
  /** 습도 (%) */
  humidity: number
  condition: WeatherCondition
}

export interface BodyCondition {
  fatigue: FatigueLevel
  /** 통증 부위 목록 */
  soreness?: string[]
  /** 부상 설명 */
  injury?: string
}

export interface TreadmillSettings {
  /** 경사도 (%) */
  incline: number
  /** 운동 구간 속도 (km/h) */
  workSpeed: number
  /** 회복 구간 속도 (km/h) */
  restSpeed: number
}

export interface IntervalSettings {
  /** 운동 구간 길이 (초) */
  workDuration: number
  /** 회복 구간 길이 (초) */
  restDuration: number
  /** 목표 세트 수 */
  sets: number
  /** 구조 설명 (예: "5x(3min work / 2min rest)") */
  structure: string
}

export interface TargetHR {
  /** 운동 구간 목표 심박 [min, max] */
  work: [number, number]
  /** 회복 구간 목표 심박 [min, max] */
  rest: [number, number]
}

/** .meta.json에서 로드되는 세션 메타데이터 */
export interface Metadata {
  type: SessionType
  location: Location
  /** 훈련 의도 */
  intent?: Intent
  treadmill?: TreadmillSettings
  intervals?: IntervalSettings
  targetHR?: TargetHR
  weather?: Weather
  /** 주관적 운동 강도 (1-10) */
  rpe?: number
  sleepQuality?: SleepQuality
  bodyCondition?: BodyCondition
  notes?: string
}

/** 세션 요약 지표 */
export interface Summary {
  /** 총 거리 (km) */
  distance: number
  /** 총 시간 (H:MM:SS 또는 M:SS) */
  duration: string
  /** 총 시간 (초) */
  durationSeconds: number
  /** 평균 페이스 (M:SS/km) */
  avgPace: string
  /** 평균 심박 (bpm) */
  avgHeartRate: number
  /** 최대 심박 (bpm) */
  maxHeartRate: number
  /** 소모 칼로리 (kcal) */
  calories: number
  /** 평균 케이던스 (spm) */
  avgCadence: number | null
}

/** 전반/후반 스플릿 비교 */
export interface Splits {
  /** 전반 평균 페이스 (M:SS/km) */
  firstHalfPace: string
  /** 후반 평균 페이스 (M:SS/km) */
  secondHalfPace: string
  /** 전후반 페이스 차이 (초/km), 양수 = 후반 느림 */
  diffSeconds: number
  type: SplitType
}

/** 5km 단위 구간 분석 */
export interface Segment {
  /** 구간 범위 (예: "1-5km") */
  range: string
  /** 구간 평균 페이스 (M:SS/km) */
  pace: string
  /** 구간 평균 심박 (bpm) */
  avgHeartRate: number | null
}

/** 1km 랩 데이터 */
export interface Lap {
  /** 킬로미터 번호 */
  km: number
  /** 페이스 (분/km, raw) */
  pace: number
  /** 페이스 (M:SS/km) */
  paceFormatted: string
  /** 평균 심박 (bpm) */
  heartRate: number
  /** 케이던스 (spm) */
  cadence: number | null
  /** 오르막 (m) */
  ascent: number
  /** 내리막 (m) */
  descent: number
}

/** 페이스 일관성 분석 */
export interface Consistency {
  /** 페이스 표준편차 (초/km) */
  stdDevSeconds: number
  /** 변동계수 (%) — 낮을수록 균일 */
  cv: number
  rating: ConsistencyRating
}

export interface LapHighlight {
  km: number
  /** 페이스 (M:SS/km) */
  pace: string
}

export interface Highlights {
  fastestLap: LapHighlight
  slowestLap: LapHighlight
}

/** 심박 분석 */
export interface HeartRateAnalysis {
  /** 평균 심박 (bpm) */
  avgHeartRate: number
  /** 최저 심박 (bpm) */
  minHeartRate: number
  /** 최대 심박 (bpm) */
  maxHeartRate: number
  /** 심박 드리프트 (%) — 초반 대비 후반 심박 상승률 */
  drift: number
}

/** 피로도 분석 (10km 이상 세션) */
export interface FatigueAnalysis {
  /** 처음 5km 평균 페이스 (M:SS/km) */
  first5kmPace: string
  /** 마지막 5km 평균 페이스 (M:SS/km) */
  last5kmPace: string
  /** 페이스 저하량 (초/km), 양수 = 느려짐 */
  dropSeconds: number
}

export interface ElevationAnalysis {
  /** 총 오르막 (m) */
  totalAscent: number
  /** 총 내리막 (m) */
  totalDescent: number
}

/** 인터벌 1세트의 운동/회복 데이터 */
export interface IntervalSet {
  /** 세트 번호 */
  set: number
  work: {
    /** 운동 구간 길이 (초) */
    duration: number
    /** 운동 구간 길이 (M:SS) */
    durationFormatted: string
    /** 운동 구간 거리 (km) */
    distance: number
    /** 평균 심박 (bpm) */
    avgHR: number | null
    /** 최대 심박 (bpm) */
    maxHR: number | null
    /** 평균 페이스 (M:SS/km) */
    avgPace: string | null
    /** 목표 심박 존 유지율 (%) */
    hrInZone: number | null
  }
  rest: {
    /** 회복 구간 길이 (초) */
    duration: number
    /** 회복 구간 길이 (M:SS) */
    durationFormatted: string
    /** 평균 심박 (bpm) */
    avgHR: number | null
    /** 최저 심박 (bpm) */
    minHR: number | null
  }
}

/** 인터벌 훈련 전체 분석 */
export interface IntervalAnalysis {
  /** 구조 설명 (예: "5x(3min work / 2min rest)") */
  structure: string
  /** 실제 완료 세트 수 */
  totalSets: number
  /** 목표 세트 수 */
  targetSets: number
  /** 목표 세트 완료 여부 */
  completed: boolean
  summary: {
    /** 전체 운동 구간 평균 심박 (bpm) */
    avgWorkHR: number | null
    /** 전체 회복 구간 평균 심박 (bpm) */
    avgRestHR: number | null
    /** 운동-회복 심박 회복량 (bpm) */
    hrRecovery: number | null
  }
  sets: IntervalSet[]
}

/** FIT 파일 session 메시지 (Garmin SDK raw) */
export interface FitSession {
  startTime: Date
  /** 총 거리 (m) */
  totalDistance: number
  /** 총 시간 (초) */
  totalElapsedTime: number
  /** 평균 심박 (bpm) */
  avgHeartRate: number
  /** 최대 심박 (bpm) */
  maxHeartRate: number
  /** 소모 칼로리 (kcal) */
  totalCalories: number
  /** 평균 케이던스 (반보/분, ×2 = spm) */
  avgRunningCadence?: number
  /** 총 오르막 (m) */
  totalAscent?: number
  /** 총 내리막 (m) */
  totalDescent?: number
  sport?: string
  /** sub_sport로 treadmill/trail/road 자동 감지 */
  subSport?: string | number
  sub_sport?: string | number
}

/** FIT 파일 record 메시지 (1초 간격 raw) */
export interface FitRecord {
  timestamp: string
  /** 심박 (bpm) */
  heartRate?: number
  /** 속도 (m/s) */
  speed?: number
  /** 누적 거리 (m) */
  distance?: number
}

/** FIT 파일 lap 메시지 (1km 단위 raw) */
export interface FitLap {
  /** 랩 소요 시간 (초) */
  totalElapsedTime: number
  /** 랩 거리 (m) */
  totalDistance: number
  /** 평균 심박 (bpm) */
  avgHeartRate: number
  /** 평균 케이던스 (반보/분, ×2 = spm) */
  avgRunningCadence?: number
  /** 오르막 (m) */
  totalAscent?: number
  /** 내리막 (m) */
  totalDescent?: number
}

/** 분석 완료된 러닝 세션 */
export interface RunSession {
  /** 날짜 (YYYY-MM-DD) */
  date: string
  /** 시작 시각 (ISO 8601) */
  startTime: string
  sport: string
  metadata: Metadata | null
  summary: Summary
  splits: Splits
  segments: Segment[]
  laps: Lap[]
  consistency: Consistency
  highlights: Highlights
  heartRate: HeartRateAnalysis | null
  fatigue: FatigueAnalysis | null
  elevation: ElevationAnalysis
  intervals: IntervalAnalysis | null
}

/** HR 기반 자동 인터벌 감지 결과 */
export interface IntervalResult {
  /** 운동 구간 또는 회복 구간 */
  type: 'work' | 'rest'
  /** 구간 길이 (초) */
  duration: number
  /** 구간 길이 (M:SS) */
  durationFormatted: string
  /** 구간 거리 (km) */
  distance: number
  /** 평균 심박 (bpm) */
  avgHR: number | null
  /** 최대 심박 (bpm) */
  maxHR: number | null
  /** 최저 심박 (bpm) */
  minHR: number | null
  /** 평균 페이스 (M:SS/km) */
  avgPace: string | null
}

/** DB에서 가져온 세션 + 코칭 피드백 */
export interface SessionWithFeedback extends RunSession {
  id: string
  feedback?: string
}
