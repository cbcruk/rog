import { EmptyState } from '@/components/dashboard/empty-state'
import { PMCChartCard } from '@/components/dashboard/pmc-chart-card'
import { PMCLegend } from '@/components/dashboard/pmc-legend'
import { RecommendationsCard } from '@/components/dashboard/recommendations-card'
import { StatCards } from '@/components/dashboard/stat-cards'
import { ZoneStatsCard } from '@/components/dashboard/zone-stats-card'
import { getPMCData, getPMCSummary, getWeeklyZoneStats, getRecommendationInput } from '@/lib/pmc'
import { getRecommendations } from '@/lib/recommendations'
import type { PMCDataPoint, PMCSummary, WeeklyZoneStats } from '@/types/pmc'
import type { Recommendation } from '@/lib/recommendations'

export const dynamic = 'force-dynamic'

interface DashboardContentProps {
  pmcData: PMCDataPoint[]
  summary: PMCSummary | null
  zoneStats: WeeklyZoneStats | null
  recommendations: Recommendation[]
}

function DashboardContent({
  pmcData,
  summary,
  zoneStats,
  recommendations,
}: DashboardContentProps): React.ReactElement {
  const hasData = pmcData.length > 0 && summary !== null

  if (!hasData) return EmptyState

  return (
    <>
      <StatCards summary={summary} />
      {zoneStats && <ZoneStatsCard stats={zoneStats} />}
      <RecommendationsCard recommendations={recommendations} />
      <PMCChartCard data={pmcData} />
      <PMCLegend />
    </>
  )
}

export default async function DashboardPage(): Promise<React.ReactElement> {
  const [pmcData, summary, zoneStats] = await Promise.all([
    getPMCData(90),
    getPMCSummary(),
    getWeeklyZoneStats(),
  ])

  const recInput = summary ? await getRecommendationInput(summary.currentTSB, zoneStats) : null
  const recommendations = recInput ? getRecommendations(recInput) : []

  return (
    <div className="p-4 lg:p-6">
      <h1 hidden className="mb-6 text-xl font-bold">
        대시보드
      </h1>
      <DashboardContent
        pmcData={pmcData}
        summary={summary}
        zoneStats={zoneStats}
        recommendations={recommendations}
      />
    </div>
  )
}
