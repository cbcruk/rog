import { getAllSessionsForPMC, upsertDailyMetrics } from './db.ts'
import type { PMCDataPoint, FitnessStatus, FitnessTrend } from '@/types/pmc'

const CTL_DAYS = 42
const ATL_DAYS = 7

function getDecayFactor(days: number): number {
  return 2 / (days + 1)
}

function calculateEMA(previousEMA: number, currentValue: number, days: number): number {
  const lambda = getDecayFactor(days)
  return previousEMA + lambda * (currentValue - previousEMA)
}

function generateDateRange(startDate: string, endDate: string): string[] {
  const dates: string[] = []
  const current = new Date(startDate)
  const end = new Date(endDate)

  while (current <= end) {
    dates.push(current.toISOString().split('T')[0])
    current.setDate(current.getDate() + 1)
  }

  return dates
}

interface PMCSession {
  date: string
  rtss: number | null
}

/**
 * 세션 목록으로 PMC 지표를 계산한다.
 * 첫 세션 날짜부터 오늘까지 CTL(42일 EMA), ATL(7일 EMA), TSB(CTL - ATL)를 일별로 산출한다.
 */
export function calculatePMC(sessions: PMCSession[]): PMCDataPoint[] {
  if (!sessions || sessions.length === 0) return []

  const tssByDate = new Map<string, number>()
  for (const session of sessions) {
    const current = tssByDate.get(session.date) || 0
    tssByDate.set(session.date, current + (session.rtss || 0))
  }

  const dates = Array.from(tssByDate.keys()).sort()
  if (dates.length === 0) return []

  const startDate = dates[0]
  const today = new Date().toISOString().split('T')[0]
  const allDates = generateDateRange(startDate, today)

  const pmcData: PMCDataPoint[] = []
  let ctl = 0
  let atl = 0

  for (const date of allDates) {
    const dailyTSS = tssByDate.get(date) || 0

    ctl = calculateEMA(ctl, dailyTSS, CTL_DAYS)
    atl = calculateEMA(atl, dailyTSS, ATL_DAYS)
    const tsb = ctl - atl

    pmcData.push({
      date,
      ctl: Number(ctl.toFixed(1)),
      atl: Number(atl.toFixed(1)),
      tsb: Number(tsb.toFixed(1)),
      tss: dailyTSS,
    })
  }

  return pmcData
}

/** DB에서 전체 세션을 읽어 PMC를 계산하고 daily_metrics 테이블에 저장한다. */
export async function calculateAndStorePMC(): Promise<PMCDataPoint[]> {
  const sessions = await getAllSessionsForPMC()
  const pmcData = calculatePMC(sessions as unknown as PMCSession[])

  for (const day of pmcData) {
    await upsertDailyMetrics(day.date, {
      ctl: day.ctl,
      atl: day.atl,
      tsb: day.tsb,
      totalTss: day.tss,
      sessionsCount: 0,
    })
  }

  console.log(`PMC calculated for ${pmcData.length} days`)
  return pmcData
}

/** TSB 값을 fresh/recovered/neutral/tired/overreaching 상태로 분류한다. */
export function getFitnessStatus(tsb: number | null): FitnessStatus {
  if (tsb === null || tsb === undefined) {
    return {
      status: 'unknown',
      label: 'N/A',
      color: 'gray',
      advice: '데이터가 부족해 상태를 판정할 수 없어요.',
    }
  }

  const v = tsb.toFixed(1)

  if (tsb > 25) {
    return {
      status: 'fresh',
      label: 'Fresh',
      color: 'green',
      advice: `TSB ${v}은 최상 범위(+25 이상) 안에 있어요. 고강도 훈련이나 레이스에 적합합니다.`,
    }
  } else if (tsb > 5) {
    return {
      status: 'recovered',
      label: 'Recovered',
      color: 'blue',
      advice: `TSB ${v}은 회복 범위(+5~+25) 안에 있어요. 가벼운~중간 강도 훈련이 적합합니다.`,
    }
  } else if (tsb > -10) {
    return {
      status: 'neutral',
      label: 'Neutral',
      color: 'yellow',
      advice: `TSB ${v}은 평상시 범위(-10~+5) 안에 있어요. 평소 훈련량을 유지하면 좋습니다.`,
    }
  } else if (tsb > -30) {
    return {
      status: 'tired',
      label: 'Tired',
      color: 'orange',
      advice: `TSB ${v}은 피로 범위(-30~-10) 안에 있어요. 회복 러닝이나 휴식을 권장합니다.`,
    }
  } else {
    return {
      status: 'overreaching',
      label: 'Overreaching',
      color: 'red',
      advice: `TSB ${v}은 과훈련 범위(-30 이하)에요. 며칠간 충분한 휴식이 필요합니다.`,
    }
  }
}

/** 현재 CTL과 이전 CTL을 비교하여 improving/declining/stable 추세를 판정한다. (±5% 기준) */
export function getFitnessTrend(ctl: number | null, previousCtl: number | null): FitnessTrend {
  if (ctl === null || previousCtl === null) {
    return { trend: 'unknown', label: 'N/A' }
  }

  const diff = ctl - previousCtl
  const percentChange = (diff / previousCtl) * 100

  if (percentChange > 5) {
    return { trend: 'improving', label: 'Improving', change: percentChange }
  } else if (percentChange < -5) {
    return { trend: 'declining', label: 'Declining', change: percentChange }
  } else {
    return { trend: 'stable', label: 'Stable', change: percentChange }
  }
}

if (process.argv[1]?.includes('pmc-calculator')) {
  calculateAndStorePMC()
    .then((data) => {
      if (data.length > 0) {
        const latest = data[data.length - 1]
        console.log('Latest PMC:', latest)
        console.log('Status:', getFitnessStatus(latest.tsb))
      }
    })
    .catch(console.error)
}
