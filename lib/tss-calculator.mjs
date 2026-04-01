/**
 * Training Stress Score (TSS) Calculator
 *
 * hrTSS = duration_hours * IF^2 * 100
 * IF (Intensity Factor) = (avgHR - restHR) / (LTHR - restHR)
 */

/**
 * Calculate Intensity Factor based on heart rate
 * @param {number} avgHR - Average heart rate during session
 * @param {number} restHR - Resting heart rate
 * @param {number} lthr - Lactate threshold heart rate
 * @returns {number} Intensity Factor (0-1.5+)
 */
export function calculateIntensityFactor(avgHR, restHR, lthr) {
  if (!avgHR || !restHR || !lthr) return null
  if (lthr <= restHR) return null

  const hrReserve = lthr - restHR
  const sessionHR = avgHR - restHR

  return Math.max(0, sessionHR / hrReserve)
}

/**
 * Calculate heart rate based Training Stress Score (hrTSS)
 * @param {number} durationSeconds - Session duration in seconds
 * @param {number} intensityFactor - Intensity Factor
 * @returns {number} hrTSS value
 */
export function calculateHrTSS(durationSeconds, intensityFactor) {
  if (!durationSeconds || intensityFactor === null) return null

  const durationHours = durationSeconds / 3600
  return durationHours * Math.pow(intensityFactor, 2) * 100
}

/**
 * Calculate TSS from session data
 * @param {Object} session - Session data with avgHeartRate and durationSeconds
 * @param {Object} settings - User settings with lthr and rest_hr
 * @returns {Object} TSS calculation result
 */
export function calculateSessionTSS(session, settings) {
  const avgHR = session.avgHeartRate || session.summary?.avgHeartRate
  const durationSeconds = session.durationSeconds || session.summary?.durationSeconds

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

/**
 * Get TSS zone description
 * @param {number} tss - TSS value
 * @returns {Object} Zone info
 */
export function getTSSZone(tss) {
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
