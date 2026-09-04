import { notFound } from 'next/navigation'
import { Badge } from '@astryxdesign/core/Badge'
import { Card } from '@astryxdesign/core/Card'
import { Heading } from '@astryxdesign/core/Heading'
import { Link as AstryxLink } from '@astryxdesign/core/Link'
import { MetadataList, MetadataListItem } from '@astryxdesign/core/MetadataList'
import { Table, proportional } from '@astryxdesign/core/Table'
import { Text } from '@astryxdesign/core/Text'
import { getSession, getAllSessionIds } from '@/lib/sessions'
import { getZone, toBakkenZones } from '@/lib/hr-zones'
import { getSettings } from '@/lib/settings'
import { getLatestLT2ForEnvironment } from '@/../lib/db'
import { detectEnvironment, compareLT2, formatPaceFromSeconds } from '@/lib/lt2-comparison'
import { SessionFeedback } from '@/components/session-feedback/session-feedback'
import type { ZoneDistribution } from '@/lib/hr-zones'
import type { Lap } from '@/types/running'

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

function Section({
  title,
  children,
}: {
  title: React.ReactNode
  children: React.ReactNode
}): React.ReactElement {
  return (
    <section className="mt-6 flex flex-col gap-2">
      <Heading level={2}>{title}</Heading>
      {children}
    </section>
  )
}

function Numeric({ children }: { children: React.ReactNode }): React.ReactElement {
  return <Text hasTabularNumbers>{children}</Text>
}

/** HR 존별 색. 강도가 올라갈수록 파랑 → 빨강으로 이동한다. */
const ZONE_COLOR = [
  'var(--color-data-categorical-blue)',
  'var(--color-data-categorical-green)',
  'var(--color-data-categorical-brown)',
  'var(--color-data-categorical-orange)',
  'var(--color-data-categorical-red)',
]

interface LapRow extends Record<string, unknown> {
  km: number
  paceFormatted: string
  heartRate: number
  zone: string
  cadence: number | null
  elevation: string
}

interface ZoneRow extends Record<string, unknown> {
  label: string
  time: string
  pct: string
}

interface CriterionRow extends Record<string, unknown> {
  label: string
  actual: string
  target: string
  result: string
  passed: boolean
}

function buildLapColumns(hasCadence: boolean, showElevation: boolean) {
  return [
    { key: 'km', header: 'km', width: proportional(1) },
    { key: 'paceFormatted', header: '페이스', align: 'end' as const, width: proportional(1) },
    { key: 'heartRate', header: 'HR', align: 'end' as const, width: proportional(1) },
    { key: 'zone', header: '존', align: 'end' as const, width: proportional(1) },
    ...(hasCadence
      ? [{ key: 'cadence', header: '케이던스', align: 'end' as const, width: proportional(1) }]
      : []),
    ...(showElevation
      ? [{ key: 'elevation', header: '고도', align: 'end' as const, width: proportional(1) }]
      : []),
  ]
}

const ZONE_COLUMNS = [
  { key: 'label', header: '존', width: proportional(2) },
  { key: 'time', header: '시간', align: 'end' as const, width: proportional(1) },
  { key: 'pct', header: '비율', align: 'end' as const, width: proportional(1) },
]

const CRITERION_COLUMNS = [
  { key: 'label', header: '기준', width: proportional(2) },
  { key: 'actual', header: '실제', align: 'end' as const, width: proportional(1) },
  { key: 'target', header: '목표', align: 'end' as const, width: proportional(1) },
  { key: 'result', header: '결과', align: 'end' as const, width: proportional(1) },
]

const QUALITY_GRADE = {
  pass: { label: '✓ 달성', variant: 'success' },
  partial: { label: '△ 부분 달성', variant: 'warning' },
  fail: { label: '✗ 미달성', variant: 'error' },
} as const

function toLapRow(lap: Lap, lthr: number, showElevation: boolean): LapRow {
  return {
    km: lap.km,
    paceFormatted: lap.paceFormatted,
    heartRate: lap.heartRate,
    zone: `Z${getZone(lap.heartRate, lthr)}`,
    cadence: lap.cadence,
    elevation: showElevation ? `+${lap.ascent}/-${lap.descent}` : '',
  }
}

function toZoneRows(zones: ZoneDistribution): ZoneRow[] {
  return [
    { label: 'Z1 (회복)', z: zones.z1 },
    { label: 'Z2 (유산소)', z: zones.z2 },
    { label: 'Z3 (템포)', z: zones.z3 },
    { label: 'Z4 (역치)', z: zones.z4 },
    { label: 'Z5 (VO2max)', z: zones.z5 },
  ].map(({ label, z }) => ({
    label,
    time: `${Math.floor(z.seconds / 60)}:${String(z.seconds % 60).padStart(2, '0')}`,
    pct: `${z.pct}%`,
  }))
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
    <div className="p-4 lg:p-6">
      <div className="flex items-center justify-between gap-2">
        <AstryxLink href="/sessions" isStandalone>
          ← 돌아가기
        </AstryxLink>
        <AstryxLink href={`/sessions/${id}/edit`} isStandalone color="secondary">
          메타데이터 편집
        </AstryxLink>
      </div>

      <div className="mt-4 flex flex-col gap-1">
        <Heading level={1}>
          {session.summary.distance}km {session.metadata?.type || 'Run'}
        </Heading>
        <Text color="secondary" display="block">
          {formatDate(session.date)} · {formatTime(session.startTime)}
        </Text>
      </div>

      <Section title="요약">
        <MetadataList>
          <MetadataListItem label="거리">
            <Numeric>{session.summary.distance} km</Numeric>
          </MetadataListItem>
          <MetadataListItem label="시간">
            <Numeric>{session.summary.duration}</Numeric>
          </MetadataListItem>
          <MetadataListItem label="평균 페이스">
            <Numeric>{session.summary.avgPace} /km</Numeric>
          </MetadataListItem>
          <MetadataListItem label="평균 / 최대 심박">
            <Numeric>
              {session.summary.avgHeartRate} / {session.summary.maxHeartRate} bpm
            </Numeric>
          </MetadataListItem>
          {session.summary.avgCadence ? (
            <MetadataListItem label="케이던스">
              <Numeric>{session.summary.avgCadence} spm</Numeric>
            </MetadataListItem>
          ) : null}
          {session.summary.calories ? (
            <MetadataListItem label="칼로리">
              <Numeric>{session.summary.calories} kcal</Numeric>
            </MetadataListItem>
          ) : null}
          {showElevation ? (
            <MetadataListItem label="고도">
              <Numeric>
                +{session.elevation.totalAscent}m / -{session.elevation.totalDescent}m
              </Numeric>
            </MetadataListItem>
          ) : null}
        </MetadataList>
      </Section>

      {lt2Comparison && lt2Benchmark && (
        <Section title="LT2 페이스 비교">
          <MetadataList>
            <MetadataListItem label="환경">{lt2Benchmark.environment}</MetadataListItem>
            <MetadataListItem label="LT2 기준">
              <Numeric>{formatPaceFromSeconds(lt2Comparison.benchmarkPace)}/km</Numeric>
            </MetadataListItem>
            <MetadataListItem label="실제 평균">
              <Numeric>{formatPaceFromSeconds(lt2Comparison.actualPace)}/km</Numeric>
            </MetadataListItem>
            <MetadataListItem label="차이">
              <Badge
                variant={lt2Comparison.improved ? 'green' : 'red'}
                label={`${lt2Comparison.improved ? '' : '+'}${-lt2Comparison.diffSeconds}초 ${
                  lt2Comparison.improved ? '(개선)' : '(저하)'
                }`}
              />
            </MetadataListItem>
          </MetadataList>
          <Text type="supporting" display="block">
            기준일: {lt2Benchmark.date}
            {lt2Benchmark.notes ? ` · ${lt2Benchmark.notes}` : ''}
          </Text>
        </Section>
      )}

      {session.laps.length > 0 && (
        <Section title="랩">
          <div className="overflow-x-auto">
            <Table<LapRow>
              data={session.laps.map((lap) => toLapRow(lap, lthr, showElevation))}
              columns={buildLapColumns(Boolean(session.laps[0].cadence), showElevation)}
              idKey="km"
              density="compact"
            />
          </div>
        </Section>
      )}

      <Section title="스플릿 & 일관성">
        <MetadataList>
          <MetadataListItem label="전반 페이스">
            <Numeric>{session.splits.firstHalfPace}</Numeric>
          </MetadataListItem>
          <MetadataListItem label="후반 페이스">
            <Numeric>{session.splits.secondHalfPace}</Numeric>
          </MetadataListItem>
          <MetadataListItem label="스플릿 유형">
            <Badge
              variant={session.splits.type === 'negative' ? 'green' : 'orange'}
              label={`${session.splits.type} (${
                session.splits.type === 'negative' ? '' : '+'
              }${session.splits.diffSeconds}s)`}
            />
          </MetadataListItem>
          <MetadataListItem label="변동계수 (CV)">
            <Numeric>{session.consistency.cv}%</Numeric>
          </MetadataListItem>
          <MetadataListItem label="표준편차">
            <Numeric>{session.consistency.stdDevSeconds}s</Numeric>
          </MetadataListItem>
          <MetadataListItem label="평가">
            <Badge
              variant={
                session.consistency.rating === 'excellent'
                  ? 'green'
                  : session.consistency.rating === 'good'
                    ? 'cyan'
                    : 'orange'
              }
              label={session.consistency.rating}
            />
          </MetadataListItem>
        </MetadataList>
      </Section>

      {session.heartRate && (
        <Section title="심박수">
          <MetadataList>
            <MetadataListItem label="평균">
              <Numeric>{session.heartRate.avgHeartRate} bpm</Numeric>
            </MetadataListItem>
            <MetadataListItem label="최저">
              <Numeric>{session.heartRate.minHeartRate} bpm</Numeric>
            </MetadataListItem>
            <MetadataListItem label="최대">
              <Numeric>{session.heartRate.maxHeartRate} bpm</Numeric>
            </MetadataListItem>
            <MetadataListItem label="드리프트">
              <Numeric>
                {session.heartRate.drift > 0 ? '+' : ''}
                {session.heartRate.drift}%
              </Numeric>
            </MetadataListItem>
          </MetadataList>
        </Section>
      )}

      {session.zoneDistribution && (
        <Section title="HR 존 분포">
          <div className="flex h-4 overflow-hidden rounded-full">
            {[
              session.zoneDistribution.z1,
              session.zoneDistribution.z2,
              session.zoneDistribution.z3,
              session.zoneDistribution.z4,
              session.zoneDistribution.z5,
            ].map(
              (zone, i) =>
                zone.pct > 0 && (
                  <div
                    key={i}
                    className="flex items-center justify-center"
                    style={{ width: `${zone.pct}%`, backgroundColor: ZONE_COLOR[i] }}
                  >
                    {zone.pct >= 8 && (
                      <Text size="xsm" weight="medium" style={{ color: 'var(--color-on-dark)' }}>
                        Z{i + 1} {zone.pct}%
                      </Text>
                    )}
                  </div>
                ),
            )}
          </div>
          <Table<ZoneRow>
            data={toZoneRows(session.zoneDistribution)}
            columns={ZONE_COLUMNS}
            idKey="label"
            density="compact"
          />
          <Card variant="muted" padding={3}>
            <Text type="label" display="block">
              Bakken 3-Zone 요약
            </Text>
            {(() => {
              const b = toBakkenZones(session.zoneDistribution)
              return (
                <div className="mt-2 flex flex-wrap gap-4">
                  <Text hasTabularNumbers>
                    LT1 이하 <Text weight="bold">{b.easy.pct}%</Text>
                  </Text>
                  <Text hasTabularNumbers>
                    LT1~LT2 <Text weight="bold">{b.threshold.pct}%</Text>
                  </Text>
                  <Text hasTabularNumbers>
                    LT2 초과 <Text weight="bold">{b.supra.pct}%</Text>
                  </Text>
                </div>
              )
            })()}
          </Card>
        </Section>
      )}

      {session.quality && (
        <Section
          title={
            <span className="flex items-center gap-2">
              세션 품질
              <Badge
                variant={QUALITY_GRADE[session.quality.grade].variant}
                label={QUALITY_GRADE[session.quality.grade].label}
              />
            </span>
          }
        >
          <Table<CriterionRow>
            data={session.quality.criteria.map((c) => ({
              label: c.label,
              actual: c.actual,
              target: c.target,
              result: c.passed ? '✓' : '✗',
              passed: c.passed,
            }))}
            columns={CRITERION_COLUMNS}
            idKey="label"
            density="compact"
          />
        </Section>
      )}

      {session.intervals && (
        <Section title="인터벌">
          <MetadataList>
            <MetadataListItem label="구성">{session.intervals.structure}</MetadataListItem>
            <MetadataListItem label="세트">
              <Numeric>
                {session.intervals.totalSets}/{session.intervals.targetSets}
                {session.intervals.completed ? ' (완료)' : ''}
              </Numeric>
            </MetadataListItem>
            <MetadataListItem label="운동 평균 심박">
              <Numeric>{session.intervals.summary.avgWorkHR || '-'}</Numeric>
            </MetadataListItem>
            <MetadataListItem label="휴식 평균 심박">
              <Numeric>{session.intervals.summary.avgRestHR || '-'}</Numeric>
            </MetadataListItem>
            <MetadataListItem label="심박 회복량">
              <Numeric>
                {session.intervals.summary.hrRecovery
                  ? `${session.intervals.summary.hrRecovery} bpm`
                  : '-'}
              </Numeric>
            </MetadataListItem>
            {session.intervals.summary.hrDriftAcrossSets != null ? (
              <MetadataListItem label="세트간 HR 드리프트">
                <Text
                  hasTabularNumbers
                  color={session.intervals.summary.hrDriftAcrossSets > 5 ? undefined : 'secondary'}
                  style={
                    session.intervals.summary.hrDriftAcrossSets > 5
                      ? { color: 'var(--color-warning)' }
                      : undefined
                  }
                >
                  {session.intervals.summary.hrDriftAcrossSets > 0 ? '+' : ''}
                  {session.intervals.summary.hrDriftAcrossSets} bpm
                  {session.intervals.summary.hrDriftAcrossSets > 5 ? ' (주의)' : ''}
                </Text>
              </MetadataListItem>
            ) : null}
          </MetadataList>
        </Section>
      )}

      {session.metadata && (
        <Section title="세션 정보">
          <MetadataList>
            {session.metadata.location ? (
              <MetadataListItem label="장소">{session.metadata.location}</MetadataListItem>
            ) : null}
            {session.metadata.intent ? (
              <MetadataListItem label="훈련 의도">{session.metadata.intent}</MetadataListItem>
            ) : null}
            {session.metadata.rpe ? (
              <MetadataListItem label="주관적 강도 (RPE)">
                <Numeric>{session.metadata.rpe}/10</Numeric>
              </MetadataListItem>
            ) : null}
            {session.metadata.sleepQuality ? (
              <MetadataListItem label="수면">{session.metadata.sleepQuality}</MetadataListItem>
            ) : null}
            {session.metadata.weather ? (
              <MetadataListItem label="날씨">
                {session.metadata.weather.condition}, {session.metadata.weather.temperature}°C,{' '}
                {session.metadata.weather.humidity}%
              </MetadataListItem>
            ) : null}
            {session.metadata.notes ? (
              <MetadataListItem label="메모">{session.metadata.notes}</MetadataListItem>
            ) : null}
          </MetadataList>
        </Section>
      )}

      <SessionFeedback feedback={session.feedback} sessionId={id} />
    </div>
  )
}
