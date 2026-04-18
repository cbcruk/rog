import { describe, it, expect } from 'vite-plus/test'
import { scoreSession } from './quality-scorer'
import type { ZoneDistribution } from './hr-zones'

function makeZone(pcts: [number, number, number, number, number]): ZoneDistribution {
  return {
    z1: { pct: pcts[0], seconds: pcts[0] * 10 },
    z2: { pct: pcts[1], seconds: pcts[1] * 10 },
    z3: { pct: pcts[2], seconds: pcts[2] * 10 },
    z4: { pct: pcts[3], seconds: pcts[3] * 10 },
    z5: { pct: pcts[4], seconds: pcts[4] * 10 },
  }
}

describe('scoreSession', () => {
  it('threshold: Z4≥40%, Z5≤5% → pass', () => {
    const result = scoreSession('threshold_interval', makeZone([10, 20, 20, 45, 5]), 3600)
    expect(result?.grade).toBe('pass')
  })

  it('threshold: Z4<40% → partial 또는 fail', () => {
    const result = scoreSession('threshold_interval', makeZone([30, 30, 20, 10, 10]), 3600)
    expect(result?.grade).toBe('fail')
  })

  it('easy: Z1+Z2≥80%, Z5=0% → pass', () => {
    const result = scoreSession('easy', makeZone([50, 40, 10, 0, 0]), 3000)
    expect(result?.grade).toBe('pass')
  })

  it('easy: Z5>0% → partial', () => {
    const result = scoreSession('easy', makeZone([50, 35, 10, 3, 2]), 3000)
    expect(result?.grade).toBe('partial')
  })

  it('long_run: 90분+ && Z1+Z2≥70% → pass', () => {
    const result = scoreSession('long_run', makeZone([40, 35, 15, 10, 0]), 5400)
    expect(result?.grade).toBe('pass')
  })

  it('long_run: 90분 미만 → partial', () => {
    const result = scoreSession('long_run', makeZone([40, 35, 15, 10, 0]), 4000)
    expect(result?.grade).toBe('partial')
  })

  it('tempo: Z3+Z4≥50% → pass', () => {
    const result = scoreSession('tempo', makeZone([10, 20, 30, 30, 10]), 3600)
    expect(result?.grade).toBe('pass')
  })

  it('progression/trail → null (기준 없음)', () => {
    expect(scoreSession('progression', makeZone([20, 20, 20, 20, 20]), 3600)).toBeNull()
    expect(scoreSession('trail', makeZone([20, 20, 20, 20, 20]), 3600)).toBeNull()
  })
})
