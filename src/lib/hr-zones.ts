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

/** HR 레코드 배열에서 존별 시간 분포를 계산한다. */
export function calculateZoneDistribution(heartRates: number[], lthr: number): ZoneDistribution {
  const counts = { z1: 0, z2: 0, z3: 0, z4: 0, z5: 0 }
  const total = heartRates.length

  for (const hr of heartRates) {
    const zone = getZone(hr, lthr)
    counts[`z${zone}`] += 1
  }

  function toZoneTime(seconds: number): ZoneTime {
    return { seconds, pct: total > 0 ? Math.round((seconds / total) * 100) : 0 }
  }

  return {
    z1: toZoneTime(counts.z1),
    z2: toZoneTime(counts.z2),
    z3: toZoneTime(counts.z3),
    z4: toZoneTime(counts.z4),
    z5: toZoneTime(counts.z5),
  }
}
