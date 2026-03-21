import Link from 'next/link'
import { getAllSessions } from '@/lib/sessions'
import type { SessionWithFeedback } from '@/types/running'
import { metadata } from './layout'

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
      <h1 hidden className="mb-4 text-2xl font-bold">
        {metadata.title?.toString()}
      </h1>

      {sessions.length === 0 ? (
        <p className="text-(--tx-2)">세션이 없습니다</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-(--ui)">
                <th className="p-2 text-left text-(--tx-2)" title="세션 날짜">날짜</th>
                <th className="p-2 text-left text-(--tx-2)" title="훈련 유형 (Easy, Threshold, Long Run 등)">유형</th>
                <th className="p-2 text-right text-(--tx-2)" title="총 거리 (km)">거리</th>
                <th className="p-2 text-right text-(--tx-2)" title="총 소요 시간">시간</th>
                <th className="p-2 text-right text-(--tx-2)" title="평균 페이스 (분:초/km)">페이스</th>
                <th className="p-2 text-right text-(--tx-2)" title="평균/최대 심박수 (bpm)">심박</th>
                <th className="p-2 text-right text-(--tx-2)" title="전반부 vs 후반부 페이스 차이 (negative = 후반이 빠름)">스플릿</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((session) => (
                <tr key={session.id} className="border-b border-(--ui)">
                  <td className="p-2">
                    <Link
                      href={`/session/${session.id}`}
                      className="text-(--blue) underline"
                    >
                      {formatDate(session.date)}
                    </Link>
                  </td>
                  <td className="p-2">{getSessionTypeLabel(session)}</td>
                  <td className="p-2 text-right">
                    {session.summary.distance}km
                  </td>
                  <td className="p-2 text-right">{session.summary.duration}</td>
                  <td className="p-2 text-right">{session.summary.avgPace}</td>
                  <td className="p-2 text-right">
                    {session.summary.avgHeartRate}/
                    {session.summary.maxHeartRate}
                  </td>
                  <td className="p-2 text-right">
                    <span
                      className={
                        session.splits.type === 'negative'
                          ? 'text-(--green)'
                          : 'text-(--orange)'
                      }
                    >
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
