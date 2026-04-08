import { describe, it, expect } from 'vite-plus/test'
import { getFitnessStatus } from './pmc'

describe('getFitnessStatus', () => {
  it('TSB > 25이면 fresh를 반환한다', () => {
    const status = getFitnessStatus(30)
    expect(status.status).toBe('fresh')
    expect(status.label).toBe('Fresh')
    expect(status.color).toBe('green')
  })

  it('TSB 5~25이면 recovered를 반환한다', () => {
    const status = getFitnessStatus(15)
    expect(status.status).toBe('recovered')
    expect(status.color).toBe('blue')
  })

  it('TSB -10~5이면 neutral을 반환한다', () => {
    const status = getFitnessStatus(0)
    expect(status.status).toBe('neutral')
    expect(status.color).toBe('yellow')
  })

  it('TSB -30~-10이면 tired를 반환한다', () => {
    const status = getFitnessStatus(-20)
    expect(status.status).toBe('tired')
    expect(status.color).toBe('orange')
  })

  it('TSB < -30이면 overreaching을 반환한다', () => {
    const status = getFitnessStatus(-35)
    expect(status.status).toBe('overreaching')
    expect(status.color).toBe('red')
  })

  it('null이면 unknown을 반환한다', () => {
    const status = getFitnessStatus(null)
    expect(status.status).toBe('unknown')
    expect(status.label).toBe('N/A')
    expect(status.color).toBe('gray')
  })

  it('경계값을 올바르게 분류한다', () => {
    expect(getFitnessStatus(25).status).toBe('recovered')
    expect(getFitnessStatus(5).status).toBe('neutral')
    expect(getFitnessStatus(-10).status).toBe('tired')
    expect(getFitnessStatus(-30).status).toBe('overreaching')
  })
})
