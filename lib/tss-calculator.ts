import type { TSSResult, TSSZone } from '@/types/pmc'

interface SessionInput {
  avgHeartRate?: number
  durationSeconds?: number
  summary?: {
    avgHeartRate: number
    durationSeconds: number
  }
}

interface SettingsInput {
  lthr?: string | number
  rest_hr?: string | number
}

export function calculateIntensityFactor(
  avgHR: number,
  restHR: number,
  lthr: number,
): number | null {
  if (!avgHR || !restHR || !lthr) return null
  if (lthr <= restHR) return null

  const hrReserve = lthr - restHR
  const sessionHR = avgHR - restHR

  return Math.max(0, sessionHR / hrReserve)
}

export function calculateHrTSS(
  durationSeconds: number,
  intensityFactor: number,
): number | null {
  if (!durationSeconds || intensityFactor === null) return null

  const durationHours = durationSeconds / 3600
  return durationHours * Math.pow(intensityFactor, 2) * 100
}

export function calculateSessionTSS(
  session: SessionInput,
  settings: SettingsInput,
): TSSResult {
  const avgHR = session.avgHeartRate || session.summary?.avgHeartRate
  const durationSeconds =
    session.durationSeconds || session.summary?.durationSeconds

  if (!avgHR || !durationSeconds) {
    return { rtss: null, intensityFactor: null }
  }

  const lthr = Number(settings.lthr) || 165
  const restHR = Number(settings.rest_hr) || 50

  const intensityFactor = calculateIntensityFactor(avgHR, restHR, lthr)
  if (intensityFactor === null) {
    return { rtss: null, intensityFactor: null }
  }

  const rtss = calculateHrTSS(durationSeconds, intensityFactor)

  return {
    rtss: rtss !== null ? Number(rtss.toFixed(1)) : null,
    intensityFactor: Number(intensityFactor.toFixed(3)),
  }
}

export function getTSSZone(tss: number | null): TSSZone {
  if (tss === null) return { zone: 'unknown', label: 'N/A', recovery: null }

  if (tss < 100) {
    return { zone: 'low', label: 'Low', recovery: '< 24h' }
  } else if (tss < 150) {
    return { zone: 'medium', label: 'Medium', recovery: '24-48h' }
  } else if (tss < 250) {
    return { zone: 'high', label: 'High', recovery: '48-72h' }
  } else {
    return { zone: 'very_high', label: 'Very High', recovery: '72h+' }
  }
}
