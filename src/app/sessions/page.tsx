import { EmptyState } from '@astryxdesign/core/EmptyState'
import { getAllSessions } from '@/lib/sessions'
import { SessionsTable } from '@/components/sessions-table/sessions-table'

export default function SessionsPage(): React.ReactElement {
  const sessions = getAllSessions()

  return (
    <div className="p-4 lg:p-6">
      <h1 hidden>세션</h1>
      {sessions.length === 0 ? (
        <EmptyState
          headingLevel={2}
          title="세션이 없습니다"
          description="data/ 폴더에 FIT 파일을 넣고 `pnpm analyze`를 실행하세요"
        />
      ) : (
        <SessionsTable sessions={sessions} />
      )}
    </div>
  )
}
