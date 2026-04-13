import type { WeekGroup } from './sessions-table.types'
import { formatDuration } from './sessions-table.utils'

export function WeeklySummary({ group }: { group: WeekGroup }): React.ReactElement {
  return (
    <div className="sticky top-0 z-10 bg-background pb-2 pt-3">
      <div className="flex items-baseline justify-between">
        <div className="flex items-baseline gap-2">
          <h3 className="text-lg font-semibold">{group.weekNumber}주차</h3>
          <span className="text-xs text-muted-foreground">{group.weekRange}</span>
        </div>
        <span className="text-xs tabular-nums text-muted-foreground">{group.sessionCount}회</span>
      </div>
      <div className="mt-2 grid grid-cols-4 gap-px overflow-hidden rounded-lg border bg-border">
        <div className="flex flex-col bg-background px-3 py-2">
          <span className="text-[11px] text-muted-foreground">거리</span>
          <span className="text-sm font-semibold tabular-nums">
            {group.totalDistance.toFixed(1)}
            <span className="ml-0.5 text-xs font-normal text-muted-foreground">km</span>
          </span>
        </div>
        <div className="flex flex-col bg-background px-3 py-2">
          <span className="text-[11px] text-muted-foreground">시간</span>
          <span className="text-sm font-semibold tabular-nums">
            {formatDuration(group.totalDurationMinutes)}
          </span>
        </div>
        <div className="flex flex-col bg-background px-3 py-2">
          <span className="text-[11px] text-muted-foreground">평균 HR</span>
          <span className="text-sm font-semibold tabular-nums">
            {group.avgHeartRate}
            <span className="ml-0.5 text-xs font-normal text-muted-foreground">bpm</span>
          </span>
        </div>
        <div className="flex flex-col bg-background px-3 py-2">
          <span className="text-[11px] text-muted-foreground">획득고도</span>
          <span className="text-sm font-semibold tabular-nums">
            {group.totalAscent}
            <span className="ml-0.5 text-xs font-normal text-muted-foreground">m</span>
          </span>
        </div>
      </div>
    </div>
  )
}
