/**
 * Performance Management Chart (PMC) Calculator
 *
 * CTL (Chronic Training Load) - 42-day exponential moving average
 * ATL (Acute Training Load) - 7-day exponential moving average
 * TSB (Training Stress Balance) = CTL - ATL
 */

import { getAllSessionsForPMC, upsertDailyMetrics, getLatestDailyMetrics } from './db.mjs'

const CTL_DAYS = 42
const ATL_DAYS = 7

/**
 * Calculate exponential decay factor
 * @param {number} days - Time constant in days
 * @returns {number} Decay factor (lambda)
 */
function getDecayFactor(days) {
  return 2 / (days + 1)
}

/**
 * Calculate exponential moving average
 * @param {number} previousEMA - Previous EMA value
 * @param {number} currentValue - Current day's value
 * @param {number} days - Time constant
 * @returns {number} New EMA value
 */
function calculateEMA(previousEMA, currentValue, days) {
  const lambda = getDecayFactor(days)
  return previousEMA + lambda * (currentValue - previousEMA)
}

/**
 * Generate date range array
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {string[]} Array of dates
 */
function generateDateRange(startDate, endDate) {
  const dates = []
  const current = new Date(startDate)
  const end = new Date(endDate)

  while (current <= end) {
    dates.push(current.toISOString().split('T')[0])
    current.setDate(current.getDate() + 1)
  }

  return dates
}

/**
 * Calculate PMC metrics for all dates
 * @param {Array} sessions - Array of sessions with date and rtss
 * @returns {Array} PMC data for each date
 */
export function calculatePMC(sessions) {
  if (!sessions || sessions.length === 0) return []

  const tssByDate = new Map()
  for (const session of sessions) {
    const current = tssByDate.get(session.date) || 0
    tssByDate.set(session.date, current + (session.rtss || 0))
  }

  const dates = Array.from(tssByDate.keys()).sort()
  if (dates.length === 0) return []

  const startDate = dates[0]
  const today = new Date().toISOString().split('T')[0]
  const allDates = generateDateRange(startDate, today)

  const pmcData = []
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

/**
 * Calculate and store PMC metrics in database
 */
export async function calculateAndStorePMC() {
  const sessions = await getAllSessionsForPMC()
  const pmcData = calculatePMC(sessions)

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

/**
 * Get current fitness status based on TSB
 * @param {number} tsb - Training Stress Balance
 * @returns {Object} Status info
 */
export function getFitnessStatus(tsb) {
  if (tsb === null || tsb === undefined) {
    return { status: 'unknown', label: 'N/A', color: 'gray' }
  }

  if (tsb > 25) {
    return { status: 'fresh', label: 'Fresh', color: 'green' }
  } else if (tsb > 5) {
    return { status: 'recovered', label: 'Recovered', color: 'blue' }
  } else if (tsb > -10) {
    return { status: 'neutral', label: 'Neutral', color: 'yellow' }
  } else if (tsb > -30) {
    return { status: 'tired', label: 'Tired', color: 'orange' }
  } else {
    return { status: 'overreaching', label: 'Overreaching', color: 'red' }
  }
}

/**
 * Get CTL (fitness) trend description
 * @param {number} ctl - Current CTL
 * @param {number} previousCtl - Previous CTL (e.g., 7 days ago)
 * @returns {Object} Trend info
 */
export function getFitnessTrend(ctl, previousCtl) {
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

if (process.argv[1].includes('pmc-calculator.mjs')) {
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
