import { PMCChart } from '@/components/pmc-chart/pmc-chart'
import type { PMCDataPoint } from '@/types/pmc'

interface PMCChartCardProps {
  /** PMC 차트에 렌더링할 일별 CTL/ATL/TSB 데이터 */
  data: PMCDataPoint[]
}

/**
 * PMC(Performance Management Chart) 차트를 카드 형태로 감싸는 컴포넌트.
 *
 * @param data - PMC 차트에 렌더링할 일별 CTL/ATL/TSB 데이터
 */
export function PMCChartCard({ data }: PMCChartCardProps): React.ReactElement {
  return (
    <div className="rounded-lg border bg-muted p-4">
      <h2 className="mb-4 text-lg font-medium">훈련 관리 차트 (PMC)</h2>
      <PMCChart data={data} height={350} />
    </div>
  )
}
