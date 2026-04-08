import { describe, it, expect } from 'vite-plus/test'
import { smoothData, detectIntervals, analyzeWorkoutStructure } from './interval-detector'
import type { FitRecord } from '@/types/running'

function createRecords(
  specs: Array<{ hr: number; speed: number; durationSec?: number }>,
): FitRecord[] {
  const records: FitRecord[] = []
  let elapsed = 0
  let distance = 0

  for (const spec of specs) {
    const duration = spec.durationSec ?? 1
    for (let s = 0; s < duration; s++) {
      distance += spec.speed
      records.push({
        timestamp: new Date(Date.UTC(2026, 2, 15, 7, 0, elapsed)).toISOString(),
        heartRate: spec.hr,
        speed: spec.speed,
        distance,
      })
      elapsed++
    }
  }

  return records
}

describe('smoothData', () => {
  it('윈도우 크기만큼 평균을 계산한다', () => {
    const records = createRecords([
      { hr: 100, speed: 2.5, durationSec: 5 },
      { hr: 160, speed: 3.5, durationSec: 5 },
    ])

    const smoothed = smoothData(records, 2)

    expect(smoothed).toHaveLength(10)
    expect(smoothed[0].smoothedHR).toBeGreaterThan(0)
    expect(smoothed[0].smoothedSpeed).toBeGreaterThan(0)
  })

  it('smoothedPace를 계산한다', () => {
    const records = createRecords([{ hr: 140, speed: 3.33, durationSec: 5 }])
    const smoothed = smoothData(records, 1)

    expect(smoothed[2].smoothedPace).toBeCloseTo(1000 / 3.33 / 60, 1)
  })

  it('speed가 0이면 smoothedPace가 null이다', () => {
    const records = createRecords([{ hr: 140, speed: 0, durationSec: 3 }])
    const smoothed = smoothData(records, 1)

    expect(smoothed[1].smoothedPace).toBeNull()
  })

  it('기본 windowSize는 10이다', () => {
    const records = createRecords([{ hr: 140, speed: 3.0, durationSec: 5 }])
    const smoothed = smoothData(records)

    expect(smoothed).toHaveLength(5)
  })
})

describe('detectIntervals', () => {
  it('work/rest 인터벌을 감지한다', () => {
    const records = createRecords([
      { hr: 120, speed: 2.5, durationSec: 60 },
      { hr: 160, speed: 3.8, durationSec: 120 },
      { hr: 125, speed: 2.5, durationSec: 60 },
      { hr: 165, speed: 3.8, durationSec: 120 },
      { hr: 120, speed: 2.5, durationSec: 60 },
    ])

    const intervals = detectIntervals(records, {
      hrWorkThreshold: 150,
      hrRestThreshold: 130,
      minIntervalDuration: 30,
      minRestDuration: 30,
    })

    const workIntervals = intervals.filter((i) => i.type === 'work')
    const restIntervals = intervals.filter((i) => i.type === 'rest')

    expect(workIntervals.length).toBeGreaterThanOrEqual(2)
    expect(restIntervals.length).toBeGreaterThanOrEqual(1)
  })

  it('work 인터벌에 avgHR, maxHR, avgPace를 포함한다', () => {
    const records = createRecords([
      { hr: 120, speed: 2.5, durationSec: 60 },
      { hr: 160, speed: 3.8, durationSec: 120 },
      { hr: 120, speed: 2.5, durationSec: 60 },
    ])

    const intervals = detectIntervals(records, {
      hrWorkThreshold: 150,
      hrRestThreshold: 130,
      minIntervalDuration: 30,
      minRestDuration: 30,
    })

    const work = intervals.find((i) => i.type === 'work')
    expect(work).toBeDefined()
    expect(work!.avgHR).toBeGreaterThan(0)
    expect(work!.maxHR).toBeGreaterThanOrEqual(work!.avgHR!)
    expect(work!.avgPace).toBeDefined()
    expect(work!.distance).toBeGreaterThan(0)
    expect(work!.durationFormatted).toBeDefined()
  })

  it('최소 duration 미만 인터벌을 필터링한다', () => {
    const records = createRecords([
      { hr: 160, speed: 3.8, durationSec: 20 },
      { hr: 120, speed: 2.5, durationSec: 60 },
    ])

    const intervals = detectIntervals(records, {
      hrWorkThreshold: 150,
      hrRestThreshold: 130,
      minIntervalDuration: 60,
      minRestDuration: 30,
    })

    const work = intervals.filter((i) => i.type === 'work')
    expect(work).toHaveLength(0)
  })

  it('심박 변화가 없는 steady run에서는 인터벌이 없다', () => {
    const records = createRecords([{ hr: 135, speed: 3.0, durationSec: 300 }])

    const intervals = detectIntervals(records, {
      hrWorkThreshold: 150,
      hrRestThreshold: 140,
      minIntervalDuration: 60,
    })

    const work = intervals.filter((i) => i.type === 'work')
    expect(work).toHaveLength(0)
  })
})

describe('analyzeWorkoutStructure', () => {
  it('균일한 심박의 세션을 steady로 분류한다', () => {
    const records = createRecords([{ hr: 140, speed: 3.0, durationSec: 300 }])

    const structure = analyzeWorkoutStructure(records)

    expect(structure.sessionType).toBe('steady')
    expect(structure.hrStats.cv).toBeLessThan(5)
  })

  it('심박 변동이 큰 세션을 interval로 분류한다', () => {
    const records = createRecords([
      { hr: 120, speed: 2.5, durationSec: 60 },
      { hr: 175, speed: 4.0, durationSec: 60 },
      { hr: 120, speed: 2.5, durationSec: 60 },
      { hr: 175, speed: 4.0, durationSec: 60 },
      { hr: 120, speed: 2.5, durationSec: 60 },
    ])

    const structure = analyzeWorkoutStructure(records)

    expect(structure.sessionType).toBe('interval')
    expect(structure.hrStats.cv).toBeGreaterThan(10)
  })

  it('hrStats와 paceStats를 반환한다', () => {
    const records = createRecords([{ hr: 145, speed: 3.2, durationSec: 100 }])

    const structure = analyzeWorkoutStructure(records)

    expect(structure.hrStats.mean).toBeGreaterThan(0)
    expect(structure.hrStats.min).toBeLessThanOrEqual(structure.hrStats.max)
    expect(structure.paceStats.mean).toBeDefined()
    expect(structure.paceStats.cv).toBeGreaterThanOrEqual(0)
  })
})
