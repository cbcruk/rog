import { describe, it, expect } from 'vite-plus/test'
import { formatPace, formatTime, analyzeRun } from './analyzer'
import type { FitSession, FitLap, FitRecord, Metadata } from '@/types/running'

describe('formatPace', () => {
  it('분/km를 "M:SS" 형식으로 변환한다', () => {
    expect(formatPace(5.5)).toBe('5:30')
    expect(formatPace(4.0)).toBe('4:00')
    expect(formatPace(6.25)).toBe('6:15')
  })

  it('0이면 null을 반환한다', () => {
    expect(formatPace(0)).toBeNull()
  })

  it('Infinity이면 null을 반환한다', () => {
    expect(formatPace(Infinity)).toBeNull()
  })

  it('NaN이면 null을 반환한다', () => {
    expect(formatPace(NaN)).toBeNull()
  })
})

describe('formatTime', () => {
  it('1시간 이상이면 "H:MM:SS" 형식으로 변환한다', () => {
    expect(formatTime(3661)).toBe('1:01:01')
    expect(formatTime(7200)).toBe('2:00:00')
  })

  it('1시간 미만이면 "M:SS" 형식으로 변환한다', () => {
    expect(formatTime(125)).toBe('2:05')
    expect(formatTime(0)).toBe('0:00')
    expect(formatTime(59)).toBe('0:59')
  })
})

function createSession(overrides: Partial<FitSession> = {}): FitSession {
  return {
    startTime: new Date('2026-03-15T07:00:00Z'),
    totalDistance: 10000,
    totalElapsedTime: 3000,
    avgHeartRate: 145,
    maxHeartRate: 165,
    totalCalories: 500,
    avgRunningCadence: 90,
    totalAscent: 50,
    totalDescent: 45,
    sport: 'running',
    ...overrides,
  }
}

function createLaps(count: number): FitLap[] {
  const laps: FitLap[] = []
  for (let i = 0; i < count; i++) {
    laps.push({
      totalElapsedTime: 300,
      totalDistance: 1000,
      avgHeartRate: 140 + i,
      avgRunningCadence: 90,
      totalAscent: 5,
      totalDescent: 4,
    })
  }
  laps.push({
    totalElapsedTime: 60,
    totalDistance: 200,
    avgHeartRate: 150,
  })
  return laps
}

describe('analyzeRun', () => {
  const session = createSession()
  const laps = createLaps(10)
  const records: FitRecord[] = []

  it('기본 summary를 올바르게 계산한다', () => {
    const result = analyzeRun({ session, laps, records })

    expect(result.summary.distance).toBe(10)
    expect(result.summary.avgHeartRate).toBe(145)
    expect(result.summary.maxHeartRate).toBe(165)
    expect(result.summary.calories).toBe(500)
    expect(result.summary.avgCadence).toBe(180)
    expect(result.summary.avgPace).toBe('5:00')
  })

  it('마지막 랩(잔여 거리)을 제외하고 분석한다', () => {
    const result = analyzeRun({ session, laps, records })

    expect(result.laps).toHaveLength(10)
    expect(result.laps[0].km).toBe(1)
    expect(result.laps[9].km).toBe(10)
  })

  it('스플릿을 전반/후반으로 분석한다', () => {
    const result = analyzeRun({ session, laps, records })

    expect(result.splits.firstHalfPace).toBeDefined()
    expect(result.splits.secondHalfPace).toBeDefined()
    expect(result.splits.type).toMatch(/^(positive|negative)$/)
  })

  it('일관성 지표를 계산한다', () => {
    const result = analyzeRun({ session, laps, records })

    expect(result.consistency.cv).toBeGreaterThanOrEqual(0)
    expect(result.consistency.stdDevSeconds).toBeGreaterThanOrEqual(0)
    expect(result.consistency.rating).toMatch(/^(excellent|good|needs_improvement)$/)
  })

  it('균일한 페이스에서 excellent 등급을 반환한다', () => {
    const uniformLaps = createLaps(10)
    const result = analyzeRun({ session, laps: uniformLaps, records })

    expect(result.consistency.rating).toBe('excellent')
  })

  it('fastest/slowest 랩을 식별한다', () => {
    const result = analyzeRun({ session, laps, records })

    expect(result.highlights.fastestLap.km).toBeGreaterThanOrEqual(1)
    expect(result.highlights.slowestLap.km).toBeGreaterThanOrEqual(1)
    expect(result.highlights.fastestLap.pace).toBeDefined()
    expect(result.highlights.slowestLap.pace).toBeDefined()
  })

  it('5km 단위 세그먼트를 생성한다', () => {
    const result = analyzeRun({ session, laps, records })

    expect(result.segments.length).toBeGreaterThanOrEqual(1)
    expect(result.segments[0].range).toBe('1-5km')
  })

  it('심박 분석을 포함한다', () => {
    const result = analyzeRun({ session, laps, records })

    expect(result.heartRate).not.toBeNull()
    expect(result.heartRate!.avgHeartRate).toBeGreaterThan(0)
    expect(result.heartRate!.drift).toBeDefined()
  })

  it('10km 이상 세션에서 피로도 분석을 포함한다', () => {
    const result = analyzeRun({ session, laps, records })

    expect(result.fatigue).not.toBeNull()
    expect(result.fatigue!.first5kmPace).toBeDefined()
    expect(result.fatigue!.last5kmPace).toBeDefined()
    expect(result.fatigue!.dropSeconds).toBeDefined()
  })

  it('10km 미만 세션에서 피로도 분석을 제외한다', () => {
    const shortSession = createSession({ totalDistance: 5000, totalElapsedTime: 1500 })
    const shortLaps = createLaps(5)
    const result = analyzeRun({ session: shortSession, laps: shortLaps, records })

    expect(result.fatigue).toBeNull()
  })

  it('고도 분석을 포함한다', () => {
    const result = analyzeRun({ session, laps, records })

    expect(result.elevation.totalAscent).toBe(50)
    expect(result.elevation.totalDescent).toBe(45)
  })

  it('TSS를 계산한다', () => {
    const result = analyzeRun({ session, laps, records })

    expect(result.tss.rtss).toBeGreaterThan(0)
    expect(result.tss.intensityFactor).toBeGreaterThan(0)
    expect(result.tss.zone).toBeDefined()
  })

  it('날짜를 YYYY-MM-DD 형식으로 반환한다', () => {
    const result = analyzeRun({ session, laps, records })

    expect(result.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('session이나 laps가 없으면 에러를 던진다', () => {
    expect(() => analyzeRun({ session, laps: [], records })).toThrow('Invalid data')
    expect(() => analyzeRun({ session: null as unknown as FitSession, laps, records })).toThrow(
      'Invalid data',
    )
  })

  it('metadata 없이도 location을 자동 감지한다', () => {
    const result = analyzeRun({ session, laps, records })

    expect(result.metadata).toEqual({ location: 'road' })
  })

  it('treadmill subSport를 감지한다', () => {
    const treadmillSession = createSession({ subSport: 'treadmill' })
    const result = analyzeRun({ session: treadmillSession, laps, records })

    expect(result.metadata).toEqual({ location: 'treadmill' })
  })

  it('trail subSport를 감지한다', () => {
    const trailSession = createSession({ subSport: 'trail' })
    const result = analyzeRun({ session: trailSession, laps, records })

    expect(result.metadata).toEqual({ location: 'trail' })
  })

  it('subSport 숫자 코드도 감지한다', () => {
    expect(analyzeRun({ session: createSession({ subSport: 1 }), laps, records }).metadata).toEqual(
      { location: 'treadmill' },
    )
    expect(analyzeRun({ session: createSession({ subSport: 8 }), laps, records }).metadata).toEqual(
      { location: 'trail' },
    )
  })

  it('metadata가 있으면 location을 병합한다', () => {
    const meta = { type: 'easy' as const, location: 'road' as const }
    const result = analyzeRun({ session, laps, records, metadata: meta })

    expect(result.metadata).toMatchObject({ type: 'easy', location: 'road' })
  })

  it('metadata에 location이 없으면 자동 감지값을 사용한다', () => {
    const result = analyzeRun({
      session: createSession({ subSport: 'trail' }),
      laps,
      records,
      metadata: { type: 'easy' } as Partial<Metadata>,
    })

    expect(result.metadata).toMatchObject({ location: 'trail' })
  })

  it('인터벌 metadata가 없으면 intervals가 null이다', () => {
    const result = analyzeRun({ session, laps, records })

    expect(result.intervals).toBeNull()
  })

  it('케이던스가 없으면 avgCadence가 null이다', () => {
    const noCadenceSession = createSession({ avgRunningCadence: undefined })
    const result = analyzeRun({ session: noCadenceSession, laps, records })

    expect(result.summary.avgCadence).toBeNull()
  })
})
