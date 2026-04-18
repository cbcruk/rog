import type { ZoneDistribution } from '@/lib/hr-zones'
import type { SessionType } from '@/types/running'

export type QualityGrade = 'pass' | 'partial' | 'fail'

export interface CriterionResult {
  label: string
  actual: string
  target: string
  passed: boolean
}

export interface SessionQuality {
  grade: QualityGrade
  criteria: CriterionResult[]
}

function pctLabel(pct: number): string {
  return `${pct}%`
}

function evaluateThreshold(zone: ZoneDistribution): SessionQuality {
  const z4ok = zone.z4.pct >= 40
  const z5ok = zone.z5.pct <= 5

  const criteria: CriterionResult[] = [
    { label: 'Z4 비율', actual: pctLabel(zone.z4.pct), target: '≥40%', passed: z4ok },
    { label: 'Z5 비율', actual: pctLabel(zone.z5.pct), target: '≤5%', passed: z5ok },
  ]

  const grade = z4ok && z5ok ? 'pass' : z4ok || z5ok ? 'partial' : 'fail'
  return { grade, criteria }
}

function evaluateEasy(zone: ZoneDistribution): SessionQuality {
  const easyPct = zone.z1.pct + zone.z2.pct
  const easyOk = easyPct >= 80
  const z5ok = zone.z5.pct === 0

  const criteria: CriterionResult[] = [
    { label: 'Z1+Z2 비율', actual: pctLabel(easyPct), target: '≥80%', passed: easyOk },
    { label: 'Z5 비율', actual: pctLabel(zone.z5.pct), target: '0%', passed: z5ok },
  ]

  const grade = easyOk && z5ok ? 'pass' : easyOk || z5ok ? 'partial' : 'fail'
  return { grade, criteria }
}

function evaluateLongRun(zone: ZoneDistribution, durationSeconds: number): SessionQuality {
  const easyPct = zone.z1.pct + zone.z2.pct
  const durationOk = durationSeconds >= 5400
  const easyOk = easyPct >= 70

  const criteria: CriterionResult[] = [
    {
      label: '운동 시간',
      actual: `${Math.floor(durationSeconds / 60)}분`,
      target: '≥90분',
      passed: durationOk,
    },
    { label: 'Z1+Z2 비율', actual: pctLabel(easyPct), target: '≥70%', passed: easyOk },
  ]

  const grade = durationOk && easyOk ? 'pass' : durationOk || easyOk ? 'partial' : 'fail'
  return { grade, criteria }
}

function evaluateTempo(zone: ZoneDistribution): SessionQuality {
  const tempoPct = zone.z3.pct + zone.z4.pct
  const tempoOk = tempoPct >= 50

  const criteria: CriterionResult[] = [
    { label: 'Z3+Z4 비율', actual: pctLabel(tempoPct), target: '≥50%', passed: tempoOk },
  ]

  return { grade: tempoOk ? 'pass' : 'fail', criteria }
}

/**
 * 세션 유형과 존 분포를 기반으로 품질을 평가한다.
 * 유형별 기준에 따라 pass/partial/fail을 판정하고 개별 기준 결과를 반환한다.
 */
export function scoreSession(
  type: SessionType,
  zone: ZoneDistribution,
  durationSeconds: number,
): SessionQuality | null {
  switch (type) {
    case 'threshold_interval':
      return evaluateThreshold(zone)
    case 'easy':
    case 'recovery':
      return evaluateEasy(zone)
    case 'long_run':
      return evaluateLongRun(zone, durationSeconds)
    case 'tempo':
      return evaluateTempo(zone)
    default:
      return null
  }
}
