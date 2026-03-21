import { createClient } from '@libsql/client'
import { existsSync, readdirSync, readFileSync } from 'fs'
import { join } from 'path'

const RESULTS_DIR = join(process.cwd(), 'results')

function createDbClient() {
  const dbUrl = process.env.TURSO_DATABASE_URL
  const authToken = process.env.TURSO_AUTH_TOKEN

  if (dbUrl && authToken) {
    return createClient({ url: dbUrl, authToken })
  }

  return createClient({ url: 'file:sessions.db' })
}

const db = createDbClient()

export async function initDb() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      start_time TEXT NOT NULL,
      sport TEXT DEFAULT 'running',
      distance REAL NOT NULL,
      duration_seconds INTEGER NOT NULL,
      avg_pace TEXT,
      avg_hr INTEGER,
      max_hr INTEGER,
      calories INTEGER,
      avg_cadence INTEGER,
      total_ascent INTEGER,
      total_descent INTEGER,
      split_type TEXT,
      split_diff_seconds INTEGER,
      consistency_cv REAL,
      consistency_rating TEXT,
      hr_drift REAL,
      fatigue_drop_seconds INTEGER,
      z1_pct REAL,
      z2_pct REAL,
      z3_pct REAL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `)

  await db.execute(`
    CREATE INDEX IF NOT EXISTS idx_sessions_date ON sessions(date)
  `)
}

export async function upsertSession(analysis) {
  const id = `${analysis.date}_${analysis.startTime}`
  const { summary, splits, consistency, heartRate, fatigue, elevation } = analysis

  await db.execute({
    sql: `
      INSERT OR REPLACE INTO sessions (
        id, date, start_time, sport, distance, duration_seconds,
        avg_pace, avg_hr, max_hr, calories, avg_cadence,
        total_ascent, total_descent, split_type, split_diff_seconds,
        consistency_cv, consistency_rating, hr_drift, fatigue_drop_seconds
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    args: [
      id,
      analysis.date,
      analysis.startTime,
      analysis.sport || 'running',
      summary.distance,
      summary.durationSeconds,
      summary.avgPace,
      summary.avgHeartRate,
      summary.maxHeartRate,
      summary.calories,
      summary.avgCadence || null,
      elevation?.totalAscent || 0,
      elevation?.totalDescent || 0,
      splits?.type || null,
      splits?.diffSeconds || null,
      consistency?.cv || null,
      consistency?.rating || null,
      heartRate?.drift || null,
      fatigue?.dropSeconds || null,
    ],
  })
}

export async function syncAllSessions() {
  await initDb()

  if (!existsSync(RESULTS_DIR)) {
    console.log('No results directory found')
    return
  }

  const dirs = readdirSync(RESULTS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)

  let synced = 0

  for (const dir of dirs) {
    const dataPath = join(RESULTS_DIR, dir, 'data.json')
    if (!existsSync(dataPath)) continue

    try {
      const analysis = JSON.parse(readFileSync(dataPath, 'utf-8'))
      await upsertSession(analysis)
      synced++
    } catch (e) {
      console.error(`Failed to sync ${dir}: ${e.message}`)
    }
  }

  console.log(`Synced ${synced} sessions to database`)
}

export async function getSeasonStats(fromDate, toDate) {
  const result = await db.execute({
    sql: `
      SELECT
        COUNT(*) as total_sessions,
        SUM(distance) as total_distance,
        SUM(duration_seconds) as total_duration,
        AVG(avg_hr) as avg_hr,
        AVG(consistency_cv) as avg_cv,
        SUM(total_ascent) as total_ascent
      FROM sessions
      WHERE date BETWEEN ? AND ?
    `,
    args: [fromDate, toDate],
  })
  return result.rows[0]
}

export async function getWeeklyVolume(weeks = 12) {
  const result = await db.execute({
    sql: `
      SELECT
        strftime('%Y-W%W', date) as week,
        COUNT(*) as sessions,
        SUM(distance) as distance,
        SUM(duration_seconds) / 3600.0 as hours,
        AVG(avg_hr) as avg_hr
      FROM sessions
      WHERE date >= date('now', '-' || ? || ' weeks')
      GROUP BY week
      ORDER BY week
    `,
    args: [weeks],
  })
  return result.rows
}

export async function getConsecutiveHardSessions() {
  const result = await db.execute(`
    SELECT date, avg_hr, consistency_rating,
           LAG(avg_hr) OVER (ORDER BY date) as prev_hr,
           LAG(date) OVER (ORDER BY date) as prev_date
    FROM sessions
    WHERE avg_hr > 150
    ORDER BY date DESC
    LIMIT 20
  `)
  return result.rows.filter((row) => {
    if (!row.prev_date) return false
    const curr = new Date(row.date)
    const prev = new Date(row.prev_date)
    const diffDays = (curr - prev) / (1000 * 60 * 60 * 24)
    return diffDays <= 1
  })
}

export async function getSimilarSessions(distance, tolerance = 2) {
  const result = await db.execute({
    sql: `
      SELECT date, distance, avg_pace, avg_hr, consistency_cv, split_type
      FROM sessions
      WHERE distance BETWEEN ? AND ?
      ORDER BY date DESC
      LIMIT 10
    `,
    args: [distance - tolerance, distance + tolerance],
  })
  return result.rows
}

export async function getRecentSessions(limit = 10) {
  const result = await db.execute({
    sql: `
      SELECT date, distance, avg_pace, avg_hr, consistency_rating, split_type
      FROM sessions
      ORDER BY date DESC
      LIMIT ?
    `,
    args: [limit],
  })
  return result.rows
}

export async function getMonthlyTrend(months = 6) {
  const result = await db.execute({
    sql: `
      SELECT
        strftime('%Y-%m', date) as month,
        COUNT(*) as sessions,
        SUM(distance) as total_km,
        AVG(avg_hr) as avg_hr,
        AVG(consistency_cv) as avg_cv
      FROM sessions
      WHERE date >= date('now', '-' || ? || ' months')
      GROUP BY month
      ORDER BY month
    `,
    args: [months],
  })
  return result.rows
}

if (process.argv[1].includes('db.mjs')) {
  syncAllSessions()
    .then(() => {
      console.log('Database sync complete')
      process.exit(0)
    })
    .catch((e) => {
      console.error('Sync failed:', e)
      process.exit(1)
    })
}
