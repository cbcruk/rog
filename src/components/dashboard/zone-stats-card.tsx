import type { WeeklyZoneStats } from '@/types/pmc'

interface ZoneStatsCardProps {
  stats: WeeklyZoneStats
}

function formatMinutes(seconds: number): string {
  const m = Math.floor(seconds / 60)
  return `${m}분`
}

/**
 * 주간 HR Zone 통계 카드.
 * Z4/Z5 시간과 이지/하드 비율(80/20 법칙 기준)을 표시합니다.
 */
export function ZoneStatsCard({ stats }: ZoneStatsCardProps): React.ReactElement {
  return (
    <div className="rounded-lg border bg-muted p-4">
      <h2 className="mb-3 text-sm font-medium text-muted-foreground">주간 HR Zone</h2>
      <div className="mb-3 flex h-3 overflow-hidden rounded-full">
        <div className="bg-green" style={{ width: `${stats.easyPct}%` }} />
        <div className="bg-orange" style={{ width: `${stats.hardPct}%` }} />
      </div>
      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <div className="text-lg font-bold">
            {stats.easyPct}/{stats.hardPct}
          </div>
          <div className="text-xs text-muted-foreground">이지/하드</div>
        </div>
        <div>
          <div className="text-lg font-bold">{formatMinutes(stats.z4Seconds)}</div>
          <div className="text-xs text-muted-foreground">Z4 역치</div>
        </div>
        <div>
          <div className="text-lg font-bold">{formatMinutes(stats.z5Seconds)}</div>
          <div className="text-xs text-muted-foreground">Z5 VO2max</div>
        </div>
      </div>
    </div>
  )
}
