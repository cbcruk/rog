export type SessionType =
  | 'threshold_interval'
  | 'tempo'
  | 'easy'
  | 'long_run'
  | 'progression'
  | 'trail'
  | 'recovery'

export type Location = 'treadmill' | 'road' | 'trail'

export type Intent =
  | 'z2_volume'
  | 'aerobic_base'
  | 'mp_practice'
  | 'recovery'
  | 'race_specific'
  | 'exploration'

export type WeatherCondition =
  | 'sunny'
  | 'cloudy'
  | 'rainy'
  | 'windy'
  | 'hot'
  | 'cold'

export type SleepQuality = 'poor' | 'fair' | 'good' | 'excellent'

export type FatigueLevel = 'fresh' | 'normal' | 'tired' | 'exhausted'

export type SplitType = 'positive' | 'negative'

export type ConsistencyRating = 'excellent' | 'good' | 'needs_improvement'

export interface Weather {
  temperature: number
  humidity: number
  condition: WeatherCondition
}

export interface BodyCondition {
  fatigue: FatigueLevel
  soreness?: string[]
  injury?: string
}

export interface TreadmillSettings {
  incline: number
  workSpeed: number
  restSpeed: number
}

export interface IntervalSettings {
  workDuration: number
  restDuration: number
  sets: number
  structure: string
}

export interface TargetHR {
  work: [number, number]
  rest: [number, number]
}

export interface Metadata {
  type: SessionType
  location: Location
  intent?: Intent
  treadmill?: TreadmillSettings
  intervals?: IntervalSettings
  targetHR?: TargetHR
  weather?: Weather
  rpe?: number
  sleepQuality?: SleepQuality
  bodyCondition?: BodyCondition
  notes?: string
}

export interface Summary {
  distance: number
  duration: string
  durationSeconds: number
  avgPace: string
  avgHeartRate: number
  maxHeartRate: number
  calories: number
  avgCadence: number | null
}

export interface Splits {
  firstHalfPace: string
  secondHalfPace: string
  diffSeconds: number
  type: SplitType
}

export interface Segment {
  range: string
  pace: string
  avgHeartRate: number | null
}

export interface Lap {
  km: number
  pace: number
  paceFormatted: string
  heartRate: number
  cadence: number | null
  ascent: number
  descent: number
}

export interface Consistency {
  stdDevSeconds: number
  cv: number
  rating: ConsistencyRating
}

export interface LapHighlight {
  km: number
  pace: string
}

export interface Highlights {
  fastestLap: LapHighlight
  slowestLap: LapHighlight
}

export interface HeartRateAnalysis {
  avgHeartRate: number
  minHeartRate: number
  maxHeartRate: number
  drift: number
}

export interface FatigueAnalysis {
  first5kmPace: string
  last5kmPace: string
  dropSeconds: number
}

export interface ElevationAnalysis {
  totalAscent: number
  totalDescent: number
}

export interface IntervalSet {
  set: number
  work: {
    duration: number
    durationFormatted: string
    distance: number
    avgHR: number | null
    maxHR: number | null
    avgPace: string | null
    hrInZone: number | null
  }
  rest: {
    duration: number
    durationFormatted: string
    avgHR: number | null
    minHR: number | null
  }
}

export interface IntervalAnalysis {
  structure: string
  totalSets: number
  targetSets: number
  completed: boolean
  summary: {
    avgWorkHR: number | null
    avgRestHR: number | null
    hrRecovery: number | null
  }
  sets: IntervalSet[]
}

export interface RunSession {
  date: string
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

export interface SessionWithFeedback extends RunSession {
  id: string
  feedback?: string
}
