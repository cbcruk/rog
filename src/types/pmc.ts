export interface PMCDataPoint {
  date: string
  ctl: number
  atl: number
  tsb: number
  tss: number
}

export interface DailyMetrics {
  date: string
  ctl: number | null
  atl: number | null
  tsb: number | null
  total_tss: number | null
  sessions_count: number
}

export interface FitnessStatus {
  status: 'fresh' | 'recovered' | 'neutral' | 'tired' | 'overreaching' | 'unknown'
  label: string
  color: string
}

export interface TSSInfo {
  rtss: number | null
  intensityFactor: number | null
  zone: string
  zoneLabel: string
  recovery: string | null
}

export interface PMCChartProps {
  data: PMCDataPoint[]
  days?: number
}

export interface PMCSummary {
  currentCTL: number
  currentATL: number
  currentTSB: number
  weeklyTSS: number
  fitnessStatus: FitnessStatus
  trend: {
    ctl7d: number
    ctl28d: number
  }
}
