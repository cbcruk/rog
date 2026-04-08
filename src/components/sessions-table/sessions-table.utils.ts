import type { SessionWithFeedback } from '@/types/running'

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

export function getSessionTypeLabel(session: SessionWithFeedback): string {
  if (session.metadata?.type) {
    return SESSION_TYPE_MAP[session.metadata.type] || session.metadata.type
  }

  if (session.summary.avgHeartRate < 140) return '이지'
  if (session.summary.avgHeartRate < 150) return '중강도'
  return '고강도'
}

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

export function getSessionTypeColor(label: string): string {
  const variant = SESSION_TYPE_VARIANTS[label] || 'outline'
  return SESSION_TYPE_COLORS[variant]
}

const LOCATION_LABELS: Record<string, string> = {
  treadmill: '트레드밀',
  road: '로드',
  trail: '트레일',
}

export function getLocationLabel(session: SessionWithFeedback): string | null {
  const location = session.metadata?.location
  if (!location) return null
  return LOCATION_LABELS[location] || location
}

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

export function isTimeBased(label: string): boolean {
  return TIME_BASED_TYPES.has(label)
}

export function isDistanceBased(label: string): boolean {
  return DISTANCE_BASED_TYPES.has(label)
}

export function getISOWeek(dateStr: string): string {
  const date = new Date(dateStr)
  const thursday = new Date(date)
  thursday.setDate(date.getDate() + 4 - (date.getDay() || 7))
  const yearStart = new Date(thursday.getFullYear(), 0, 1)
  const weekNum = Math.ceil(((thursday.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return `${thursday.getFullYear()}-W${weekNum.toString().padStart(2, '0')}`
}

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

export function parseDurationToMinutes(duration: string): number {
  const parts = duration.split(':').map(Number)
  if (parts.length === 3) {
    return parts[0] * 60 + parts[1] + parts[2] / 60
  }
  return parts[0] + parts[1] / 60
}

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
