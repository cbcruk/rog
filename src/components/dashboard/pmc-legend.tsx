import { PMCLegendCard } from './pmc-legend-card'

/**
 * CTL(체력), ATL(피로), TSB(폼) 세 가지 PMC 지표 범례를 그리드로 표시합니다.
 */
export function PMCLegend(): React.ReactElement {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <PMCLegendCard
        dotColor="bg-blue"
        label="체력 (CTL)"
        description="Chronic Training Load. 42일 지수이동평균 TSS로 장기 체력 수준을 나타냅니다."
        guide="점진적으로 높여가는 것이 안전한 훈련의 핵심입니다."
      />
      <PMCLegendCard
        dotColor="bg-magenta"
        label="피로 (ATL)"
        description="Acute Training Load. 7일 지수이동평균 TSS로 최근 누적 피로를 나타냅니다."
        guide="단기간에 급격히 치솟으면 부상·오버트레이닝 위험이 커집니다."
      />
      <PMCLegendCard
        dotColor="bg-green"
        label="폼 (TSB)"
        description="Training Stress Balance. CTL − ATL. 양수면 컨디션이 좋고, 음수면 피로한 상태입니다."
        guide="평상시엔 0 부근, 레이스 직전엔 +5~+15가 이상적입니다."
      />
    </div>
  )
}
