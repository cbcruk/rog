import { getAllSessions } from '@/lib/sessions'
import { SessionsTable } from '@/components/sessions-table'

export default function Home(): React.ReactElement {
  const sessions = getAllSessions()

  return (
    <div className="p-4 lg:p-6">
      <h1 className="mb-6 text-xl font-bold">Sessions</h1>

      {sessions.length === 0 ? (
        <div className="rounded-lg border bg-muted p-8 text-center">
          <p className="text-muted-foreground">세션이 없습니다</p>
          <p className="mt-2 text-sm text-muted-foreground/60">
            data/ 폴더에 FIT 파일을 넣고 `pnpm analyze`를 실행하세요
          </p>
        </div>
      ) : (
        <SessionsTable sessions={sessions} />
      )}
    </div>
  )
}
