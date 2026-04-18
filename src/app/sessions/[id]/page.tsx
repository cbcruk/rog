import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getSession, getAllSessionIds } from '@/lib/sessions'
import { getZone } from '@/lib/hr-zones'
import { getSettings } from '@/lib/settings'

export async function generateStaticParams(): Promise<{ id: string }[]> {
  const ids = getAllSessionIds()
  return ids.map((id) => ({ id }))
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  })
}

function formatTime(isoStr: string): string {
  const date = new Date(isoStr)
  return date.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default async function SessionPage({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<React.ReactElement> {
  const { id } = await params
  const [session, settings] = await Promise.all([Promise.resolve(getSession(id)), getSettings()])

  if (!session) {
    notFound()
  }

  const showElevation = session.elevation.totalAscent > 0
  const lthr = settings.lthr

  return (
    <div className="p-4">
      <Link href="/sessions" className="text-(--blue) underline">
        ← Back
      </Link>

      <h1 className="mt-4 text-2xl font-bold">
        {session.summary.distance}km {session.metadata?.type || 'Run'}
      </h1>
      <p className="text-muted-foreground">
        {formatDate(session.date)} · {formatTime(session.startTime)}
      </p>

      {/* Summary */}
      <section className="mt-6">
        <h2 className="mb-2 text-lg font-semibold">Summary</h2>
        <table className="w-full border-collapse text-sm">
          <tbody>
            <tr className="border-b">
              <td className="p-2 text-muted-foreground">Distance</td>
              <td className="p-2 text-right">{session.summary.distance} km</td>
            </tr>
            <tr className="border-b">
              <td className="p-2 text-muted-foreground">Duration</td>
              <td className="p-2 text-right">{session.summary.duration}</td>
            </tr>
            <tr className="border-b">
              <td className="p-2 text-muted-foreground">Avg Pace</td>
              <td className="p-2 text-right">{session.summary.avgPace} /km</td>
            </tr>
            <tr className="border-b">
              <td className="p-2 text-muted-foreground">Avg HR / Max HR</td>
              <td className="p-2 text-right text-(--red)">
                {session.summary.avgHeartRate} / {session.summary.maxHeartRate} bpm
              </td>
            </tr>
            {session.summary.avgCadence && (
              <tr className="border-b">
                <td className="p-2 text-muted-foreground">Cadence</td>
                <td className="p-2 text-right">{session.summary.avgCadence} spm</td>
              </tr>
            )}
            {session.summary.calories && (
              <tr className="border-b">
                <td className="p-2 text-muted-foreground">Calories</td>
                <td className="p-2 text-right">{session.summary.calories} kcal</td>
              </tr>
            )}
            {showElevation && (
              <tr className="border-b">
                <td className="p-2 text-muted-foreground">Elevation</td>
                <td className="p-2 text-right">
                  +{session.elevation.totalAscent}m / -{session.elevation.totalDescent}m
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      {/* Laps */}
      {session.laps.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-2 text-lg font-semibold">Laps</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b">
                  <th className="p-2 text-left text-muted-foreground">km</th>
                  <th className="p-2 text-right text-muted-foreground">Pace</th>
                  <th className="p-2 text-right text-muted-foreground">HR</th>
                  <th className="p-2 text-right text-muted-foreground">Zone</th>
                  {session.laps[0].cadence && (
                    <th className="p-2 text-right text-muted-foreground">Cadence</th>
                  )}
                  {showElevation && <th className="p-2 text-right text-muted-foreground">Elev</th>}
                </tr>
              </thead>
              <tbody>
                {session.laps.map((lap) => (
                  <tr key={lap.km} className="border-b">
                    <td className="p-2">{lap.km}</td>
                    <td className="p-2 text-right">{lap.paceFormatted}</td>
                    <td className="p-2 text-right text-(--red)">{lap.heartRate}</td>
                    <td className="p-2 text-right text-muted-foreground">
                      Z{getZone(lap.heartRate, lthr)}
                    </td>
                    {lap.cadence && <td className="p-2 text-right">{lap.cadence}</td>}
                    {showElevation && (
                      <td className="p-2 text-right">
                        +{lap.ascent}/-{lap.descent}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Splits & Consistency */}
      <section className="mt-6">
        <h2 className="mb-2 text-lg font-semibold">Splits & Consistency</h2>
        <table className="w-full border-collapse text-sm">
          <tbody>
            <tr className="border-b">
              <td className="p-2 text-muted-foreground">1st Half Pace</td>
              <td className="p-2 text-right">{session.splits.firstHalfPace}</td>
            </tr>
            <tr className="border-b">
              <td className="p-2 text-muted-foreground">2nd Half Pace</td>
              <td className="p-2 text-right">{session.splits.secondHalfPace}</td>
            </tr>
            <tr className="border-b">
              <td className="p-2 text-muted-foreground">Split Type</td>
              <td className="p-2 text-right">
                <span
                  className={
                    session.splits.type === 'negative' ? 'text-(--green)' : 'text-(--orange)'
                  }
                >
                  {session.splits.type} ({session.splits.type === 'negative' ? '' : '+'}
                  {session.splits.diffSeconds}s)
                </span>
              </td>
            </tr>
            <tr className="border-b">
              <td className="p-2 text-muted-foreground">CV</td>
              <td className="p-2 text-right">{session.consistency.cv}%</td>
            </tr>
            <tr className="border-b">
              <td className="p-2 text-muted-foreground">Std Dev</td>
              <td className="p-2 text-right">{session.consistency.stdDevSeconds}s</td>
            </tr>
            <tr className="border-b">
              <td className="p-2 text-muted-foreground">Rating</td>
              <td className="p-2 text-right">
                <span
                  className={
                    session.consistency.rating === 'excellent'
                      ? 'text-(--green)'
                      : session.consistency.rating === 'good'
                        ? 'text-(--cyan)'
                        : 'text-(--orange)'
                  }
                >
                  {session.consistency.rating}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* Heart Rate */}
      {session.heartRate && (
        <section className="mt-6">
          <h2 className="mb-2 text-lg font-semibold">Heart Rate</h2>
          <table className="w-full border-collapse text-sm">
            <tbody>
              <tr className="border-b">
                <td className="p-2 text-muted-foreground">Avg</td>
                <td className="p-2 text-right text-(--red)">
                  {session.heartRate.avgHeartRate} bpm
                </td>
              </tr>
              <tr className="border-b">
                <td className="p-2 text-muted-foreground">Min</td>
                <td className="p-2 text-right">{session.heartRate.minHeartRate} bpm</td>
              </tr>
              <tr className="border-b">
                <td className="p-2 text-muted-foreground">Max</td>
                <td className="p-2 text-right">{session.heartRate.maxHeartRate} bpm</td>
              </tr>
              <tr className="border-b">
                <td className="p-2 text-muted-foreground">Drift</td>
                <td className="p-2 text-right">
                  {session.heartRate.drift > 0 ? '+' : ''}
                  {session.heartRate.drift}%
                </td>
              </tr>
            </tbody>
          </table>
        </section>
      )}

      {/* Zone Distribution */}
      {session.zoneDistribution && (
        <section className="mt-6">
          <h2 className="mb-2 text-lg font-semibold">HR Zone Distribution</h2>
          <div className="mb-3 flex h-4 overflow-hidden rounded-full">
            {[
              { zone: session.zoneDistribution.z1, color: 'bg-blue/60', label: 'Z1' },
              { zone: session.zoneDistribution.z2, color: 'bg-green', label: 'Z2' },
              { zone: session.zoneDistribution.z3, color: 'bg-yellow', label: 'Z3' },
              { zone: session.zoneDistribution.z4, color: 'bg-orange', label: 'Z4' },
              { zone: session.zoneDistribution.z5, color: 'bg-red', label: 'Z5' },
            ].map(
              ({ zone, color, label }) =>
                zone.pct > 0 && (
                  <div
                    key={label}
                    className={`${color} flex items-center justify-center text-[10px] font-medium text-background`}
                    style={{ width: `${zone.pct}%` }}
                  >
                    {zone.pct >= 8 ? `${label} ${zone.pct}%` : ''}
                  </div>
                ),
            )}
          </div>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b">
                <th className="p-2 text-left text-muted-foreground">Zone</th>
                <th className="p-2 text-right text-muted-foreground">시간</th>
                <th className="p-2 text-right text-muted-foreground">비율</th>
              </tr>
            </thead>
            <tbody>
              {[
                { label: 'Z1 (회복)', z: session.zoneDistribution.z1 },
                { label: 'Z2 (유산소)', z: session.zoneDistribution.z2 },
                { label: 'Z3 (템포)', z: session.zoneDistribution.z3 },
                { label: 'Z4 (역치)', z: session.zoneDistribution.z4 },
                { label: 'Z5 (VO2max)', z: session.zoneDistribution.z5 },
              ].map(({ label, z }) => (
                <tr key={label} className="border-b">
                  <td className="p-2">{label}</td>
                  <td className="p-2 text-right">
                    {Math.floor(z.seconds / 60)}:{String(z.seconds % 60).padStart(2, '0')}
                  </td>
                  <td className="p-2 text-right">{z.pct}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* Session Quality */}
      {session.quality && (
        <section className="mt-6">
          <h2 className="mb-2 text-lg font-semibold">
            세션 품질{' '}
            <span
              className={
                session.quality.grade === 'pass'
                  ? 'text-green'
                  : session.quality.grade === 'partial'
                    ? 'text-yellow'
                    : 'text-red'
              }
            >
              {session.quality.grade === 'pass'
                ? '✓ 달성'
                : session.quality.grade === 'partial'
                  ? '△ 부분 달성'
                  : '✗ 미달성'}
            </span>
          </h2>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b">
                <th className="p-2 text-left text-muted-foreground">기준</th>
                <th className="p-2 text-right text-muted-foreground">실제</th>
                <th className="p-2 text-right text-muted-foreground">목표</th>
                <th className="p-2 text-right text-muted-foreground">결과</th>
              </tr>
            </thead>
            <tbody>
              {session.quality.criteria.map((c) => (
                <tr key={c.label} className="border-b">
                  <td className="p-2">{c.label}</td>
                  <td className="p-2 text-right">{c.actual}</td>
                  <td className="p-2 text-right text-muted-foreground">{c.target}</td>
                  <td className={`p-2 text-right ${c.passed ? 'text-green' : 'text-red'}`}>
                    {c.passed ? '✓' : '✗'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* Intervals */}
      {session.intervals && (
        <section className="mt-6">
          <h2 className="mb-2 text-lg font-semibold">Intervals</h2>
          <table className="w-full border-collapse text-sm">
            <tbody>
              <tr className="border-b">
                <td className="p-2 text-muted-foreground">Structure</td>
                <td className="p-2 text-right">{session.intervals.structure}</td>
              </tr>
              <tr className="border-b">
                <td className="p-2 text-muted-foreground">Sets</td>
                <td className="p-2 text-right">
                  {session.intervals.totalSets}/{session.intervals.targetSets}
                  {session.intervals.completed ? ' (completed)' : ''}
                </td>
              </tr>
              <tr className="border-b">
                <td className="p-2 text-muted-foreground">Avg Work HR</td>
                <td className="p-2 text-right">{session.intervals.summary.avgWorkHR || '-'}</td>
              </tr>
              <tr className="border-b">
                <td className="p-2 text-muted-foreground">Avg Rest HR</td>
                <td className="p-2 text-right">{session.intervals.summary.avgRestHR || '-'}</td>
              </tr>
              <tr className="border-b">
                <td className="p-2 text-muted-foreground">HR Recovery</td>
                <td className="p-2 text-right">
                  {session.intervals.summary.hrRecovery
                    ? `${session.intervals.summary.hrRecovery} bpm`
                    : '-'}
                </td>
              </tr>
            </tbody>
          </table>
        </section>
      )}

      {/* Session Info */}
      {session.metadata && (
        <section className="mt-6">
          <h2 className="mb-2 text-lg font-semibold">Session Info</h2>
          <table className="w-full border-collapse text-sm">
            <tbody>
              {session.metadata.location && (
                <tr className="border-b">
                  <td className="p-2 text-muted-foreground">Location</td>
                  <td className="p-2 text-right">{session.metadata.location}</td>
                </tr>
              )}
              {session.metadata.intent && (
                <tr className="border-b">
                  <td className="p-2 text-muted-foreground">Intent</td>
                  <td className="p-2 text-right">{session.metadata.intent}</td>
                </tr>
              )}
              {session.metadata.rpe && (
                <tr className="border-b">
                  <td className="p-2 text-muted-foreground">RPE</td>
                  <td className="p-2 text-right">{session.metadata.rpe}/10</td>
                </tr>
              )}
              {session.metadata.sleepQuality && (
                <tr className="border-b">
                  <td className="p-2 text-muted-foreground">Sleep</td>
                  <td className="p-2 text-right">{session.metadata.sleepQuality}</td>
                </tr>
              )}
              {session.metadata.weather && (
                <tr className="border-b">
                  <td className="p-2 text-muted-foreground">Weather</td>
                  <td className="p-2 text-right">
                    {session.metadata.weather.condition}, {session.metadata.weather.temperature}°C,{' '}
                    {session.metadata.weather.humidity}%
                  </td>
                </tr>
              )}
              {session.metadata.notes && (
                <tr className="border-b">
                  <td className="p-2 text-muted-foreground">Notes</td>
                  <td className="p-2 text-right">{session.metadata.notes}</td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      )}

      {/* Feedback */}
      {session.feedback && (
        <section className="mt-6">
          <h2 className="mb-2 text-lg font-semibold">Coaching Feedback</h2>
          <pre className="whitespace-pre-wrap rounded bg-muted p-4 text-sm">{session.feedback}</pre>
        </section>
      )}
    </div>
  )
}
