import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getSession, getAllSessionIds } from '@/lib/sessions'
import { getZone, toBakkenZones } from '@/lib/hr-zones'
import { getSettings } from '@/lib/settings'
import { getLatestLT2ForEnvironment } from '@/../lib/db'
import { detectEnvironment, compareLT2, formatPaceFromSeconds } from '@/lib/lt2-comparison'

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

  const env = detectEnvironment(session.metadata)
  const lt2Benchmark = env ? await getLatestLT2ForEnvironment(env) : null
  const lt2Comparison = lt2Benchmark ? compareLT2(session.summary.avgPace, lt2Benchmark) : null

  return (
    <div className="p-4">
      <div className="flex items-center justify-between">
        <Link href="/sessions" className="text-blue underline">
          ← 돌아가기
        </Link>
        <Link
          href={`/sessions/${id}/edit`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          메타데이터 편집
        </Link>
      </div>

      <h1 className="mt-4 text-2xl font-bold">
        {session.summary.distance}km {session.metadata?.type || 'Run'}
      </h1>
      <p className="text-muted-foreground">
        {formatDate(session.date)} · {formatTime(session.startTime)}
      </p>

      {/* 요약 */}
      <section className="mt-6">
        <h2 className="mb-2 text-lg font-semibold">요약</h2>
        <table className="w-full border-collapse text-sm">
          <tbody>
            <tr className="border-b">
              <td className="p-2 text-muted-foreground">거리</td>
              <td className="p-2 text-right">{session.summary.distance} km</td>
            </tr>
            <tr className="border-b">
              <td className="p-2 text-muted-foreground">시간</td>
              <td className="p-2 text-right">{session.summary.duration}</td>
            </tr>
            <tr className="border-b">
              <td className="p-2 text-muted-foreground">평균 페이스</td>
              <td className="p-2 text-right">{session.summary.avgPace} /km</td>
            </tr>
            <tr className="border-b">
              <td className="p-2 text-muted-foreground">평균 / 최대 심박</td>
              <td className="p-2 text-right text-red">
                {session.summary.avgHeartRate} / {session.summary.maxHeartRate} bpm
              </td>
            </tr>
            {session.summary.avgCadence && (
              <tr className="border-b">
                <td className="p-2 text-muted-foreground">케이던스</td>
                <td className="p-2 text-right">{session.summary.avgCadence} spm</td>
              </tr>
            )}
            {session.summary.calories && (
              <tr className="border-b">
                <td className="p-2 text-muted-foreground">칼로리</td>
                <td className="p-2 text-right">{session.summary.calories} kcal</td>
              </tr>
            )}
            {showElevation && (
              <tr className="border-b">
                <td className="p-2 text-muted-foreground">고도</td>
                <td className="p-2 text-right">
                  +{session.elevation.totalAscent}m / -{session.elevation.totalDescent}m
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      {/* LT2 Comparison */}
      {lt2Comparison && (
        <section className="mt-6">
          <h2 className="mb-2 text-lg font-semibold">LT2 페이스 비교</h2>
          <table className="w-full border-collapse text-sm">
            <tbody>
              <tr className="border-b">
                <td className="p-2 text-muted-foreground">환경</td>
                <td className="p-2 text-right">{lt2Benchmark!.environment}</td>
              </tr>
              <tr className="border-b">
                <td className="p-2 text-muted-foreground">LT2 기준</td>
                <td className="p-2 text-right tabular-nums">
                  {formatPaceFromSeconds(lt2Comparison.benchmarkPace)}/km
                </td>
              </tr>
              <tr className="border-b">
                <td className="p-2 text-muted-foreground">실제 평균</td>
                <td className="p-2 text-right tabular-nums">
                  {formatPaceFromSeconds(lt2Comparison.actualPace)}/km
                </td>
              </tr>
              <tr className="border-b">
                <td className="p-2 text-muted-foreground">차이</td>
                <td
                  className={`p-2 text-right tabular-nums ${lt2Comparison.improved ? 'text-green' : 'text-red'}`}
                >
                  {lt2Comparison.improved ? '' : '+'}
                  {-lt2Comparison.diffSeconds}초{lt2Comparison.improved ? ' (개선)' : ' (저하)'}
                </td>
              </tr>
            </tbody>
          </table>
          <p className="mt-2 text-xs text-muted-foreground">
            기준일: {lt2Benchmark!.date}
            {lt2Benchmark!.notes ? ` · ${lt2Benchmark!.notes}` : ''}
          </p>
        </section>
      )}

      {/* Laps */}
      {session.laps.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-2 text-lg font-semibold">랩</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b">
                  <th className="p-2 text-left text-muted-foreground">km</th>
                  <th className="p-2 text-right text-muted-foreground">페이스</th>
                  <th className="p-2 text-right text-muted-foreground">HR</th>
                  <th className="p-2 text-right text-muted-foreground">존</th>
                  {session.laps[0].cadence && (
                    <th className="p-2 text-right text-muted-foreground">케이던스</th>
                  )}
                  {showElevation && <th className="p-2 text-right text-muted-foreground">고도</th>}
                </tr>
              </thead>
              <tbody>
                {session.laps.map((lap) => (
                  <tr key={lap.km} className="border-b">
                    <td className="p-2">{lap.km}</td>
                    <td className="p-2 text-right">{lap.paceFormatted}</td>
                    <td className="p-2 text-right text-red">{lap.heartRate}</td>
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

      {/* 스플릿 & 일관성 */}
      <section className="mt-6">
        <h2 className="mb-2 text-lg font-semibold">스플릿 & 일관성</h2>
        <table className="w-full border-collapse text-sm">
          <tbody>
            <tr className="border-b">
              <td className="p-2 text-muted-foreground">전반 페이스</td>
              <td className="p-2 text-right">{session.splits.firstHalfPace}</td>
            </tr>
            <tr className="border-b">
              <td className="p-2 text-muted-foreground">후반 페이스</td>
              <td className="p-2 text-right">{session.splits.secondHalfPace}</td>
            </tr>
            <tr className="border-b">
              <td className="p-2 text-muted-foreground">스플릿 유형</td>
              <td className="p-2 text-right">
                <span className={session.splits.type === 'negative' ? 'text-green' : 'text-orange'}>
                  {session.splits.type} ({session.splits.type === 'negative' ? '' : '+'}
                  {session.splits.diffSeconds}s)
                </span>
              </td>
            </tr>
            <tr className="border-b">
              <td className="p-2 text-muted-foreground">변동계수 (CV)</td>
              <td className="p-2 text-right">{session.consistency.cv}%</td>
            </tr>
            <tr className="border-b">
              <td className="p-2 text-muted-foreground">표준편차</td>
              <td className="p-2 text-right">{session.consistency.stdDevSeconds}s</td>
            </tr>
            <tr className="border-b">
              <td className="p-2 text-muted-foreground">평가</td>
              <td className="p-2 text-right">
                <span
                  className={
                    session.consistency.rating === 'excellent'
                      ? 'text-green'
                      : session.consistency.rating === 'good'
                        ? 'text-cyan'
                        : 'text-orange'
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
          <h2 className="mb-2 text-lg font-semibold">심박수</h2>
          <table className="w-full border-collapse text-sm">
            <tbody>
              <tr className="border-b">
                <td className="p-2 text-muted-foreground">평균</td>
                <td className="p-2 text-right text-red">{session.heartRate.avgHeartRate} bpm</td>
              </tr>
              <tr className="border-b">
                <td className="p-2 text-muted-foreground">최저</td>
                <td className="p-2 text-right">{session.heartRate.minHeartRate} bpm</td>
              </tr>
              <tr className="border-b">
                <td className="p-2 text-muted-foreground">최대</td>
                <td className="p-2 text-right">{session.heartRate.maxHeartRate} bpm</td>
              </tr>
              <tr className="border-b">
                <td className="p-2 text-muted-foreground">드리프트</td>
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
          <h2 className="mb-2 text-lg font-semibold">HR 존 분포</h2>
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
                <th className="p-2 text-left text-muted-foreground">존</th>
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
          <div className="mt-4">
            <h3 className="mb-2 text-sm font-medium text-muted-foreground">Bakken 3-Zone 요약</h3>
            {(() => {
              const b = toBakkenZones(session.zoneDistribution)
              return (
                <div className="flex gap-4 text-sm">
                  <span>
                    이지 <strong>{b.easy.pct}%</strong>
                  </span>
                  <span>
                    역치 <strong className="text-orange">{b.threshold.pct}%</strong>
                  </span>
                  <span>
                    수프라 <strong className="text-red">{b.supra.pct}%</strong>
                  </span>
                </div>
              )
            })()}
          </div>
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
          <h2 className="mb-2 text-lg font-semibold">인터벌</h2>
          <table className="w-full border-collapse text-sm">
            <tbody>
              <tr className="border-b">
                <td className="p-2 text-muted-foreground">구성</td>
                <td className="p-2 text-right">{session.intervals.structure}</td>
              </tr>
              <tr className="border-b">
                <td className="p-2 text-muted-foreground">세트</td>
                <td className="p-2 text-right">
                  {session.intervals.totalSets}/{session.intervals.targetSets}
                  {session.intervals.completed ? ' (완료)' : ''}
                </td>
              </tr>
              <tr className="border-b">
                <td className="p-2 text-muted-foreground">운동 평균 심박</td>
                <td className="p-2 text-right">{session.intervals.summary.avgWorkHR || '-'}</td>
              </tr>
              <tr className="border-b">
                <td className="p-2 text-muted-foreground">휴식 평균 심박</td>
                <td className="p-2 text-right">{session.intervals.summary.avgRestHR || '-'}</td>
              </tr>
              <tr className="border-b">
                <td className="p-2 text-muted-foreground">심박 회복량</td>
                <td className="p-2 text-right">
                  {session.intervals.summary.hrRecovery
                    ? `${session.intervals.summary.hrRecovery} bpm`
                    : '-'}
                </td>
              </tr>
              {session.intervals.summary.hrDriftAcrossSets != null && (
                <tr className="border-b">
                  <td className="p-2 text-muted-foreground">세트간 HR 드리프트</td>
                  <td
                    className={`p-2 text-right ${session.intervals.summary.hrDriftAcrossSets > 5 ? 'text-orange' : 'text-muted-foreground'}`}
                  >
                    {session.intervals.summary.hrDriftAcrossSets > 0 ? '+' : ''}
                    {session.intervals.summary.hrDriftAcrossSets} bpm
                    {session.intervals.summary.hrDriftAcrossSets > 5 ? ' (주의)' : ''}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      )}

      {/* Session Info */}
      {session.metadata && (
        <section className="mt-6">
          <h2 className="mb-2 text-lg font-semibold">세션 정보</h2>
          <table className="w-full border-collapse text-sm">
            <tbody>
              {session.metadata.location && (
                <tr className="border-b">
                  <td className="p-2 text-muted-foreground">장소</td>
                  <td className="p-2 text-right">{session.metadata.location}</td>
                </tr>
              )}
              {session.metadata.intent && (
                <tr className="border-b">
                  <td className="p-2 text-muted-foreground">훈련 의도</td>
                  <td className="p-2 text-right">{session.metadata.intent}</td>
                </tr>
              )}
              {session.metadata.rpe && (
                <tr className="border-b">
                  <td className="p-2 text-muted-foreground">주관적 강도 (RPE)</td>
                  <td className="p-2 text-right">{session.metadata.rpe}/10</td>
                </tr>
              )}
              {session.metadata.sleepQuality && (
                <tr className="border-b">
                  <td className="p-2 text-muted-foreground">수면</td>
                  <td className="p-2 text-right">{session.metadata.sleepQuality}</td>
                </tr>
              )}
              {session.metadata.weather && (
                <tr className="border-b">
                  <td className="p-2 text-muted-foreground">날씨</td>
                  <td className="p-2 text-right">
                    {session.metadata.weather.condition}, {session.metadata.weather.temperature}°C,{' '}
                    {session.metadata.weather.humidity}%
                  </td>
                </tr>
              )}
              {session.metadata.notes && (
                <tr className="border-b">
                  <td className="p-2 text-muted-foreground">메모</td>
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
          <h2 className="mb-2 text-lg font-semibold">코칭 피드백</h2>
          <pre className="whitespace-pre-wrap rounded bg-muted p-4 text-sm">{session.feedback}</pre>
        </section>
      )}
    </div>
  )
}
