import Link from 'next/link'
import { Activity } from 'lucide-react'

/**
 * PMC 데이터가 없을 때 대시보드에 표시되는 빈 상태 엘리먼트.
 * 동기화 명령어 안내와 설정 페이지 링크를 제공합니다.
 */
export const EmptyState = (
  <div className="rounded-lg border bg-muted p-8 text-center">
    <Activity className="mx-auto mb-4 size-12 text-muted-foreground/60" />
    <h2 className="mb-2 text-lg font-medium">데이터가 없습니다</h2>
    <p className="mb-4 text-sm text-muted-foreground">
      세션의 TSS와 PMC를 계산하려면 `pnpm db:sync --tss`를 실행하세요.
    </p>
    <Link
      href="/settings"
      className="inline-flex items-center justify-center rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-foreground/90"
    >
      설정으로 이동
    </Link>
  </div>
)
