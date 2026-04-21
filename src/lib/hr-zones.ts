export type ZoneNumber = 1 | 2 | 3 | 4 | 5

export interface ZoneBoundaries {
  z1: { min: 0; max: number }
  z2: { min: number; max: number }
  z3: { min: number; max: number }
  z4: { min: number; max: number }
  z5: { min: number; max: number }
}

export interface ZoneTime {
  seconds: number
  pct: number
}

export interface ZoneDistribution {
  z1: ZoneTime
  z2: ZoneTime
  z3: ZoneTime
  z4: ZoneTime
  z5: ZoneTime
}

/** Friel %LTHR 모델 기반 5-Zone 경계값을 계산한다. */
export function getZoneBoundaries(lthr: number): ZoneBoundaries {
  return {
    z1: { min: 0, max: Math.round(lthr * 0.82) },
    z2: { min: Math.round(lthr * 0.82), max: Math.round(lthr * 0.89) },
    z3: { min: Math.round(lthr * 0.89), max: Math.round(lthr * 0.94) },
    z4: { min: Math.round(lthr * 0.94), max: lthr },
    z5: { min: lthr, max: Infinity },
  }
}

/** 단일 HR 값의 존 번호를 반환한다. */
export function getZone(hr: number, lthr: number): ZoneNumber {
  const ratio = hr / lthr
  if (ratio < 0.82) return 1
  if (ratio < 0.89) return 2
  if (ratio < 0.94) return 3
  if (ratio < 1.0) return 4
  return 5
}

export interface HRRecord {
  /** ISO timestamp 또는 Date 객체 */
  timestamp: string | Date
  /** 심박 (bpm). null/undefined/0이면 해당 구간은 집계에서 제외 */
  heartRate?: number | null
}

/**
 * HR 레코드 배열에서 존별 시간 분포를 계산한다.
 * 연속 레코드의 timestamp 차이를 사용해 실제 경과 시간을 기준으로 집계하므로
 * Garmin smart recording 등 비균등 샘플링에서도 정확한 값을 반환한다.
 */
export function calculateZoneDistribution(records: HRRecord[], lthr: number): ZoneDistribution {
  const counts = { z1: 0, z2: 0, z3: 0, z4: 0, z5: 0 }
  let total = 0

  for (let i = 0; i < records.length - 1; i++) {
    const current = records[i]
    if (current.heartRate == null || current.heartRate <= 0) continue

    const currentTime = new Date(current.timestamp).getTime()
    const nextTime = new Date(records[i + 1].timestamp).getTime()
    const dt = (nextTime - currentTime) / 1000

    if (dt <= 0 || dt > 60) continue

    const zone = getZone(current.heartRate, lthr)
    counts[`z${zone}`] += dt
    total += dt
  }

  function toZoneTime(seconds: number): ZoneTime {
    const rounded = Math.round(seconds)
    return { seconds: rounded, pct: total > 0 ? Math.round((seconds / total) * 100) : 0 }
  }

  return {
    z1: toZoneTime(counts.z1),
    z2: toZoneTime(counts.z2),
    z3: toZoneTime(counts.z3),
    z4: toZoneTime(counts.z4),
    z5: toZoneTime(counts.z5),
  }
}

export interface BakkenZones {
  easy: ZoneTime
  threshold: ZoneTime
  supra: ZoneTime
}

/**
 * Friel 5-Zone 분포를 Bakken 3-Zone으로 매핑한다.
 * - Easy (Z1): Friel Z1+Z2 (LT1 이하, LTHR 89% 미만)
 * - Threshold (Z2): Friel Z3+Z4 (LT1~LT2, LTHR 89~100%)
 * - Supra/VO2max (Z3): Friel Z5 (LT2 초과, LTHR 100% 초과)
 */
export function toBakkenZones(dist: ZoneDistribution): BakkenZones {
  const total =
    dist.z1.seconds + dist.z2.seconds + dist.z3.seconds + dist.z4.seconds + dist.z5.seconds

  function merge(seconds: number): ZoneTime {
    return { seconds, pct: total > 0 ? Math.round((seconds / total) * 100) : 0 }
  }

  return {
    easy: merge(dist.z1.seconds + dist.z2.seconds),
    threshold: merge(dist.z3.seconds + dist.z4.seconds),
    supra: merge(dist.z5.seconds),
  }
}
