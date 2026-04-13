import type { SessionWithFeedback } from '@/types/running'
import type { WeekGroup, CalendarDay, FlowDataPoint } from './sessions-table.types'

const SESSION_TYPE_MAP: Record<string, string> = {
  threshold_interval: '역치',
  tempo: '템포',
  easy: '이지',
  long_run: '롱런',
  progression: '프로그레션',
  trail: '트레일',
  recovery: '회복',
}

type SessionBadgeVariant =
  | 'easy'
  | 'recovery'
  | 'moderate'
  | 'tempo'
  | 'threshold'
  | 'hard'
  | 'longRun'
  | 'progression'
  | 'trail'
  | 'outline'

const SESSION_TYPE_VARIANTS: Record<string, SessionBadgeVariant> = {
  이지: 'easy',
  회복: 'recovery',
  중강도: 'moderate',
  템포: 'tempo',
  역치: 'threshold',
  롱런: 'longRun',
  프로그레션: 'progression',
  트레일: 'trail',
  고강도: 'hard',
}

/**
 * 세션의 훈련 유형을 한글 라벨로 반환한다.
 * metadata.type이 있으면 매핑하고, 없으면 평균 심박 기준으로 이지/중강도/고강도를 분류한다.
 * 캘린더 셀, 차트 툴팁, 배지 등에서 세션 유형을 표시할 때 사용한다.
 * @param session - 분석 대상 세션
 */
export function getSessionTypeLabel(session: SessionWithFeedback): string {
  if (session.metadata?.type) {
    return SESSION_TYPE_MAP[session.metadata.type] || session.metadata.type
  }

  if (session.summary.avgHeartRate < 140) return '이지'
  if (session.summary.avgHeartRate < 150) return '중강도'
  return '고강도'
}

/**
 * 한글 유형 라벨을 배지 variant로 변환한다.
 * getSessionTypeLabel의 반환값을 받아 UI 컴포넌트의 스타일 variant를 결정할 때 사용한다.
 * @param label - getSessionTypeLabel이 반환한 한글 유형 라벨
 */
export function getSessionTypeVariant(label: string): SessionBadgeVariant {
  return SESSION_TYPE_VARIANTS[label] || 'outline'
}

const SESSION_TYPE_COLORS: Record<SessionBadgeVariant, string> = {
  easy: 'var(--green)',
  recovery: 'var(--green)',
  moderate: 'var(--yellow)',
  tempo: 'var(--orange)',
  threshold: 'var(--red)',
  hard: 'var(--red)',
  longRun: 'var(--blue)',
  progression: 'var(--purple)',
  trail: 'var(--cyan)',
  outline: 'var(--muted-foreground)',
}

/**
 * 한글 유형 라벨에 대응하는 CSS 변수 색상을 반환한다.
 * 캘린더 도트, 차트 바 등에서 세션 유형별 색상을 지정할 때 사용한다.
 * @param label - getSessionTypeLabel이 반환한 한글 유형 라벨
 */
export function getSessionTypeColor(label: string): string {
  const variant = SESSION_TYPE_VARIANTS[label] || 'outline'
  return SESSION_TYPE_COLORS[variant]
}

const LOCATION_LABELS: Record<string, string> = {
  treadmill: '트레드밀',
  road: '로드',
  trail: '트레일',
}

/**
 * 세션의 운동 장소를 한글로 반환한다.
 * metadata.location이 없으면 null을 반환한다.
 * 캘린더 툴팁에서 "이지 · 트레드밀" 형태로 장소를 표시할 때 사용한다.
 * @param session - 분석 대상 세션
 */
export function getLocationLabel(session: SessionWithFeedback): string | null {
  const location = session.metadata?.location
  if (!location) return null
  return LOCATION_LABELS[location] || location
}

/**
 * 날짜 문자열을 "MM. DD. (요일)" 한국어 형식으로 변환한다.
 * @param dateStr - YYYY-MM-DD 형식의 날짜 문자열
 */
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr)

  return date.toLocaleDateString('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
  })
}

const TIME_BASED_TYPES = new Set(['이지', '회복', '중강도'])
const DISTANCE_BASED_TYPES = new Set(['롱런', '템포', '역치', '프로그레션', '트레일', '고강도'])

/**
 * 시간 기반 훈련 유형인지 판별한다. (이지, 회복, 중강도)
 * 세션 목록에서 주요 지표를 시간/거리 중 어느 쪽으로 표시할지 결정할 때 사용한다.
 * @param label - getSessionTypeLabel이 반환한 한글 유형 라벨
 */
export function isTimeBased(label: string): boolean {
  return TIME_BASED_TYPES.has(label)
}

/**
 * 거리 기반 훈련 유형인지 판별한다. (롱런, 템포, 역치, 프로그레션, 트레일, 고강도)
 * isTimeBased의 반대 케이스로, 거리를 주요 지표로 표시할 때 사용한다.
 * @param label - getSessionTypeLabel이 반환한 한글 유형 라벨
 */
export function isDistanceBased(label: string): boolean {
  return DISTANCE_BASED_TYPES.has(label)
}

/**
 * 날짜 문자열을 ISO 주차 형식(YYYY-WNN)으로 변환한다.
 * 세션을 주 단위로 그룹핑할 때 키 값으로 사용한다.
 * @param dateStr - YYYY-MM-DD 형식의 날짜 문자열
 */
export function getISOWeek(dateStr: string): string {
  const date = new Date(dateStr)
  const thursday = new Date(date)
  thursday.setDate(date.getDate() + 4 - (date.getDay() || 7))
  const yearStart = new Date(thursday.getFullYear(), 0, 1)
  const weekNum = Math.ceil(((thursday.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return `${thursday.getFullYear()}-W${weekNum.toString().padStart(2, '0')}`
}

/**
 * 날짜가 속한 주의 월요일~일요일 범위를 반환한다.
 * 주간 캘린더의 날짜 셀을 생성하거나 주간 범위를 표시할 때 사용한다.
 * @param dateStr - YYYY-MM-DD 형식의 날짜 문자열
 */
export function getWeekRange(dateStr: string): { start: Date; end: Date } {
  const date = new Date(dateStr)
  const day = date.getDay()
  const diffToMonday = day === 0 ? -6 : 1 - day

  const monday = new Date(date)
  monday.setDate(date.getDate() + diffToMonday)

  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)

  return { start: monday, end: sunday }
}

/**
 * 날짜가 속한 주를 "M/D - M/D" 형식의 문자열로 반환한다.
 * 주간 헤더에서 "3/16 - 3/22" 같은 범위를 표시할 때 사용한다.
 * @param dateStr - YYYY-MM-DD 형식의 날짜 문자열
 */
export function formatWeekRange(dateStr: string): string {
  const { start, end } = getWeekRange(dateStr)
  const startStr = `${start.getMonth() + 1}/${start.getDate()}`
  const endStr = `${end.getMonth() + 1}/${end.getDate()}`
  return `${startStr} - ${endStr}`
}

interface WeeklyStats {
  totalDistance: number
  totalDurationMinutes: number
}

const DAY_LABELS = ['월', '화', '수', '목', '금', '토', '일']

/**
 * 주간 세션 목록을 월~일 7일 배열로 변환한다.
 * 각 요일에 해당하는 세션을 배치하여 WeeklyCalendar 컴포넌트에서 렌더링할 때 사용한다.
 * @param sessions - 해당 주의 세션 목록
 * @param startDate - 주의 시작일 (월요일)
 */
export function buildWeekCalendarData(
  sessions: SessionWithFeedback[],
  startDate: Date,
): CalendarDay[] {
  const sessionsByDay = new Map<number, SessionWithFeedback[]>()
  for (const session of sessions) {
    const date = new Date(session.date)
    const dow = date.getUTCDay()
    const dayIndex = dow === 0 ? 6 : dow - 1
    const existing = sessionsByDay.get(dayIndex) || []
    existing.push(session)
    sessionsByDay.set(dayIndex, existing)
  }

  return DAY_LABELS.map((dayLabel, index) => {
    const cellDate = new Date(startDate)
    cellDate.setDate(startDate.getDate() + index)

    return {
      dayLabel,
      dateNum: cellDate.getDate(),
      sessions: sessionsByDay.get(index) || [],
    }
  })
}

/**
 * 주간 세션 목록을 요일별 거리/심박 차트 데이터로 변환한다.
 * WeeklyFlowChart에서 Bar(거리) + Line(심박) 차트를 그릴 때 사용한다.
 * 세션이 없는 날은 distance: 0, type: "Rest"로 표시된다.
 * @param sessions - 해당 주의 세션 목록
 * @param startDate - 주의 시작일 (월요일)
 */
export function buildWeekFlowData(
  sessions: SessionWithFeedback[],
  startDate: Date,
): FlowDataPoint[] {
  const days = buildWeekCalendarData(sessions, startDate)

  return days.map((day) => {
    if (day.sessions.length === 0) {
      return {
        day: day.dayLabel,
        distance: 0,
        avgHR: null,
        color: 'var(--input)',
        type: 'Rest',
      }
    }

    const totalDistance = day.sessions.reduce((sum, s) => sum + s.summary.distance, 0)
    const avgHR = Math.round(
      day.sessions.reduce((sum, s) => sum + s.summary.avgHeartRate, 0) / day.sessions.length,
    )
    const primary = day.sessions.reduce((a, b) => (b.summary.distance > a.summary.distance ? b : a))
    const typeLabel = getSessionTypeLabel(primary)

    return {
      day: day.dayLabel,
      distance: Math.round(totalDistance * 10) / 10,
      avgHR: avgHR,
      color: getSessionTypeColor(typeLabel),
      type: typeLabel,
    }
  })
}

/**
 * 세션 배열을 ISO 주차 기준으로 그룹핑한다.
 * 각 그룹에 거리/시간/심박/고도 합산과 세션 수를 계산한다.
 * SessionsTable의 최상위에서 주간 단위 렌더링을 위해 사용한다.
 * @param sessions - 전체 세션 목록
 */
export function groupSessionsByWeek(sessions: SessionWithFeedback[]): WeekGroup[] {
  const groups = new Map<string, WeekGroup>()

  for (const session of sessions) {
    const week = getISOWeek(session.date)
    const durationMinutes = parseDurationToMinutes(session.summary.duration)

    if (!groups.has(week)) {
      groups.set(week, {
        week,
        weekNumber: Number(week.split('-W')[1]),
        weekRange: formatWeekRange(session.date),
        sessions: [session],
        totalDistance: session.summary.distance,
        totalDurationMinutes: durationMinutes,
        avgHeartRate: 0,
        totalAscent: session.elevation?.totalAscent ?? 0,
        sessionCount: 1,
      })
    } else {
      const group = groups.get(week)!
      group.sessions.push(session)
      group.totalDistance += session.summary.distance
      group.totalDurationMinutes += durationMinutes
      group.totalAscent += session.elevation?.totalAscent ?? 0
      group.sessionCount++
    }
  }

  const result = Array.from(groups.values())
  for (const group of result) {
    group.avgHeartRate = Math.round(
      group.sessions.reduce((sum, s) => sum + s.summary.avgHeartRate, 0) / group.sessions.length,
    )
  }
  return result
}

/**
 * 분 단위 시간을 사람이 읽기 쉬운 형태로 변환한다.
 * 60분 미만이면 "45m", 이상이면 "1h 30m" 형식으로 반환한다.
 * 주간 요약 헤더에서 총 운동 시간을 표시할 때 사용한다.
 * @param minutes - 변환할 분 단위 시간
 */
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = Math.round(minutes % 60)
  if (hours > 0) {
    return `${hours}h ${mins}m`
  }
  return `${mins}m`
}

/**
 * "H:MM:SS" 또는 "M:SS" 형식의 duration 문자열을 분 단위 숫자로 파싱한다.
 * 주간 통계 합산이나 세션별 비율 계산에서 내부적으로 사용한다.
 * @param duration - summary.duration 값 (예: "1:30:00", "50:00")
 */
export function parseDurationToMinutes(duration: string): number {
  const parts = duration.split(':').map(Number)
  if (parts.length === 3) {
    return parts[0] * 60 + parts[1] + parts[2] / 60
  }
  return parts[0] + parts[1] / 60
}

/**
 * 세션 목록에서 주차별 총 거리/시간을 집계한다.
 * getSessionWeeklyPercent에서 개별 세션의 주간 비율을 구할 때 기반 데이터로 사용한다.
 * @param sessions - 전체 세션 목록
 */
export function calculateWeeklyStats(sessions: SessionWithFeedback[]): Map<string, WeeklyStats> {
  const weeklyMap = new Map<string, WeeklyStats>()

  for (const session of sessions) {
    const week = getISOWeek(session.date)
    const existing = weeklyMap.get(week) || {
      totalDistance: 0,
      totalDurationMinutes: 0,
    }
    const durationMinutes = parseDurationToMinutes(session.summary.duration)

    weeklyMap.set(week, {
      totalDistance: existing.totalDistance + session.summary.distance,
      totalDurationMinutes: existing.totalDurationMinutes + durationMinutes,
    })
  }

  return weeklyMap
}

/**
 * 개별 세션이 해당 주 전체 거리/시간에서 차지하는 비율(%)을 반환한다.
 * calculateWeeklyStats의 결과와 함께 사용하여 세션별 기여도를 표시할 때 사용한다.
 * @param session - 비율을 구할 대상 세션
 * @param weeklyStats - calculateWeeklyStats가 반환한 주차별 통계
 */
export function getSessionWeeklyPercent(
  session: SessionWithFeedback,
  weeklyStats: Map<string, WeeklyStats>,
): { distancePercent: number; durationPercent: number } {
  const week = getISOWeek(session.date)
  const stats = weeklyStats.get(week)

  if (!stats) {
    return { distancePercent: 0, durationPercent: 0 }
  }

  const durationMinutes = parseDurationToMinutes(session.summary.duration)

  return {
    distancePercent: Math.round((session.summary.distance / stats.totalDistance) * 100),
    durationPercent: Math.round((durationMinutes / stats.totalDurationMinutes) * 100),
  }
}
