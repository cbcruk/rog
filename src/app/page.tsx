import Link from 'next/link'
import { getAllSessions } from '@/lib/sessions'
import type { SessionWithFeedback } from '@/types/running'

function getSessionTypeLabel(session: SessionWithFeedback): string {
  if (session.metadata?.type) {
    const typeMap: Record<string, string> = {
      threshold_interval: 'Threshold',
      tempo: 'Tempo',
      easy: 'Easy',
      long_run: 'Long Run',
      progression: 'Progression',
      trail: 'Trail',
      recovery: 'Recovery',
    }
    return typeMap[session.metadata.type] || session.metadata.type
  }

  if (session.summary.avgHeartRate < 140) return 'Easy'
  if (session.summary.avgHeartRate < 150) return 'Moderate'
  return 'Hard'
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('ko-KR', {
    month: '2-digit',
    day: '2-digit',
  })
}

export default function Home(): React.ReactElement {
  const sessions = getAllSessions()

  return (
    <div className="p-4">
      <h1 className="mb-4 text-2xl font-bold">Running Log</h1>

      {sessions.length === 0 ? (
        <p className="text-(--tx-2)">No sessions found</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-(--ui)">
                <th className="p-2 text-left text-(--tx-2)">Date</th>
                <th className="p-2 text-left text-(--tx-2)">Type</th>
                <th className="p-2 text-right text-(--tx-2)">Dist</th>
                <th className="p-2 text-right text-(--tx-2)">Time</th>
                <th className="p-2 text-right text-(--tx-2)">Pace</th>
                <th className="p-2 text-right text-(--tx-2)">HR</th>
                <th className="p-2 text-right text-(--tx-2)">Split</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((session) => (
                <tr key={session.id} className="border-b border-(--ui)">
                  <td className="p-2">
                    <Link href={`/session/${session.id}`} className="text-(--blue) underline">
                      {formatDate(session.date)}
                    </Link>
                  </td>
                  <td className="p-2">{getSessionTypeLabel(session)}</td>
                  <td className="p-2 text-right">{session.summary.distance}km</td>
                  <td className="p-2 text-right">{session.summary.duration}</td>
                  <td className="p-2 text-right">{session.summary.avgPace}</td>
                  <td className="p-2 text-right">
                    {session.summary.avgHeartRate}/{session.summary.maxHeartRate}
                  </td>
                  <td className="p-2 text-right">
                    <span className={session.splits.type === 'negative' ? 'text-(--green)' : 'text-(--orange)'}>
                      {session.splits.type === 'negative' ? '-' : '+'}
                      {Math.abs(session.splits.diffSeconds)}s
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
