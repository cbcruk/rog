import { readFileSync, existsSync } from 'fs'
import { basename, dirname, join } from 'path'
import type { DatabaseSync } from 'node:sqlite'
import { openDb } from 'fit-to-sqlite/src/db.ts'
import { ingest } from 'fit-to-sqlite/src/ingest.ts'
import type { FitSession, Metadata, FitRecord, FitLap } from '@/types/running'

/** FIT 원본 메시지를 적재하는 로컬 SQLite 파일 경로. */
export const FIT_DB_PATH = join(process.cwd(), 'fit.db')

const ISO_DATE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/

/** parseFitFile의 반환 타입. FIT 디코딩 결과 + .meta.json 메타데이터. */
interface FitData {
  /** FIT session 메시지 (세션당 1개) */
  session: FitSession
  /** 1km 단위 랩 메시지 배열 */
  laps: FitLap[]
  /** 1초 간격 기록 메시지 배열 */
  records: FitRecord[]
  /** HR zone별 체류 시간 (현재 미사용) */
  timeInZone: Record<string, unknown>[]
  /** 심박 변이도 데이터 (현재 미사용) */
  hrv: Record<string, unknown>[]
  /** .meta.json에서 로드된 훈련 메타데이터. 파일이 없으면 null */
  metadata: Partial<Metadata> | null
}

/**
 * FIT 파일과 같은 디렉토리에서 `.meta.json`을 찾아 훈련 메타데이터를 로드한다.
 * `{fitName}.meta.json` 또는 `{activityId}.meta.json` 순서로 탐색한다.
 */
export function loadMetadata(fitFilePath: string): Partial<Metadata> | null {
  const dir = dirname(fitFilePath)
  const fitName = basename(fitFilePath, '.fit')
  const parts = fitName.split('_')
  const activityId = parts.length >= 3 ? parts[2] : parts[0]

  const candidates = [join(dir, `${fitName}.meta.json`), join(dir, `${activityId}.meta.json`)]

  for (const metaPath of candidates) {
    if (existsSync(metaPath)) {
      try {
        const content = readFileSync(metaPath, 'utf-8')
        return JSON.parse(content)
      } catch {
        console.warn(`Failed to load metadata: ${metaPath}`)
      }
    }
  }
  return null
}

/** FIT 원본 DB를 연다. 스키마가 없으면 만든다. 기본 경로는 {@linkcode FIT_DB_PATH}. */
export function openFitDb(path: string = FIT_DB_PATH): DatabaseSync {
  return openDb(path)
}

/**
 * Garmin FIT 파일을 FIT 원본 DB에 적재하고 session, laps, records와 메타데이터를 반환한다.
 *
 * 이미 적재된 파일(같은 sha256)은 다시 디코딩하지 않고 DB에서 읽는다.
 * 무결성 검증 실패 시 에러를 던진다.
 */
export function parseFitFile(db: DatabaseSync, filePath: string): FitData {
  const result = ingest(db, readFileSync(filePath), basename(filePath))

  if (result.status === 'imported' && result.errors.length > 0) {
    console.warn('Parse warnings:', result.errors)
  }

  const file = db.prepare('SELECT integrity_ok FROM fit_file WHERE id = ?').get(result.fileId) as
    | { integrity_ok: number }
    | undefined
  if (!file?.integrity_ok) {
    throw new Error('FIT file integrity check failed')
  }

  const rows = db
    .prepare(
      `SELECT kind, data FROM message
       WHERE file_id = ? AND kind IN ('session', 'lap', 'record', 'timeInZone', 'hrv')
       ORDER BY seq`,
    )
    .all(result.fileId) as { kind: string; data: string }[]

  const byKind = (kind: string): Record<string, unknown>[] =>
    rows
      .filter((r) => r.kind === kind)
      .map((r) =>
        JSON.parse(r.data, (_, v) => (typeof v === 'string' && ISO_DATE.test(v) ? new Date(v) : v)),
      )

  return {
    session: byKind('session')[0] as unknown as FitSession,
    laps: byKind('lap') as unknown as FitLap[],
    records: byKind('record') as unknown as FitRecord[],
    timeInZone: byKind('timeInZone'),
    hrv: byKind('hrv'),
    metadata: loadMetadata(filePath),
  }
}
