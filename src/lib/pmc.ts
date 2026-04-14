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

  if (tsb > 25) {
    return {
      status: 'fresh',
      label: '최상 (Fresh)',
      color: 'green',
      advice: '컨디션이 최상이에요. 고강도 훈련이나 레이스에 적합합니다.',
    }
  } else if (tsb > 5) {
    return {
      status: 'recovered',
      label: '회복 (Recovered)',
      color: 'blue',
      advice: '회복된 상태예요. 가벼운~중간 강도 훈련이 적합합니다.',
    }
  } else if (tsb > -10) {
    return {
      status: 'neutral',
      label: '보통 (Neutral)',
      color: 'yellow',
      advice: '평상시 컨디션이에요. 평소 훈련량을 유지하면 좋습니다.',
    }
  } else if (tsb > -30) {
    return {
      status: 'tired',
      label: '피로 (Tired)',
      color: 'orange',
      advice: '피로가 쌓여 있어요. 회복 러닝이나 휴식을 권장합니다.',
    }
  } else {
    return {
      status: 'overreaching',
      label: '과훈련 (Overreaching)',
      color: 'red',
      advice: '과훈련 위험이 있어요. 며칠간 충분한 휴식이 필요합니다.',
    }
  }
}

/**
 * 주간 TSS를 현재 체력 유지에 필요한 부하(CTL × 7)와 비교해 해석한다.
 * 절대값이 아니라 개인 체력 수준 대비 상대적 부하를 표현한다.
 */
export function getWeeklyTSSComparison(weeklyTSS: number, currentCTL: number): string {
  if (currentCTL <= 0) return '체력 데이터 부족 — 기준 비교 불가'

  const maintenance = currentCTL * 7
  const ratio = weeklyTSS / maintenance
  const percent = Math.round((ratio - 1) * 100)

  if (ratio < 0.8) return `체력 유지 수준보다 ${-percent}% 낮음 — 체력이 감소할 수 있습니다`
  if (ratio < 1.2) return `체력 유지 수준 (${percent >= 0 ? '+' : ''}${percent}%)`
  if (ratio < 1.5) return `체력 증가 구간 (+${percent}%) — 안정적으로 부하를 늘리는 중`
  return `급격한 부하 증가 (+${percent}%) — 부상·오버트레이닝 위험`
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
