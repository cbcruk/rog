import { calculateSessionTSS, getTSSZone } from './tss-calculator.ts'
import { calculateZoneDistribution } from '@/lib/hr-zones'
import { scoreSession } from '@/lib/quality-scorer'
import type {
  FitSession,
  FitRecord,
  FitLap,
  Metadata,
  Splits,
  Segment,
  Lap,
  Consistency,
  Highlights,
  HeartRateAnalysis,
  FatigueAnalysis,
  ElevationAnalysis,
  IntervalAnalysis,
  IntervalSet,
} from '@/types/running'

/** 분/km 숫자를 "M:SS" 문자열로 변환한다. */
export function formatPace(paceMinPerKm: number): string | null {
  if (!paceMinPerKm || !isFinite(paceMinPerKm)) return null
  const min = Math.floor(paceMinPerKm)
  const sec = Math.round((paceMinPerKm - min) * 60)
  return `${min}:${String(sec).padStart(2, '0')}`
}

/** 초를 "H:MM:SS" 또는 "M:SS" 문자열로 변환한다. */
export function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.round(seconds % 60)
  return h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    : `${m}:${String(s).padStart(2, '0')}`
}

interface AnalyzeRunInput {
  session: FitSession
  laps: FitLap[]
  records: FitRecord[]
  metadata?: Partial<Metadata> | null
  settings?: Record<string, string | number>
}

function calcAvgPace(lapGroup: FitLap[]): number {
  const totalTime = lapGroup.reduce((sum, lap) => sum + lap.totalElapsedTime, 0)
  const totalDist = lapGroup.reduce((sum, lap) => sum + lap.totalDistance, 0)
  return totalTime / 60 / (totalDist / 1000)
}

function analyzeIntervals(
  records: FitRecord[],
  metadata: Partial<Metadata> | null | undefined,
): IntervalAnalysis | null {
  if (!metadata?.intervals || !records?.length) return null

  const { workDuration, restDuration, sets } = metadata.intervals
  const targetHR = metadata.targetHR
  const cycleDuration = workDuration + restDuration

  const startTime = new Date(records[0].timestamp)
  const intervals: IntervalSet[] = []

  for (let i = 0; i < sets; i++) {
    const cycleStart = i * cycleDuration
    const workEnd = cycleStart + workDuration

    const workRecords = records.filter((r) => {
      const elapsed = (new Date(r.timestamp).getTime() - startTime.getTime()) / 1000
      return elapsed >= cycleStart && elapsed < workEnd
    })

    const restRecords = records.filter((r) => {
      const elapsed = (new Date(r.timestamp).getTime() - startTime.getTime()) / 1000
      return elapsed >= workEnd && elapsed < cycleStart + cycleDuration
    })

    if (workRecords.length === 0) continue

    const workHRs = workRecords.map((r) => r.heartRate).filter(Boolean) as number[]
    const workSpeeds = workRecords.map((r) => r.speed).filter(Boolean) as number[]
    const restHRs = restRecords.map((r) => r.heartRate).filter(Boolean) as number[]

    const avgWorkHR = workHRs.length
      ? Math.round(workHRs.reduce((a, b) => a + b, 0) / workHRs.length)
      : null
    const maxWorkHR = workHRs.length ? Math.max(...workHRs) : null
    const avgWorkSpeed = workSpeeds.length
      ? workSpeeds.reduce((a, b) => a + b, 0) / workSpeeds.length
      : null
    const avgRestHR = restHRs.length
      ? Math.round(restHRs.reduce((a, b) => a + b, 0) / restHRs.length)
      : null
    const minRestHR = restHRs.length ? Math.min(...restHRs) : null

    const workDistance =
      workRecords.length > 1
        ? ((workRecords[workRecords.length - 1].distance ?? 0) - (workRecords[0].distance ?? 0)) /
          1000
        : 0

    let hrInZone: number | null = null
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

  const workHRs = intervals.map((i) => i.work.avgHR).filter(Boolean) as number[]
  const restHRs = intervals.map((i) => i.rest.minHR).filter(Boolean) as number[]

  return {
    structure: metadata.intervals.structure,
    totalSets: intervals.length,
    targetSets: sets,
    completed: intervals.length >= sets,
    summary: {
      avgWorkHR: workHRs.length
        ? Math.round(workHRs.reduce((a, b) => a + b, 0) / workHRs.length)
        : null,
      avgRestHR: restHRs.length
        ? Math.round(restHRs.reduce((a, b) => a + b, 0) / restHRs.length)
        : null,
      hrRecovery:
        workHRs.length && restHRs.length
          ? Math.round(
              workHRs.reduce((a, b) => a + b, 0) / workHRs.length -
                restHRs.reduce((a, b) => a + b, 0) / restHRs.length,
            )
          : null,
    },
    sets: intervals,
  }
}

function detectLocation(session: FitSession): string {
  const subSport = session.subSport ?? session.sub_sport
  if (subSport === 'treadmill' || subSport === 1) return 'treadmill'
  if (subSport === 'trail' || subSport === 8) return 'trail'
  return 'road'
}

/**
 * FIT 파싱 결과를 종합 분석하여 RunSession 형태의 분석 결과를 반환한다.
 * 마지막 랩(잔여 거리)은 분석에서 제외된다.
 */
export function analyzeRun({ session, laps, records, metadata, settings = {} }: AnalyzeRunInput) {
  if (!session || !laps.length) {
    throw new Error('Invalid data: session or laps missing')
  }

  const distanceKm = session.totalDistance / 1000
  const avgPaceValue = session.totalElapsedTime / 60 / distanceKm

  const lapPaces: Lap[] = laps.slice(0, -1).map((lap, i) => ({
    km: i + 1,
    pace: lap.totalElapsedTime / 60 / (lap.totalDistance / 1000),
    paceFormatted: formatPace(lap.totalElapsedTime / 60 / (lap.totalDistance / 1000))!,
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

  const segments: Segment[] = []
  const segmentSize = 5
  for (let i = 0; i < Math.ceil(distanceKm / segmentSize); i++) {
    const start = i * segmentSize
    const end = Math.min((i + 1) * segmentSize, Math.floor(distanceKm))
    const segmentLaps = laps.slice(start, end)
    if (segmentLaps.length === 0) break

    const validHRLaps = segmentLaps.filter((l) => l.avgHeartRate)
    segments.push({
      range: `${start + 1}-${end}km`,
      pace: formatPace(calcAvgPace(segmentLaps))!,
      avgHeartRate: validHRLaps.length
        ? Math.round(validHRLaps.reduce((sum, l) => sum + l.avgHeartRate, 0) / validHRLaps.length)
        : null,
    })
  }

  const validHRLaps = lapPaces.filter((l) => l.heartRate)
  let heartRateAnalysis: HeartRateAnalysis | null = null
  if (validHRLaps.length > 0) {
    const early = validHRLaps.slice(0, 5)
    const late = validHRLaps.slice(-5)
    const earlyAvgHR = early.reduce((sum, l) => sum + l.heartRate, 0) / early.length
    const lateAvgHR = late.reduce((sum, l) => sum + l.heartRate, 0) / late.length
    const hrDrift = ((lateAvgHR - earlyAvgHR) / earlyAvgHR) * 100

    heartRateAnalysis = {
      avgHeartRate: Math.round(
        validHRLaps.reduce((sum, l) => sum + l.heartRate, 0) / validHRLaps.length,
      ),
      minHeartRate: Math.min(...validHRLaps.map((l) => l.heartRate)),
      maxHeartRate: Math.max(...validHRLaps.map((l) => l.heartRate)),
      drift: Number(hrDrift.toFixed(1)),
    }
  }

  let fatigueAnalysis: FatigueAnalysis | null = null
  if (distanceKm >= 10) {
    const first5km = laps.slice(0, 5)
    const last5km = laps.slice(-6, -1)
    if (first5km.length && last5km.length) {
      const dropSeconds = (calcAvgPace(last5km) - calcAvgPace(first5km)) * 60
      fatigueAnalysis = {
        first5kmPace: formatPace(calcAvgPace(first5km))!,
        last5kmPace: formatPace(calcAvgPace(last5km))!,
        dropSeconds: Math.round(dropSeconds),
      }
    }
  }

  const intervalAnalysis = analyzeIntervals(records, metadata)
  const detectedLocation = detectLocation(session)

  const localDate = `${session.startTime.getFullYear()}-${String(session.startTime.getMonth() + 1).padStart(2, '0')}-${String(session.startTime.getDate()).padStart(2, '0')}`

  const sessionData = {
    avgHeartRate: session.avgHeartRate,
    durationSeconds: Math.round(session.totalElapsedTime),
  }
  const tssResult = calculateSessionTSS(sessionData, settings)
  const tssZone = getTSSZone(tssResult.rtss)

  const splits: Splits = {
    firstHalfPace: formatPace(firstHalfPace)!,
    secondHalfPace: formatPace(secondHalfPace)!,
    diffSeconds: Math.round(paceDiff * 60),
    type: paceDiff > 0 ? 'positive' : 'negative',
  }

  const consistency: Consistency = {
    stdDevSeconds: Number((stdDev * 60).toFixed(1)),
    cv: Number(cv.toFixed(1)),
    rating: cv < 3 ? 'excellent' : cv < 5 ? 'good' : 'needs_improvement',
  }

  const highlights: Highlights = {
    fastestLap: { km: fastest.km, pace: formatPace(fastest.pace)! },
    slowestLap: { km: slowest.km, pace: formatPace(slowest.pace)! },
  }

  const elevation: ElevationAnalysis = {
    totalAscent: session.totalAscent || 0,
    totalDescent: session.totalDescent || 0,
  }

  const zoneDist =
    settings.lthr && records.length > 0
      ? calculateZoneDistribution(
          records.map((r) => r.heartRate).filter((hr): hr is number => hr != null && hr > 0),
          Number(settings.lthr),
        )
      : null

  return {
    date: localDate,
    startTime: session.startTime.toISOString(),
    sport: session.sport,
    metadata: metadata
      ? { ...metadata, location: metadata.location || detectedLocation }
      : { location: detectedLocation },
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
    splits,
    segments,
    laps: lapPaces,
    consistency,
    highlights,
    heartRate: heartRateAnalysis,
    fatigue: fatigueAnalysis,
    elevation,
    intervals: intervalAnalysis,
    zoneDistribution: zoneDist,
    quality:
      metadata?.type && zoneDist
        ? scoreSession(metadata.type, zoneDist, Math.round(session.totalElapsedTime))
        : null,
    tss: {
      rtss: tssResult.rtss,
      intensityFactor: tssResult.intensityFactor,
      zone: tssZone.zone,
      zoneLabel: tssZone.label,
      recovery: tssZone.recovery,
    },
  }
}
