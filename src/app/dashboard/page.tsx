import Link from 'next/link'
import { Activity, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { PMCChart } from '@/components/pmc-chart'
import { getPMCData, getPMCSummary } from '@/lib/pmc'

export const dynamic = 'force-dynamic'

const buttonClass = 'inline-flex items-center justify-center rounded-md bg-tx px-4 py-2 text-sm font-medium text-bg hover:bg-tx/90'

function StatusBadge({ status }: { status: string }): React.ReactElement {
  const colors: Record<string, string> = {
    fresh: 'bg-green-500/10 text-green-600 border-green-500/20',
    recovered: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    neutral: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
    tired: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
    overreaching: 'bg-red-500/10 text-red-600 border-red-500/20',
  }

  return (
    <span className={`rounded-full border px-3 py-1 text-sm font-medium ${colors[status] || 'bg-tx-3/10 text-tx-2'}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

function TrendIndicator({ value, label }: { value: number; label: string }): React.ReactElement {
  const isPositive = value > 0
  const Icon = value > 0 ? TrendingUp : value < 0 ? TrendingDown : Minus
  const color = isPositive ? 'text-green-600' : value < 0 ? 'text-red-500' : 'text-tx-2'

  return (
    <div className="flex items-center gap-1">
      <Icon className={`size-4 ${color}`} />
      <span className={`text-sm ${color}`}>
        {value > 0 ? '+' : ''}{value.toFixed(1)} ({label})
      </span>
    </div>
  )
}

export default async function DashboardPage(): Promise<React.ReactElement> {
  const [pmcData, summary] = await Promise.all([
    getPMCData(90),
    getPMCSummary(),
  ])

  const hasData = pmcData.length > 0 && summary !== null

  return (
    <div className="p-4 lg:p-6">
      <h1 className="mb-6 text-xl font-bold">Dashboard</h1>

      {!hasData ? (
        <div className="rounded-lg border border-tx-3 bg-bg-2 p-8 text-center">
          <Activity className="mx-auto mb-4 size-12 text-tx-3" />
          <h2 className="mb-2 text-lg font-medium">No Data Yet</h2>
          <p className="mb-4 text-sm text-tx-2">
            Run `pnpm db:sync --tss` to calculate TSS and PMC for your sessions.
          </p>
          <Link href="/settings" className={buttonClass}>
            Configure Settings
          </Link>
        </div>
      ) : (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-tx-3 bg-bg-2 p-4">
              <div className="mb-1 text-sm text-tx-2">CTL (Fitness)</div>
              <div className="text-2xl font-bold">{summary.currentCTL.toFixed(1)}</div>
              <TrendIndicator value={summary.trend.ctl7d} label="7d" />
            </div>

            <div className="rounded-lg border border-tx-3 bg-bg-2 p-4">
              <div className="mb-1 text-sm text-tx-2">ATL (Fatigue)</div>
              <div className="text-2xl font-bold">{summary.currentATL.toFixed(1)}</div>
            </div>

            <div className="rounded-lg border border-tx-3 bg-bg-2 p-4">
              <div className="mb-1 text-sm text-tx-2">TSB (Form)</div>
              <div className="text-2xl font-bold">{summary.currentTSB.toFixed(1)}</div>
              <StatusBadge status={summary.fitnessStatus.status} />
            </div>

            <div className="rounded-lg border border-tx-3 bg-bg-2 p-4">
              <div className="mb-1 text-sm text-tx-2">Weekly TSS</div>
              <div className="text-2xl font-bold">{summary.weeklyTSS.toFixed(0)}</div>
            </div>
          </div>

          <div className="rounded-lg border border-tx-3 bg-bg-2 p-4">
            <h2 className="mb-4 text-lg font-medium">Performance Management Chart</h2>
            <PMCChart data={pmcData} height={350} />
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-tx-3 bg-bg-2 p-4">
              <div className="mb-2 flex items-center gap-2">
                <div className="size-3 rounded-full bg-blue-500" />
                <span className="text-sm font-medium">CTL (Fitness)</span>
              </div>
              <p className="text-xs text-tx-2">
                42-day exponential moving average of TSS. Higher = more fit.
              </p>
            </div>

            <div className="rounded-lg border border-tx-3 bg-bg-2 p-4">
              <div className="mb-2 flex items-center gap-2">
                <div className="size-3 rounded-full bg-magenta-500" />
                <span className="text-sm font-medium">ATL (Fatigue)</span>
              </div>
              <p className="text-xs text-tx-2">
                7-day exponential moving average of TSS. Higher = more tired.
              </p>
            </div>

            <div className="rounded-lg border border-tx-3 bg-bg-2 p-4">
              <div className="mb-2 flex items-center gap-2">
                <div className="size-3 rounded-full bg-green-500" />
                <span className="text-sm font-medium">TSB (Form)</span>
              </div>
              <p className="text-xs text-tx-2">
                CTL - ATL. Positive = fresh, negative = fatigued.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
