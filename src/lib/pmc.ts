import { createClient } from '@libsql/client'
import type {
  PMCDataPoint,
  PMCSummary,
  DailyMetrics,
  FitnessStatus,
  WeeklyZoneStats,
} from '@/types/pmc'
import type { RecommendationInput } from '@/lib/recommendations'

function createDbClient(): ReturnType<typeof createClient> {
  const dbUrl = process.env.TURSO_DATABASE_URL
  const authToken = process.env.TURSO_AUTH_TOKEN

  if (dbUrl && authToken) {
    return createClient({ url: dbUrl, authToken })
  }

  return createClient({ url: 'file:sessions.db' })
}

/** 최근 N일간의 PMC 일별 데이터(CTL, ATL, TSB, TSS)를 조회한다. */
export async function getPMCData(days: number = 90): Promise<PMCDataPoint[]> {
  const db = createDbClient()
  const fromDate = new Date()
  fromDate.setDate(fromDate.getDate() - days)

  const result = await db.execute({
    sql: `
      SELECT date, ctl, atl, tsb, total_tss as tss
      FROM daily_metrics
      WHERE date >= ?
      ORDER BY date ASC
    `,
    args: [fromDate.toISOString().split('T')[0]],
  })

  return result.rows.map((row) => ({
    date: row.date as string,
    ctl: (row.ctl as number) ?? 0,
    atl: (row.atl as number) ?? 0,
    tsb: (row.tsb as number) ?? 0,
    tss: (row.tss as number) ?? 0,
  }))
}

/** 가장 최근 날짜의 PMC 지표를 반환한다. 데이터가 없으면 null. */
export async function getLatestPMC(): Promise<DailyMetrics | null> {
  const db = createDbClient()

  const result = await db.execute(`
    SELECT date, ctl, atl, tsb, total_tss, sessions_count
    FROM daily_metrics
    ORDER BY date DESC
    LIMIT 1
  `)

  if (result.rows.length === 0) return null

  const row = result.rows[0]
  return {
    date: row.date as string,
    ctl: row.ctl as number | null,
    atl: row.atl as number | null,
    tsb: row.tsb as number | null,
    total_tss: row.total_tss as number | null,
    sessions_count: (row.sessions_count as number) ?? 0,
  }
}

/** TSB 값을 fresh/recovered/neutral/tired/overreaching 상태로 분류한다. */
export function getFitnessStatus(tsb: number | null): FitnessStatus {
  if (tsb === null) {
    return {
      status: 'unknown',
      label: '데이터 없음',
      color: 'gray',
      advice: '데이터가 부족해 상태를 판정할 수 없어요.',
    }
  }

  const v = tsb.toFixed(1)

  if (tsb > 25) {
    return {
      status: 'fresh',
      label: '최상 (Fresh)',
      color: 'green',
      advice: `TSB ${v}은 최상 범위(+25 이상) 안에 있어요. 고강도 훈련이나 레이스에 적합합니다.`,
    }
  } else if (tsb > 5) {
    return {
      status: 'recovered',
      label: '회복 (Recovered)',
      color: 'blue',
      advice: `TSB ${v}은 회복 범위(+5~+25) 안에 있어요. 가벼운~중간 강도 훈련이 적합합니다.`,
    }
  } else if (tsb > -10) {
    return {
      status: 'neutral',
      label: '보통 (Neutral)',
      color: 'yellow',
      advice: `TSB ${v}은 평상시 범위(-10~+5) 안에 있어요. 평소 훈련량을 유지하면 좋습니다.`,
    }
  } else if (tsb > -30) {
    return {
      status: 'tired',
      label: '피로 (Tired)',
      color: 'orange',
      advice: `TSB ${v}은 피로 범위(-30~-10) 안에 있어요. 회복 러닝이나 휴식을 권장합니다.`,
    }
  } else {
    return {
      status: 'overreaching',
      label: '과훈련 (Overreaching)',
      color: 'red',
      advice: `TSB ${v}은 과훈련 범위(-30 이하)에요. 며칠간 충분한 휴식이 필요합니다.`,
    }
  }
}

/**
 * ACWR(Acute:Chronic Workload Ratio, Gabbett 2016)을 계산하고 한국어로 해석한다.
 * ACWR = 주간 TSS / (CTL × 7). 스포츠 의학에서 가장 널리 쓰이는 부상 예측 지표.
 */
export function getWeeklyTSSComparison(weeklyTSS: number, currentCTL: number): string {
  if (currentCTL <= 0) return '체력 데이터 부족 — ACWR 계산 불가'

  const acwr = weeklyTSS / (currentCTL * 7)
  const label = `ACWR ${acwr.toFixed(2)}`

  if (acwr < 0.8) return `${label} — 디트레이닝 구간. 부하가 너무 낮습니다`
  if (acwr <= 1.3) return `${label} — 안전 구간 (sweet spot)`
  if (acwr <= 1.5) return `${label} — 주의. 부상 위험이 증가하는 구간`
  return `${label} — 위험. 급격한 부하 증가로 부상 위험이 높습니다`
}

/** 최근 7일간 세션의 HR Zone 시간 집계를 반환한다. */
export async function getWeeklyZoneStats(): Promise<WeeklyZoneStats | null> {
  const db = createDbClient()

  const today = new Date()
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  const weekAgoStr = weekAgo.toISOString().split('T')[0]
  const todayStr = today.toISOString().split('T')[0]

  const [zoneResult, totalResult] = await Promise.all([
    db.execute({
      sql: `
        SELECT
          COALESCE(SUM(z1_seconds), 0) as z1,
          COALESCE(SUM(z2_seconds), 0) as z2,
          COALESCE(SUM(z3_seconds), 0) as z3,
          COALESCE(SUM(z4_seconds), 0) as z4,
          COALESCE(SUM(z5_seconds), 0) as z5,
          COUNT(*) as analyzed_sessions
        FROM sessions
        WHERE date >= ?
          AND z1_seconds IS NOT NULL
      `,
      args: [weekAgoStr],
    }),
    db.execute({
      sql: `
        SELECT
          COALESCE(SUM(duration_seconds), 0) as total_seconds,
          COUNT(*) as total_sessions
        FROM sessions
        WHERE date >= ?
      `,
      args: [weekAgoStr],
    }),
  ])

  const zoneRow = zoneResult.rows[0]
  const totalRow = totalResult.rows[0]
  const z1 = Number(zoneRow.z1)
  const z2 = Number(zoneRow.z2)
  const z3 = Number(zoneRow.z3)
  const z4 = Number(zoneRow.z4)
  const z5 = Number(zoneRow.z5)
  const total = z1 + z2 + z3 + z4 + z5
  const analyzedSessions = Number(zoneRow.analyzed_sessions)
  const totalSessions = Number(totalRow.total_sessions)
  const totalWeekSeconds = Number(totalRow.total_seconds)

  if (totalSessions === 0) return null

  const easy = z1 + z2
  const threshold = z3 + z4

  return {
    easySeconds: easy,
    easyPct: total > 0 ? Math.round((easy / total) * 100) : 0,
    thresholdSeconds: threshold,
    thresholdPct: total > 0 ? Math.round((threshold / total) * 100) : 0,
    supraSeconds: z5,
    supraPct: total > 0 ? Math.round((z5 / total) * 100) : 0,
    totalSeconds: total,
    totalWeekSeconds,
    analyzedSessions,
    totalSessions,
    startDate: weekAgoStr,
    endDate: todayStr,
  }
}

/** 추천 엔진에 필요한 입력 데이터를 수집한다. */
export async function getRecommendationInput(
  tsb: number,
  zoneStats: WeeklyZoneStats | null,
): Promise<RecommendationInput> {
  const db = createDbClient()

  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  const fourWeeksAgo = new Date()
  fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28)

  const [weeklyResult, fourWeekResult] = await Promise.all([
    db.execute({
      sql: `SELECT COALESCE(SUM(distance), 0) as dist FROM sessions WHERE date >= ?`,
      args: [weekAgo.toISOString().split('T')[0]],
    }),
    db.execute({
      sql: `SELECT COALESCE(SUM(distance), 0) as dist FROM sessions WHERE date >= ?`,
      args: [fourWeeksAgo.toISOString().split('T')[0]],
    }),
  ])

  const weeklyDistance = Number(weeklyResult.rows[0].dist)
  const fourWeekTotalDistance = Number(fourWeekResult.rows[0].dist)
  const fourWeekAvgDistance = fourWeekTotalDistance / 4

  return {
    tsb,
    weeklyZ4Seconds: zoneStats?.thresholdSeconds ?? 0,
    weeklyZ5Seconds: zoneStats?.supraSeconds ?? 0,
    weeklyDistance,
    fourWeekAvgDistance,
  }
}

/** 대시보드용 PMC 요약을 반환한다. 현재 CTL/ATL/TSB, 주간 TSS, 컨디션 상태, 7일/28일 CTL 추세를 포함한다. */
export async function getPMCSummary(): Promise<PMCSummary | null> {
  const db = createDbClient()

  const latestResult = await db.execute(`
    SELECT date, ctl, atl, tsb
    FROM daily_metrics
    ORDER BY date DESC
    LIMIT 1
  `)

  if (latestResult.rows.length === 0) return null

  const latest = latestResult.rows[0]
  const currentCTL = (latest.ctl as number) ?? 0
  const currentATL = (latest.atl as number) ?? 0
  const currentTSB = (latest.tsb as number) ?? 0

  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  const monthAgo = new Date()
  monthAgo.setDate(monthAgo.getDate() - 28)

  const weeklyTSSResult = await db.execute({
    sql: `
      SELECT COALESCE(SUM(total_tss), 0) as weekly_tss
      FROM daily_metrics
      WHERE date >= ?
    `,
    args: [weekAgo.toISOString().split('T')[0]],
  })

  const trendResult = await db.execute({
    sql: `
      SELECT date, ctl
      FROM daily_metrics
      WHERE date IN (?, ?)
      ORDER BY date ASC
    `,
    args: [monthAgo.toISOString().split('T')[0], weekAgo.toISOString().split('T')[0]],
  })

  const weeklyTSS = (weeklyTSSResult.rows[0]?.weekly_tss as number) ?? 0

  let ctl7d = currentCTL
  let ctl28d = currentCTL

  for (const row of trendResult.rows) {
    const date = row.date as string
    const ctl = (row.ctl as number) ?? 0

    if (date === weekAgo.toISOString().split('T')[0]) {
      ctl7d = ctl
    }
    if (date === monthAgo.toISOString().split('T')[0]) {
      ctl28d = ctl
    }
  }

  return {
    currentCTL,
    currentATL,
    currentTSB,
    weeklyTSS,
    fitnessStatus: getFitnessStatus(currentTSB),
    trend: {
      ctl7d: currentCTL - ctl7d,
      ctl28d: currentCTL - ctl28d,
    },
  }
}

/** 최근 N주간의 주별 총 TSS를 조회한다. */
export async function getWeeklyTSSHistory(
  weeks: number = 12,
): Promise<{ week: string; tss: number }[]> {
  const db = createDbClient()

  const result = await db.execute({
    sql: `
      SELECT
        strftime('%Y-W%W', date) as week,
        SUM(total_tss) as tss
      FROM daily_metrics
      WHERE date >= date('now', '-' || ? || ' weeks')
      GROUP BY week
      ORDER BY week
    `,
    args: [weeks],
  })

  return result.rows.map((row) => ({
    week: row.week as string,
    tss: (row.tss as number) ?? 0,
  }))
}
