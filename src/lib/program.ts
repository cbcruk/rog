import { createClient } from '@libsql/client'
import type { PlannedSession, WeeklyProgram, WeeklyProgramInput } from '@/types/program'

function createDbClient(): ReturnType<typeof createClient> {
  const dbUrl = process.env.TURSO_DATABASE_URL
  const authToken = process.env.TURSO_AUTH_TOKEN

  if (dbUrl && authToken) {
    return createClient({ url: dbUrl, authToken })
  }

  return createClient({ url: 'file:sessions.db' })
}

/**
 * weekly_programs 테이블을 보장한다.
 * 웹 앱은 `pnpm sync:db` 없이도 동작해야 하므로 조회/저장 전에 매번 호출한다.
 * 계획 세션은 주 단위로 통째로 편집되므로 JSON 컬럼 하나로 저장한다.
 */
async function ensureTable(db: ReturnType<typeof createClient>): Promise<void> {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS weekly_programs (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      sessions TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `)
}

function parseSessions(value: unknown): PlannedSession[] {
  try {
    const parsed = JSON.parse(String(value))
    return Array.isArray(parsed) ? (parsed as PlannedSession[]) : []
  } catch {
    return []
  }
}

function toProgram(row: Record<string, unknown>): WeeklyProgram {
  return {
    id: row.id as string,
    name: row.name as string,
    description: (row.description as string) || undefined,
    sessions: parseSessions(row.sessions),
    isActive: Number(row.is_active) === 1,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

/** 저장된 모든 주간 프로그램을 활성 프로그램 우선, 최근 수정순으로 반환한다. */
export async function getPrograms(): Promise<WeeklyProgram[]> {
  const db = createDbClient()
  await ensureTable(db)

  const result = await db.execute(
    `SELECT * FROM weekly_programs ORDER BY is_active DESC, updated_at DESC`,
  )

  return result.rows.map((row) => toProgram(row as unknown as Record<string, unknown>))
}

/** ID로 단일 프로그램을 조회한다. 없으면 null을 반환한다. */
export async function getProgram(id: string): Promise<WeeklyProgram | null> {
  const db = createDbClient()
  await ensureTable(db)

  const result = await db.execute({
    sql: `SELECT * FROM weekly_programs WHERE id = ?`,
    args: [id],
  })

  if (result.rows.length === 0) return null

  return toProgram(result.rows[0] as unknown as Record<string, unknown>)
}

/** 현재 활성 상태인 프로그램을 반환한다. 없으면 null을 반환한다. */
export async function getActiveProgram(): Promise<WeeklyProgram | null> {
  const db = createDbClient()
  await ensureTable(db)

  const result = await db.execute(
    `SELECT * FROM weekly_programs WHERE is_active = 1 ORDER BY updated_at DESC LIMIT 1`,
  )

  if (result.rows.length === 0) return null

  return toProgram(result.rows[0] as unknown as Record<string, unknown>)
}

/**
 * 프로그램을 저장한다. input.id가 있으면 갱신하고 없으면 새로 만든다.
 * isActive가 true면 다른 프로그램의 활성 상태를 모두 해제한다.
 * @param input - 저장할 프로그램 데이터
 */
export async function saveProgram(input: WeeklyProgramInput): Promise<WeeklyProgram> {
  const db = createDbClient()
  await ensureTable(db)

  const now = new Date().toISOString()
  const id = input.id ?? crypto.randomUUID()
  const isActive = input.isActive ?? false

  const existing = input.id
    ? await db.execute({ sql: `SELECT created_at FROM weekly_programs WHERE id = ?`, args: [id] })
    : null

  const createdAt = (existing?.rows[0]?.created_at as string) ?? now

  if (isActive) {
    await db.execute({
      sql: `UPDATE weekly_programs SET is_active = 0 WHERE id != ?`,
      args: [id],
    })
  }

  await db.execute({
    sql: `
      INSERT OR REPLACE INTO weekly_programs
        (id, name, description, sessions, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    args: [
      id,
      input.name,
      input.description ?? null,
      JSON.stringify(input.sessions),
      isActive ? 1 : 0,
      createdAt,
      now,
    ],
  })

  return {
    id,
    name: input.name,
    description: input.description,
    sessions: input.sessions,
    isActive,
    createdAt,
    updatedAt: now,
  }
}

/** 프로그램을 삭제한다. */
export async function deleteProgram(id: string): Promise<void> {
  const db = createDbClient()
  await ensureTable(db)

  await db.execute({ sql: `DELETE FROM weekly_programs WHERE id = ?`, args: [id] })
}

/** 지정한 프로그램만 활성 상태로 만든다. */
export async function setActiveProgram(id: string): Promise<void> {
  const db = createDbClient()
  await ensureTable(db)

  await db.execute({ sql: `UPDATE weekly_programs SET is_active = 0 WHERE id != ?`, args: [id] })
  await db.execute({ sql: `UPDATE weekly_programs SET is_active = 1 WHERE id = ?`, args: [id] })
}
