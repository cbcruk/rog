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

/** user_settings 테이블에서 전체 설정을 조회하고, 없는 키는 기본값으로 채운다. */
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

/** 전달된 설정값들을 user_settings 테이블에 저장하거나 업데이트한다. */
export async function updateSettings(settings: Partial<UserSettings>): Promise<void> {
  const db = createDbClient()

  for (const [key, value] of Object.entries(settings)) {
    await db.execute({
      sql: `INSERT OR REPLACE INTO user_settings (key, value) VALUES (?, ?)`,
      args: [key, String(value)],
    })
  }
}

/** 단일 설정값을 조회한다. 값이 없으면 DEFAULT_SETTINGS에서 기본값을 반환한다. */
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

/** 초 단위 페이스를 "M:SS" 문자열로 변환한다. (예: 270 → "4:30") */
export function formatPaceFromSeconds(seconds: number): string {
  const min = Math.floor(seconds / 60)
  const sec = seconds % 60
  return `${min}:${String(sec).padStart(2, '0')}`
}

/** "M:SS" 문자열을 초 단위 숫자로 변환한다. (예: "4:30" → 270) */
export function parsePaceToSeconds(pace: string): number {
  const [min, sec] = pace.split(':').map(Number)
  return min * 60 + (sec || 0)
}
