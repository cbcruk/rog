/** PMC 차트 일별 데이터 포인트 */
export interface PMCDataPoint {
  /** 날짜 (YYYY-MM-DD) */
  date: string
  /** Chronic Training Load — 42일 지수이동평균 */
  ctl: number
  /** Acute Training Load — 7일 지수이동평균 */
  atl: number
  /** Training Stress Balance (CTL - ATL), 양수 = 회복, 음수 = 피로 */
  tsb: number
  /** 해당일 총 TSS */
  tss: number
}

/** DB daily_metrics 테이블 행 */
export interface DailyMetrics {
  date: string
  ctl: number | null
  atl: number | null
  tsb: number | null
  total_tss: number | null
  sessions_count: number
}

/** TSB 기반 컨디션 상태 */
export interface FitnessStatus {
  status: /** TSB > 25 — 충분한 회복 */
    | 'fresh'
    /** TSB 5~25 — 회복됨 */
    | 'recovered'
    /** TSB -10~5 — 보통 */
    | 'neutral'
    /** TSB -30~-10 — 피로 누적 */
    | 'tired'
    /** TSB < -30 — 과훈련 위험 */
    | 'overreaching'
    | 'unknown'
  label: string
  color: string
  /** 현재 상태에 기반한 훈련 가이드 문구 */
  advice: string
}

/** HR 기반 TSS 계산 결과 */
export interface TSSResult {
  /** Running TSS (hrTSS = 시간 × IF² × 100) */
  rtss: number | null
  /** Intensity Factor ((avgHR - restHR) / (LTHR - restHR)) */
  intensityFactor: number | null
}

/** TSS 존 분류 및 회복 가이드 */
export interface TSSZone {
  /** 존 코드 (low / medium / high / very_high) */
  zone: string
  label: string
  /** 예상 회복 시간 (예: "< 24h") */
  recovery: string | null
}

/** TSS 전체 정보 (결과 + 존) */
export interface TSSInfo {
  rtss: number | null
  intensityFactor: number | null
  zone: string
  zoneLabel: string
  recovery: string | null
}

/** CTL 변화 추세 */
export interface FitnessTrend {
  trend: /** CTL 5% 이상 상승 */
    | 'improving'
    /** CTL 5% 이상 하락 */
    | 'declining'
    /** CTL 변동 ±5% 이내 */
    | 'stable'
    | 'unknown'
  label: string
  /** CTL 변화율 (%) */
  change?: number
}

export interface PMCChartProps {
  data: PMCDataPoint[]
  days?: number
}

/** 주간 HR Zone 시간 집계 (Bakken 3-zone 모델 기준) */
export interface WeeklyZoneStats {
  /** 이지 구간 (Bakken Z1 = Friel Z1+Z2+Z3) 총 시간(초) */
  easySeconds: number
  /** 이지 구간 비율 (%) */
  easyPct: number
  /** 역치 구간 (Bakken Z2 = Friel Z4) 총 시간(초) */
  thresholdSeconds: number
  /** 역치 구간 비율 (%) */
  thresholdPct: number
  /** VO2max 구간 (Bakken Z3 = Friel Z5) 총 시간(초) */
  supraSeconds: number
  /** VO2max 구간 비율 (%) */
  supraPct: number
  /** 총 훈련 시간(초) */
  totalSeconds: number
  /** 집계 기간 시작일 (YYYY-MM-DD) */
  startDate: string
  /** 집계 기간 종료일 (YYYY-MM-DD, 오늘) */
  endDate: string
}

/** 대시보드 PMC 요약 */
export interface PMCSummary {
  currentCTL: number
  currentATL: number
  currentTSB: number
  /** 최근 7일 총 TSS */
  weeklyTSS: number
  fitnessStatus: FitnessStatus
  trend: {
    /** 7일 전 대비 CTL */
    ctl7d: number
    /** 28일 전 대비 CTL */
    ctl28d: number
  }
}
