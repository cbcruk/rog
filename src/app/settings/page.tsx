import { Card } from '@astryxdesign/core/Card'
import { Heading } from '@astryxdesign/core/Heading'
import { Markdown } from '@astryxdesign/core/Markdown'
import { Text } from '@astryxdesign/core/Text'
import { SettingsForm } from '@/components/settings-form/settings-form'
import { LT2Benchmarks } from '@/components/settings-form/lt2-benchmarks'
import { getSettings } from '@/lib/settings'
import { getLT2Benchmarks } from '@/../lib/db'

export const dynamic = 'force-dynamic'

const TSS_EXPLAINER = [
  '**hrTSS** = 운동 시간(시) × IF² × 100',
  '',
  '**강도 계수 (IF)** = (평균 심박수 − 안정 심박수) / (LTHR − 안정 심박수)',
  '',
  'TSS는 훈련 부하를 측정하는 지표입니다. 100은 역치 강도로 1시간 운동한 것에 해당합니다.',
].join('\n')

function SettingsSection({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: React.ReactNode
}): React.ReactElement {
  return (
    <Card padding={6}>
      <div className="mb-6 flex flex-col gap-2">
        <Heading level={2}>{title}</Heading>
        {description && (
          <Text color="secondary" display="block">
            {description}
          </Text>
        )}
      </div>
      {children}
    </Card>
  )
}

export default async function SettingsPage(): Promise<React.ReactElement> {
  const [settings, benchmarks] = await Promise.all([getSettings(), getLT2Benchmarks()])

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <h1 hidden>설정</h1>

      <SettingsSection
        title="훈련 구간 설정"
        description="정확한 TSS 계산을 위해 심박수 구간과 역치 값을 설정하세요."
      >
        <SettingsForm settings={settings} />
      </SettingsSection>

      <SettingsSection
        title="환경별 LT2 페이스"
        description="환경별 역치 페이스를 기록하면 세션 분석에서 실제 페이스와 비교합니다."
      >
        <LT2Benchmarks benchmarks={benchmarks} />
      </SettingsSection>

      <SettingsSection title="TSS 계산 방법">
        <Markdown density="compact" contentWidth="100%">
          {TSS_EXPLAINER}
        </Markdown>
      </SettingsSection>
    </div>
  )
}
