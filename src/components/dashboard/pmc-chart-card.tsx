import { Card } from '@astryxdesign/core/Card'
import { Heading } from '@astryxdesign/core/Heading'
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
    <Card>
      <Heading level={2}>훈련 관리 차트 (PMC)</Heading>
      <div className="mt-4">
        <PMCChart data={data} height={350} />
      </div>
    </Card>
  )
}
