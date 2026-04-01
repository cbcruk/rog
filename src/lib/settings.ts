import { createClient } from '@libsql/client'
import type { UserSettings } from '@/types/settings'
import { DEFAULT_SETTINGS } from '@/types/settings'

function createDbClient(): ReturnType<typeof createClient> {
  const dbUrl = process.env.TURSO_DATABASE_URL
  const authToken = process.env.TURSO_AUTH_TOKEN

  if (dbUrl && authToken) {
    return createClient({ url: dbUrl, authToken })
  }

  return createClient({ url: 'file:sessions.db' })
}

export async function getSettings(): Promise<UserSettings> {
  const db = createDbClient()

  const result = await db.execute(`SELECT key, value FROM user_settings`)

  const settings = { ...DEFAULT_SETTINGS }

  for (const row of result.rows) {
    const key = row.key as keyof UserSettings
    const value = row.value as string

    if (key in settings) {
      settings[key] = Number(value)
    }
  }

  return settings
}

export async function updateSettings(settings: Partial<UserSettings>): Promise<void> {
  const db = createDbClient()

  for (const [key, value] of Object.entries(settings)) {
    await db.execute({
      sql: `INSERT OR REPLACE INTO user_settings (key, value) VALUES (?, ?)`,
      args: [key, String(value)],
    })
  }
}

export async function getSetting(key: keyof UserSettings): Promise<number> {
  const db = createDbClient()

  const result = await db.execute({
    sql: `SELECT value FROM user_settings WHERE key = ?`,
    args: [key],
  })

  if (result.rows.length === 0) {
    return DEFAULT_SETTINGS[key]
  }

  return Number(result.rows[0].value)
}

export function formatPaceFromSeconds(seconds: number): string {
  const min = Math.floor(seconds / 60)
  const sec = seconds % 60
  return `${min}:${String(sec).padStart(2, '0')}`
}

export function parsePaceToSeconds(pace: string): number {
  const [min, sec] = pace.split(':').map(Number)
  return min * 60 + (sec || 0)
}
