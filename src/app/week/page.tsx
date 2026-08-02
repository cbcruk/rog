import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { WeekCompareGrid } from '@/components/week-view/week-compare-grid'
import { WeekProgressPanel } from '@/components/week-view/week-progress-panel'
import { getActiveProgram } from '@/lib/program'
import { getAllSessions } from '@/lib/sessions'
import { buildWeekComparison, formatWeekLabel, getMonday } from '@/lib/week-plan'

export const dynamic = 'force-dynamic'

/** 이동 가능한 주 범위. 과거는 1년, 미래는 계획 확인용으로 4주까지 허용한다. */
const MIN_OFFSET = -52
const MAX_OFFSET = 4

/**
 * 주 이동 링크 스타일.
 * `buttonVariants`는 클라이언트 모듈이라 서버 컴포넌트에서 호출할 수 없어 outline 버튼 모양을 직접 맞춘다.
 */
const NAV_LINK_CLASS =
  'inline-flex items-center justify-center rounded-lg border border-border bg-background font-medium transition-colors hover:bg-muted'

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
          <h1 className="text-xl font-bold">
            {offset === 0 ? '이번 주' : formatWeekLabel(monday)}
          </h1>
          <p className="text-sm text-muted-foreground">
            {offset === 0 && `${formatWeekLabel(monday)} · `}
            {program ? `적용 중: ${program.name}` : '적용 중인 프로그램 없음'}
          </p>
        </div>

        <div className="flex items-center gap-1">
          <Link
            href={`/week?offset=${Math.max(MIN_OFFSET, offset - 1)}`}
            aria-label="이전 주"
            className={`${NAV_LINK_CLASS} size-7`}
          >
            <ChevronLeft className="size-3.5" />
          </Link>
          {offset !== 0 && (
            <Link href="/week" className={`${NAV_LINK_CLASS} h-7 px-2.5 text-[0.8rem]`}>
              이번 주
            </Link>
          )}
          <Link
            href={`/week?offset=${Math.min(MAX_OFFSET, offset + 1)}`}
            aria-label="다음 주"
            className={`${NAV_LINK_CLASS} size-7`}
          >
            <ChevronRight className="size-3.5" />
          </Link>
        </div>
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
