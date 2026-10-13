import { Heading } from '@astryxdesign/core/Heading'
import { Text } from '@astryxdesign/core/Text'
import { WeekCompareGrid } from '@/components/week-view/week-compare-grid'
import { WeekNav } from '@/components/week-view/week-nav'
import { WeekProgressPanel } from '@/components/week-view/week-progress-panel'
import { getActiveProgram } from '@/lib/program'
import { getAllSessions } from '@/lib/sessions'
import { buildWeekComparison, formatWeekLabel, getMonday } from '@/lib/week-plan'

export const dynamic = 'force-dynamic'

/** 이동 가능한 주 범위. 과거는 1년, 미래는 계획 확인용으로 4주까지 허용한다. */
const MIN_OFFSET = -52
const MAX_OFFSET = 4

function parseOffset(value: string | undefined): number {
  const parsed = Number(value)
  if (!Number.isInteger(parsed)) return 0
  return Math.min(MAX_OFFSET, Math.max(MIN_OFFSET, parsed))
}

interface WeekPageProps {
  searchParams: Promise<{ offset?: string }>
}

export default async function WeekPage({
  searchParams,
}: WeekPageProps): Promise<React.ReactElement> {
  const [{ offset: offsetParam }, program, sessions] = await Promise.all([
    searchParams,
    getActiveProgram(),
    Promise.resolve(getAllSessions()),
  ])

  const offset = parseOffset(offsetParam)
  const today = new Date()
  const monday = getMonday(today, offset)

  const comparison = buildWeekComparison(program?.sessions ?? [], sessions, monday, today)

  return (
    <div className="flex flex-col gap-4 p-4 lg:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-col gap-0.5">
          <Heading level={1}>{offset === 0 ? '이번 주' : formatWeekLabel(monday)}</Heading>
          <Text color="secondary" display="block">
            {offset === 0 && `${formatWeekLabel(monday)} · `}
            {program ? `적용 중: ${program.name}` : '적용 중인 프로그램 없음'}
          </Text>
        </div>

        <WeekNav offset={offset} minOffset={MIN_OFFSET} maxOffset={MAX_OFFSET} />
      </div>

      <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <WeekCompareGrid days={comparison.days} />

        <div className="lg:sticky lg:top-16">
          <WeekProgressPanel
            planned={comparison.planned}
            actual={comparison.actual}
            missedCount={comparison.missedCount}
            unplannedCount={comparison.unplannedCount}
            hasProgram={program !== null}
          />
        </div>
      </div>
    </div>
  )
}
