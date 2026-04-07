import { createClient } from '@libsql/client'
import type { PMCDataPoint, PMCSummary, DailyMetrics, FitnessStatus } from '@/types/pmc'

function createDbClient(): ReturnType<typeof createClient> {
  const dbUrl = process.env.TURSO_DATABASE_URL
  const authToken = process.env.TURSO_AUTH_TOKEN

  if (dbUrl && authToken) {
    return createClient({ url: dbUrl, authToken })
  }

  return createClient({ url: 'file:sessions.db' })
}

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

export function getFitnessStatus(tsb: number | null): FitnessStatus {
  if (tsb === null) {
    return { status: 'unknown', label: 'N/A', color: 'gray' }
  }

  if (tsb > 25) {
    return { status: 'fresh', label: 'Fresh', color: 'green' }
  } else if (tsb > 5) {
    return { status: 'recovered', label: 'Recovered', color: 'blue' }
  } else if (tsb > -10) {
    return { status: 'neutral', label: 'Neutral', color: 'yellow' }
  } else if (tsb > -30) {
    return { status: 'tired', label: 'Tired', color: 'orange' }
  } else {
    return { status: 'overreaching', label: 'Overreaching', color: 'red' }
  }
}

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
