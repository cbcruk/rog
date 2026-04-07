import type { TSSResult, TSSZone } from '@/types/pmc'

/** TSS 계산에 필요한 세션 데이터. 직접 필드 또는 summary 하위 객체에서 읽는다. */
interface SessionInput {
  avgHeartRate?: number
  durationSeconds?: number
  /** analyzeRun 반환값의 summary에서 가져올 때 사용 */
  summary?: {
    avgHeartRate: number
    durationSeconds: number
  }
}

/** TSS 계산에 필요한 사용자 설정. DB에서 문자열로 올 수 있어 string | number를 허용한다. */
interface SettingsInput {
  /** Lactate Threshold Heart Rate (bpm) */
  lthr?: string | number
  /** 안정시 심박 (bpm) */
  rest_hr?: string | number
}

/** HR Reserve 기반 Intensity Factor를 계산한다. 0~1.5+ 범위. */
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

/** IF와 운동 시간으로 hrTSS를 계산한다. */
export function calculateHrTSS(
  durationSeconds: number,
  intensityFactor: number,
): number | null {
  if (!durationSeconds || intensityFactor === null) return null

  const durationHours = durationSeconds / 3600
  return durationHours * Math.pow(intensityFactor, 2) * 100
}

/** 세션 데이터와 사용자 설정으로 TSS를 계산한다. avgHR과 durationSeconds가 필수. */
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

/** TSS 값을 low/medium/high/very_high 존으로 분류하고 예상 회복 시간을 반환한다. */
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
