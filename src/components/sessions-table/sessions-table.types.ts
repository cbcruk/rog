import type { SessionWithFeedback } from '@/types/running'

export interface SessionsTableProps {
  /** 표시할 전체 세션 목록 */
  sessions: SessionWithFeedback[]
}

/** ISO 주차 단위로 그룹핑된 세션 데이터 */
export interface WeekGroup {
  /** ISO 주차 키 (예: "2026-W12") */
  week: string
  /** 주차 번호 (예: 12) */
  weekNumber: number
  /** 주간 날짜 범위 (예: "3/16 - 3/22") */
  weekRange: string
  /** 해당 주의 세션 목록 */
  sessions: SessionWithFeedback[]
  /** 주간 총 거리 (km) */
  totalDistance: number
  /** 주간 총 운동 시간 (분) */
  totalDurationMinutes: number
  /** 주간 평균 심박 (bpm) */
  avgHeartRate: number
  /** 주간 총 획득고도 (m) */
  totalAscent: number
  /** 주간 세션 수 */
  sessionCount: number
}

/** 주간 캘린더의 하루 데이터 */
export interface CalendarDay {
  /** 요일 라벨 (예: "월", "화") */
  dayLabel: string
  /** 해당 날의 일자 (예: 16) */
  dateNum: number
  /** 해당 날의 세션 목록, 없으면 빈 배열 */
  sessions: SessionWithFeedback[]
}

/** WeeklyFlowChart의 요일별 데이터 포인트 */
export interface FlowDataPoint {
  /** 요일 라벨 (예: "월", "화") */
  day: string
  /** 해당 날 총 거리 (km), 휴식일이면 0 */
  distance: number
  /** 해당 날 평균 심박 (bpm), 휴식일이면 null */
  avgHR: number | null
  /** 세션 유형에 대응하는 CSS 변수 색상 */
  color: string
  /** 세션 유형 라벨 (예: "이지", "역치"), 휴식일이면 "Rest" */
  type: string
}
