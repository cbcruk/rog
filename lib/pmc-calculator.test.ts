import { describe, it, expect } from 'vite-plus/test'
import { calculatePMC, getFitnessTrend } from './pmc-calculator'

describe('calculatePMC', () => {
  it('세션 데이터로 CTL, ATL, TSB를 일별 계산한다', () => {
    const sessions = [
      { date: '2026-03-01', rtss: 80 },
      { date: '2026-03-03', rtss: 60 },
      { date: '2026-03-05', rtss: 100 },
    ]

    const pmc = calculatePMC(sessions)

    expect(pmc.length).toBeGreaterThan(0)
    expect(pmc[0].date).toBe('2026-03-01')
    expect(pmc[0]).toHaveProperty('ctl')
    expect(pmc[0]).toHaveProperty('atl')
    expect(pmc[0]).toHaveProperty('tsb')
    expect(pmc[0]).toHaveProperty('tss')
  })

  it('운동하지 않은 날은 TSS 0으로 계산한다', () => {
    const sessions = [
      { date: '2026-03-01', rtss: 80 },
      { date: '2026-03-03', rtss: 60 },
    ]

    const pmc = calculatePMC(sessions)
    const day2 = pmc.find((d) => d.date === '2026-03-02')

    expect(day2).toBeDefined()
    expect(day2!.tss).toBe(0)
  })

  it('같은 날 여러 세션의 TSS를 합산한다', () => {
    const sessions = [
      { date: '2026-03-01', rtss: 50 },
      { date: '2026-03-01', rtss: 30 },
    ]

    const pmc = calculatePMC(sessions)
    const day1 = pmc.find((d) => d.date === '2026-03-01')

    expect(day1!.tss).toBe(80)
  })

  it('ATL(7일)이 CTL(42일)보다 빠르게 반응한다', () => {
    const sessions = [{ date: '2026-03-01', rtss: 200 }]

    const pmc = calculatePMC(sessions)
    const day1 = pmc[0]

    expect(day1.atl).toBeGreaterThan(day1.ctl)
  })

  it('TSB = CTL - ATL이다', () => {
    const sessions = [{ date: '2026-03-01', rtss: 100 }]

    const pmc = calculatePMC(sessions)
    const day1 = pmc[0]

    expect(day1.tsb).toBeCloseTo(day1.ctl - day1.atl, 1)
  })

  it('빈 배열이면 빈 결과를 반환한다', () => {
    expect(calculatePMC([])).toEqual([])
  })

  it('rtss가 null인 세션은 0으로 처리한다', () => {
    const sessions = [
      { date: '2026-03-01', rtss: null },
      { date: '2026-03-02', rtss: 80 },
    ]

    const pmc = calculatePMC(sessions)
    const day1 = pmc.find((d) => d.date === '2026-03-01')

    expect(day1!.tss).toBe(0)
  })
})

describe('getFitnessTrend', () => {
  it('CTL이 5% 초과 증가하면 improving이다', () => {
    expect(getFitnessTrend(44, 40).trend).toBe('improving')
    expect(getFitnessTrend(44, 40).change).toBeGreaterThan(0)
  })

  it('CTL이 5% 초과 감소하면 declining이다', () => {
    expect(getFitnessTrend(36, 40).trend).toBe('declining')
    expect(getFitnessTrend(36, 40).change).toBeLessThan(0)
  })

  it('CTL 변화가 ±5% 이내이면 stable이다', () => {
    expect(getFitnessTrend(42, 40).trend).toBe('stable')
  })

  it('null 입력이면 unknown을 반환한다', () => {
    expect(getFitnessTrend(null, 40).trend).toBe('unknown')
    expect(getFitnessTrend(40, null).trend).toBe('unknown')
  })

  it('각 추세에 label을 포함한다', () => {
    expect(getFitnessTrend(44, 40).label).toBe('Improving')
    expect(getFitnessTrend(36, 40).label).toBe('Declining')
    expect(getFitnessTrend(42, 40).label).toBe('Stable')
  })
})
