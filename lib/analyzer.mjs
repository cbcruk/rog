export function formatPace(paceMinPerKm) {
  if (!paceMinPerKm || !isFinite(paceMinPerKm)) return null
  const min = Math.floor(paceMinPerKm)
  const sec = Math.round((paceMinPerKm - min) * 60)
  return `${min}:${String(sec).padStart(2, '0')}`
}

export function formatTime(seconds) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.round(seconds % 60)
  return h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    : `${m}:${String(s).padStart(2, '0')}`
}

function calcAvgPace(lapGroup) {
  const totalTime = lapGroup.reduce((sum, lap) => sum + lap.totalElapsedTime, 0)
  const totalDist = lapGroup.reduce((sum, lap) => sum + lap.totalDistance, 0)
  return totalTime / 60 / (totalDist / 1000)
}

function analyzeIntervals(records, metadata) {
  if (!metadata?.intervals || !records?.length) return null

  const { workDuration, restDuration, sets } = metadata.intervals
  const targetHR = metadata.targetHR
  const cycleDuration = workDuration + restDuration

  const startTime = new Date(records[0].timestamp)
  const intervals = []

  for (let i = 0; i < sets; i++) {
    const cycleStart = i * cycleDuration
    const workEnd = cycleStart + workDuration

    const workRecords = records.filter((r) => {
      const elapsed = (new Date(r.timestamp) - startTime) / 1000
      return elapsed >= cycleStart && elapsed < workEnd
    })

    const restRecords = records.filter((r) => {
      const elapsed = (new Date(r.timestamp) - startTime) / 1000
      return elapsed >= workEnd && elapsed < cycleStart + cycleDuration
    })

    if (workRecords.length === 0) continue

    const workHRs = workRecords.map((r) => r.heartRate).filter(Boolean)
    const workSpeeds = workRecords.map((r) => r.speed).filter(Boolean)
    const restHRs = restRecords.map((r) => r.heartRate).filter(Boolean)

    const avgWorkHR = workHRs.length ? Math.round(workHRs.reduce((a, b) => a + b, 0) / workHRs.length) : null
    const maxWorkHR = workHRs.length ? Math.max(...workHRs) : null
    const avgWorkSpeed = workSpeeds.length ? workSpeeds.reduce((a, b) => a + b, 0) / workSpeeds.length : null
    const avgRestHR = restHRs.length ? Math.round(restHRs.reduce((a, b) => a + b, 0) / restHRs.length) : null
    const minRestHR = restHRs.length ? Math.min(...restHRs) : null

    const workDistance = workRecords.length > 1
      ? (workRecords[workRecords.length - 1].distance - workRecords[0].distance) / 1000
      : 0

    let hrInZone = null
    if (targetHR?.work && workHRs.length) {
      const inZone = workHRs.filter((hr) => hr >= targetHR.work[0] && hr <= targetHR.work[1]).length
      hrInZone = Math.round((inZone / workHRs.length) * 100)
    }

    intervals.push({
      set: i + 1,
      work: {
        duration: workDuration,
        durationFormatted: formatTime(workDuration),
        distance: Number(workDistance.toFixed(2)),
        avgHR: avgWorkHR,
        maxHR: maxWorkHR,
        avgPace: avgWorkSpeed ? formatPace(1000 / avgWorkSpeed / 60) : null,
        hrInZone,
      },
      rest: {
        duration: restDuration,
        durationFormatted: formatTime(restDuration),
        avgHR: avgRestHR,
        minHR: minRestHR,
      },
    })
  }

  if (intervals.length === 0) return null

  const workHRs = intervals.map((i) => i.work.avgHR).filter(Boolean)
  const restHRs = intervals.map((i) => i.rest.minHR).filter(Boolean)

  return {
    structure: metadata.intervals.structure,
    totalSets: intervals.length,
    targetSets: sets,
    completed: intervals.length >= sets,
    summary: {
      avgWorkHR: workHRs.length ? Math.round(workHRs.reduce((a, b) => a + b, 0) / workHRs.length) : null,
      avgRestHR: restHRs.length ? Math.round(restHRs.reduce((a, b) => a + b, 0) / restHRs.length) : null,
      hrRecovery: workHRs.length && restHRs.length
        ? Math.round(workHRs.reduce((a, b) => a + b, 0) / workHRs.length - restHRs.reduce((a, b) => a + b, 0) / restHRs.length)
        : null,
    },
    sets: intervals,
  }
}

export function analyzeRun({ session, laps, records, metadata }) {
  if (!session || !laps.length) {
    throw new Error('Invalid data: session or laps missing')
  }

  const distanceKm = session.totalDistance / 1000
  const avgPaceValue = session.totalElapsedTime / 60 / distanceKm

  const lapPaces = laps.slice(0, -1).map((lap, i) => ({
    km: i + 1,
    pace: lap.totalElapsedTime / 60 / (lap.totalDistance / 1000),
    paceFormatted: formatPace(lap.totalElapsedTime / 60 / (lap.totalDistance / 1000)),
    heartRate: lap.avgHeartRate,
    cadence: lap.avgRunningCadence ? lap.avgRunningCadence * 2 : null,
    ascent: lap.totalAscent || 0,
    descent: lap.totalDescent || 0,
  }))

  const halfPoint = Math.floor(laps.length / 2)
  const firstHalfLaps = laps.slice(0, halfPoint)
  const secondHalfLaps = laps.slice(halfPoint, -1)
  const firstHalfPace = calcAvgPace(firstHalfLaps)
  const secondHalfPace = calcAvgPace(secondHalfLaps)
  const paceDiff = secondHalfPace - firstHalfPace

  const avgPaceNum = lapPaces.reduce((sum, l) => sum + l.pace, 0) / lapPaces.length
  const variance =
    lapPaces.reduce((sum, l) => sum + Math.pow(l.pace - avgPaceNum, 2), 0) / lapPaces.length
  const stdDev = Math.sqrt(variance)
  const cv = (stdDev / avgPaceNum) * 100

  const fastest = lapPaces.reduce((min, lap) => (lap.pace < min.pace ? lap : min))
  const slowest = lapPaces.reduce((max, lap) => (lap.pace > max.pace ? lap : max))

  const segments = []
  const segmentSize = 5
  for (let i = 0; i < Math.ceil(distanceKm / segmentSize); i++) {
    const start = i * segmentSize
    const end = Math.min((i + 1) * segmentSize, Math.floor(distanceKm))
    const segmentLaps = laps.slice(start, end)
    if (segmentLaps.length === 0) break

    const validHRLaps = segmentLaps.filter((l) => l.avgHeartRate)
    segments.push({
      range: `${start + 1}-${end}km`,
      pace: formatPace(calcAvgPace(segmentLaps)),
      avgHeartRate: validHRLaps.length
        ? Math.round(validHRLaps.reduce((sum, l) => sum + l.avgHeartRate, 0) / validHRLaps.length)
        : null,
    })
  }

  const validHRLaps = lapPaces.filter((l) => l.heartRate)
  let heartRateAnalysis = null
  if (validHRLaps.length > 0) {
    const early = validHRLaps.slice(0, 5)
    const late = validHRLaps.slice(-5)
    const earlyAvgHR = early.reduce((sum, l) => sum + l.heartRate, 0) / early.length
    const lateAvgHR = late.reduce((sum, l) => sum + l.heartRate, 0) / late.length
    const hrDrift = ((lateAvgHR - earlyAvgHR) / earlyAvgHR) * 100

    heartRateAnalysis = {
      avgHeartRate: Math.round(validHRLaps.reduce((sum, l) => sum + l.heartRate, 0) / validHRLaps.length),
      minHeartRate: Math.min(...validHRLaps.map((l) => l.heartRate)),
      maxHeartRate: Math.max(...validHRLaps.map((l) => l.heartRate)),
      drift: Number(hrDrift.toFixed(1)),
    }
  }

  let fatigueAnalysis = null
  if (distanceKm >= 10) {
    const first5km = laps.slice(0, 5)
    const last5km = laps.slice(-6, -1)
    if (first5km.length && last5km.length) {
      const dropSeconds = (calcAvgPace(last5km) - calcAvgPace(first5km)) * 60
      fatigueAnalysis = {
        first5kmPace: formatPace(calcAvgPace(first5km)),
        last5kmPace: formatPace(calcAvgPace(last5km)),
        dropSeconds: Math.round(dropSeconds),
      }
    }
  }

  const elevationAnalysis = {
    totalAscent: session.totalAscent || 0,
    totalDescent: session.totalDescent || 0,
  }

  const intervalAnalysis = analyzeIntervals(records, metadata)

  return {
    date: session.startTime.toISOString().split('T')[0],
    startTime: session.startTime.toISOString(),
    sport: session.sport,
    metadata: metadata || null,
    summary: {
      distance: Number(distanceKm.toFixed(2)),
      duration: formatTime(session.totalElapsedTime),
      durationSeconds: Math.round(session.totalElapsedTime),
      avgPace: formatPace(avgPaceValue),
      avgHeartRate: session.avgHeartRate,
      maxHeartRate: session.maxHeartRate,
      calories: session.totalCalories,
      avgCadence: session.avgRunningCadence ? session.avgRunningCadence * 2 : null,
    },
    splits: {
      firstHalfPace: formatPace(firstHalfPace),
      secondHalfPace: formatPace(secondHalfPace),
      diffSeconds: Math.round(paceDiff * 60),
      type: paceDiff > 0 ? 'positive' : 'negative',
    },
    segments,
    laps: lapPaces,
    consistency: {
      stdDevSeconds: Number((stdDev * 60).toFixed(1)),
      cv: Number(cv.toFixed(1)),
      rating: cv < 3 ? 'excellent' : cv < 5 ? 'good' : 'needs_improvement',
    },
    highlights: {
      fastestLap: { km: fastest.km, pace: formatPace(fastest.pace) },
      slowestLap: { km: slowest.km, pace: formatPace(slowest.pace) },
    },
    heartRate: heartRateAnalysis,
    fatigue: fatigueAnalysis,
    elevation: elevationAnalysis,
    intervals: intervalAnalysis,
  }
}
