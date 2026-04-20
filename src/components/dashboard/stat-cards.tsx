import { StatCard } from './stat-card'
import { StatusBadge } from './status-badge'
import { TrendIndicator } from './trend-indicator'
import { TermLabel } from './term-label'
import { getWeeklyTSSComparison } from '@/lib/pmc'
import type { PMCSummary } from '@/types/pmc'

interface StatCardsProps {
  /** 현재 PMC 값과 7일 추세, 피트니스 상태가 포함된 요약 데이터 */
  summary: PMCSummary
}

/**
 * 대시보드 상단의 PMC 요약 통계 카드 그리드.
 * CTL, ATL, TSB, 주간 TSS 네 가지 지표를 한 줄로 표시합니다.
 */
export function StatCards({ summary }: StatCardsProps): React.ReactElement {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        label={<TermLabel term="체력 (CTL)" definition="Chronic Training Load — 만성 훈련 부하." />}
        value={summary.currentCTL.toFixed(1)}
        description={
          <TrendIndicator value={summary.trend.ctl7d} period="7일간" subject="체력 수치" />
        }
      />
      <StatCard
        label={<TermLabel term="피로 (ATL)" definition="Acute Training Load — 급성 훈련 부하. " />}
        value={summary.currentATL.toFixed(1)}
      />
      <StatCard
        label={
          <TermLabel
            term="폼 (TSB)"
            definition="Training Stress Balance — 훈련 스트레스 균형. CTL - ATL."
          />
        }
        value={summary.currentTSB.toFixed(1)}
        description={summary.fitnessStatus.advice}
      >
        <StatusBadge fitnessStatus={summary.fitnessStatus} />
      </StatCard>
      <StatCard
        label={
          <TermLabel
            term="주간 TSS"
            definition="Training Stress Score — 훈련 스트레스 점수의 주간 합계. ACWR(Gabbett 2016) 기준으로 부상 위험을 평가합니다. 0.8~1.3이 안전 구간."
          />
        }
        value={summary.weeklyTSS.toFixed(0)}
        description={getWeeklyTSSComparison(summary.weeklyTSS, summary.currentCTL)}
      />
    </div>
  )
}
