import { Decoder, Stream } from '@garmin/fitsdk'
import { readFileSync, existsSync } from 'fs'
import { basename, dirname, join } from 'path'
import type { FitSession, Metadata, FitRecord, FitLap } from '@/types/running'

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

  const candidates = [
    join(dir, `${fitName}.meta.json`),
    join(dir, `${activityId}.meta.json`),
  ]

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

/**
 * Garmin FIT 바이너리 파일을 디코딩하여 session, laps, records와 메타데이터를 반환한다.
 * 무결성 검증 실패 시 에러를 던진다.
 */
export function parseFitFile(filePath: string): FitData {
  const buffer = readFileSync(filePath)
  const stream = Stream.fromBuffer(buffer)
  const decoder = new Decoder(stream)

  if (!decoder.isFIT()) {
    throw new Error('Not a valid FIT file')
  }

  if (!decoder.checkIntegrity()) {
    throw new Error('FIT file integrity check failed')
  }

  const { messages, errors } = decoder.read()

  if (errors.length > 0) {
    console.warn('Parse warnings:', errors)
  }

  const metadata = loadMetadata(filePath)

  return {
    session: messages.sessionMesgs?.[0] as FitSession,
    laps: (messages.lapMesgs || []) as FitLap[],
    records: (messages.recordMesgs || []) as FitRecord[],
    timeInZone: messages.timeInZoneMesgs || [],
    hrv: messages.hrvMesgs || [],
    metadata,
  }
}
