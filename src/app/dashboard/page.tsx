import { EmptyState } from '@/components/dashboard/empty-state'
import { PMCChartCard } from '@/components/dashboard/pmc-chart-card'
import { PMCLegend } from '@/components/dashboard/pmc-legend'
import { StatCards } from '@/components/dashboard/stat-cards'
import { getPMCData, getPMCSummary } from '@/lib/pmc'
import type { PMCDataPoint, PMCSummary } from '@/types/pmc'

export const dynamic = 'force-dynamic'

interface DashboardContentProps {
  pmcData: PMCDataPoint[]
  summary: PMCSummary | null
}

function DashboardContent({ pmcData, summary }: DashboardContentProps): React.ReactElement {
  const hasData = pmcData.length > 0 && summary !== null

  if (!hasData) return EmptyState

  return (
    <>
      <StatCards summary={summary} />
      <PMCChartCard data={pmcData} />
      <PMCLegend />
    </>
  )
}

export default async function DashboardPage(): Promise<React.ReactElement> {
  const [pmcData, summary] = await Promise.all([getPMCData(90), getPMCSummary()])

  return (
    <div className="p-4 lg:p-6">
      <h1 hidden className="mb-6 text-xl font-bold">
        대시보드
      </h1>
      <DashboardContent pmcData={pmcData} summary={summary} />
    </div>
  )
}
