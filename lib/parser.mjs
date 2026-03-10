import { Decoder, Stream } from '@garmin/fitsdk'
import { readFileSync, existsSync } from 'fs'
import { basename, dirname, join } from 'path'

export function loadMetadata(fitFilePath) {
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
      } catch (e) {
        console.warn(`Failed to load metadata: ${metaPath}`)
      }
    }
  }
  return null
}

export function parseFitFile(filePath) {
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
    session: messages.sessionMesgs?.[0],
    laps: messages.lapMesgs || [],
    records: messages.recordMesgs || [],
    timeInZone: messages.timeInZoneMesgs || [],
    hrv: messages.hrvMesgs || [],
    metadata,
  }
}
