import { parseFitFile } from './parser.ts'
import { formatPace, formatTime } from './analyzer.ts'
import type { FitRecord, IntervalResult } from '@/types/running'

interface SmoothedRecord extends FitRecord {
  smoothedHR: number
  smoothedSpeed: number
  smoothedPace: number | null
}

interface DetectOptions {
  hrWorkThreshold?: number
  hrRestThreshold?: number
  minIntervalDuration?: number
  minRestDuration?: number
}

interface WorkoutStructure {
  sessionType: string
  hrStats: {
    mean: number
    std: number
    cv: number
    min: number
    max: number
  }
  paceStats: {
    mean: string | null
    std: number
    cv: number
  }
}

function speedToPace(speedMs: number): number | null {
  if (!speedMs || speedMs <= 0) return null
  return 1000 / speedMs / 60
}

/** 심박·속도 데이터에 롤링 윈도우 평균을 적용하여 노이즈를 제거한다. */
export function smoothData(
  records: FitRecord[],
  windowSize: number = 10,
): SmoothedRecord[] {
  return records.map((r, i) => {
    const start = Math.max(0, i - windowSize)
    const end = Math.min(records.length, i + windowSize + 1)
    const window = records.slice(start, end)

    const avgHR =
      window.reduce((sum, w) => sum + (w.heartRate || 0), 0) / window.length
    const avgSpeed =
      window.reduce((sum, w) => sum + (w.speed || 0), 0) / window.length

    return {
      ...r,
      smoothedHR: Math.round(avgHR),
      smoothedSpeed: avgSpeed,
      smoothedPace: speedToPace(avgSpeed),
    }
  })
}

/**
 * 심박 임계값 기반으로 운동/회복 인터벌을 자동 감지한다.
 * 기본값: 운동 시작 150bpm, 회복 전환 140bpm, 최소 운동 60초, 최소 회복 30초.
 */
export function detectIntervals(
  records: FitRecord[],
  options: DetectOptions = {},
): IntervalResult[] {
  const {
    hrWorkThreshold = 150,
    hrRestThreshold = 140,
    minIntervalDuration = 60,
    minRestDuration = 30,
  } = options

  const smoothed = smoothData(records)
  interface RawInterval {
    type: 'work' | 'rest'
    startTime: string
    startDistance: number | undefined
    startIndex: number
    endTime?: string
    endDistance?: number
    endIndex?: number
    hrSamples: number[]
    paceSamples: number[]
  }

  const intervals: RawInterval[] = []
  let currentInterval: RawInterval | null = null
  let state: 'unknown' | 'work' | 'rest' = 'unknown'

  for (let i = 0; i < smoothed.length; i++) {
    const r = smoothed[i]
    const hr = r.smoothedHR

    if (state === 'unknown' || state === 'rest') {
      if (hr >= hrWorkThreshold) {
        if (currentInterval && state === 'rest') {
          currentInterval.endTime = r.timestamp
          currentInterval.endDistance = r.distance
          intervals.push(currentInterval)
        }
        currentInterval = {
          type: 'work',
          startTime: r.timestamp,
          startDistance: r.distance,
          startIndex: i,
          hrSamples: [] as number[],
          paceSamples: [] as number[],
        }
        state = 'work'
      }
    }

    if (state === 'work' && currentInterval) {
      currentInterval.hrSamples.push(hr)
      if (r.smoothedPace) currentInterval.paceSamples.push(r.smoothedPace)

      if (hr < hrRestThreshold) {
        currentInterval.endTime = r.timestamp
        currentInterval.endDistance = r.distance
        currentInterval.endIndex = i
        intervals.push(currentInterval)

        currentInterval = {
          type: 'rest',
          startTime: r.timestamp,
          startDistance: r.distance,
          startIndex: i,
          hrSamples: [],
          paceSamples: [],
        }
        state = 'rest'
      }
    }

    if (state === 'rest' && currentInterval) {
      currentInterval.hrSamples.push(hr)
      if (r.smoothedPace) currentInterval.paceSamples.push(r.smoothedPace)
    }
  }

  if (currentInterval) {
    const last = smoothed[smoothed.length - 1]
    currentInterval.endTime = last.timestamp
    currentInterval.endDistance = last.distance
    currentInterval.endIndex = smoothed.length - 1
    intervals.push(currentInterval)
  }

  return intervals
    .map((interval) => {
      const duration =
        (new Date(interval.endTime!).getTime() -
          new Date(interval.startTime).getTime()) /
        1000
      const distance =
        ((interval.endDistance ?? 0) - (interval.startDistance ?? 0)) / 1000

      return {
        type: interval.type,
        duration: Math.round(duration),
        durationFormatted: formatTime(duration),
        distance: Number(distance.toFixed(2)),
        avgHR: interval.hrSamples.length
          ? Math.round(
              interval.hrSamples.reduce((a: number, b: number) => a + b, 0) /
                interval.hrSamples.length,
            )
          : null,
        maxHR: interval.hrSamples.length
          ? Math.max(...interval.hrSamples)
          : null,
        minHR: interval.hrSamples.length
          ? Math.min(...interval.hrSamples)
          : null,
        avgPace: interval.paceSamples.length
          ? formatPace(
              interval.paceSamples.reduce((a: number, b: number) => a + b, 0) /
                interval.paceSamples.length,
            )
          : null,
      } as IntervalResult
    })
    .filter((i) => {
      if (i.type === 'work') return i.duration >= minIntervalDuration
      return i.duration >= minRestDuration
    })
}

/** 심박·페이스의 변동계수(CV)로 세션을 steady/variable/interval로 분류한다. */
export function analyzeWorkoutStructure(
  records: FitRecord[],
): WorkoutStructure {
  const smoothed = smoothData(records)

  const hrValues = smoothed.map((r) => r.smoothedHR).filter(Boolean)
  const paceValues = smoothed
    .map((r) => r.smoothedPace)
    .filter(Boolean) as number[]

  const hrMean = hrValues.reduce((a, b) => a + b, 0) / hrValues.length
  const hrStd = Math.sqrt(
    hrValues.reduce((sum, v) => sum + Math.pow(v - hrMean, 2), 0) /
      hrValues.length,
  )

  const paceMean = paceValues.reduce((a, b) => a + b, 0) / paceValues.length
  const paceStd = Math.sqrt(
    paceValues.reduce((sum, v) => sum + Math.pow(v - paceMean, 2), 0) /
      paceValues.length,
  )

  const hrCV = (hrStd / hrMean) * 100
  const paceCV = (paceStd / paceMean) * 100

  let sessionType = 'steady'
  if (hrCV > 10 || paceCV > 15) {
    sessionType = 'interval'
  } else if (hrCV > 5 || paceCV > 8) {
    sessionType = 'variable'
  }

  return {
    sessionType,
    hrStats: {
      mean: Math.round(hrMean),
      std: Math.round(hrStd),
      cv: Number(hrCV.toFixed(1)),
      min: Math.min(...hrValues),
      max: Math.max(...hrValues),
    },
    paceStats: {
      mean: formatPace(paceMean),
      std: Number((paceStd * 60).toFixed(1)),
      cv: Number(paceCV.toFixed(1)),
    },
  }
}

if (process.argv[1]?.includes('interval-detector')) {
  const filePath = process.argv[2] || './data/22010162419_ACTIVITY.fit'
  const data = parseFitFile(filePath)

  console.log('='.repeat(60))
  console.log('Interval Detection Analysis')
  console.log('='.repeat(60))

  const structure = analyzeWorkoutStructure(data.records)
  console.log('\n## Workout Structure')
  console.log(`Type: ${structure.sessionType}`)
  console.log(
    `HR: mean=${structure.hrStats.mean}, std=${structure.hrStats.std}, CV=${structure.hrStats.cv}%`,
  )
  console.log(
    `Pace: mean=${structure.paceStats.mean}/km, std=${structure.paceStats.std}s, CV=${structure.paceStats.cv}%`,
  )

  const intervals = detectIntervals(data.records, {
    hrWorkThreshold: 148,
    hrRestThreshold: 140,
    minIntervalDuration: 60,
    minRestDuration: 30,
  })

  console.log('\n## Detected Intervals')
  console.log(`Total: ${intervals.length}`)

  const workIntervals = intervals.filter((i) => i.type === 'work')
  const restIntervals = intervals.filter((i) => i.type === 'rest')

  console.log(`Work intervals: ${workIntervals.length}`)
  console.log(`Rest intervals: ${restIntervals.length}`)

  console.log('\n## Interval Details')
  intervals.forEach((interval, i) => {
    const icon = interval.type === 'work' ? '🔥' : '💧'
    console.log(
      `${icon} ${i + 1}. ${interval.type.toUpperCase()} | ${interval.durationFormatted} | ${interval.distance}km | HR: ${interval.avgHR} (${interval.minHR}-${interval.maxHR}) | Pace: ${interval.avgPace}/km`,
    )
  })

  if (workIntervals.length > 1) {
    console.log('\n## Work Interval Summary')
    const totalWorkTime = workIntervals.reduce((sum, i) => sum + i.duration, 0)
    const totalWorkDist = workIntervals.reduce((sum, i) => sum + i.distance, 0)
    const avgWorkHR = Math.round(
      workIntervals.reduce((sum, i) => sum + (i.avgHR || 0), 0) /
        workIntervals.length,
    )

    console.log(`Total work time: ${formatTime(totalWorkTime)}`)
    console.log(`Total work distance: ${totalWorkDist.toFixed(2)}km`)
    console.log(`Avg work HR: ${avgWorkHR}`)

    console.log('\n## Work Interval Consistency')
    workIntervals.forEach((w, i) => {
      console.log(
        `  Set ${i + 1}: ${w.durationFormatted} @ ${w.avgPace}/km (HR ${w.avgHR})`,
      )
    })
  }
}
