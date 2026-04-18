import type { LT2Benchmark } from '@/../lib/db'
import type { Metadata } from '@/types/running'

/** 세션 메타데이터에서 LT2 비교에 사용할 환경 키를 추출한다. */
export function detectEnvironment(metadata: Metadata | null): string | null {
  if (!metadata) return null

  if (metadata.location === 'trail') return 'trail'

  if (metadata.location === 'treadmill' && metadata.treadmill?.incline) {
    const incline = metadata.treadmill.incline
    if (incline >= 7) return 'incline_8'
    if (incline >= 5) return 'incline_6'
    if (incline >= 3) return 'incline_4'
    if (incline >= 1) return 'incline_2'
  }

  return 'flat'
}

export interface LT2ComparisonResult {
  environment: string
  benchmarkPace: number
  actualPace: number
  diffSeconds: number
  improved: boolean
}

/** 실제 평균 페이스(M:SS/km 문자열)를 초로 변환한다. */
function parsePace(pace: string | null): number | null {
  if (!pace) return null
  const parts = pace.split(':')
  if (parts.length !== 2) return null
  return Number(parts[0]) * 60 + Number(parts[1])
}

/** 세션의 실제 페이스를 해당 환경의 LT2 벤치마크와 비교한다. */
export function compareLT2(
  avgPace: string | null,
  benchmark: LT2Benchmark,
): LT2ComparisonResult | null {
  const actualSeconds = parsePace(avgPace)
  if (actualSeconds === null) return null

  const diff = benchmark.paceSeconds - actualSeconds

  return {
    environment: benchmark.environment,
    benchmarkPace: benchmark.paceSeconds,
    actualPace: actualSeconds,
    diffSeconds: diff,
    improved: diff > 0,
  }
}

export function formatPaceFromSeconds(seconds: number): string {
  const min = Math.floor(seconds / 60)
  const sec = seconds % 60
  return `${min}:${String(sec).padStart(2, '0')}`
}
