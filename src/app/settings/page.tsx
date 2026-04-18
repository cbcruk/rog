import { SettingsForm } from '@/components/settings-form/settings-form'
import { LT2Benchmarks } from '@/components/settings-form/lt2-benchmarks'
import { getSettings } from '@/lib/settings'
import { getLT2Benchmarks } from '@/../lib/db'

export const dynamic = 'force-dynamic'

export default async function SettingsPage(): Promise<React.ReactElement> {
  const [settings, benchmarks] = await Promise.all([getSettings(), getLT2Benchmarks()])

  return (
    <div className="p-4 lg:p-6">
      <h1 hidden className="mb-6 text-xl font-bold">
        설정
      </h1>

      <div className="rounded-lg border bg-muted p-6">
        <h2 className="mb-4 text-lg font-medium">훈련 구간 설정</h2>
        <p className="mb-6 text-sm text-muted-foreground">
          정확한 TSS 계산을 위해 심박수 구간과 역치 값을 설정하세요.
        </p>

        <SettingsForm settings={settings} />
      </div>

      <div className="mt-6 rounded-lg border bg-muted p-6">
        <h2 className="mb-4 text-lg font-medium">환경별 LT2 페이스</h2>
        <p className="mb-6 text-sm text-muted-foreground">
          환경별 역치 페이스를 기록하면 세션 분석에서 실제 페이스와 비교합니다.
        </p>
        <LT2Benchmarks benchmarks={benchmarks} />
      </div>

      <div className="mt-6 rounded-lg border bg-muted p-6">
        <h2 className="mb-4 text-lg font-medium">TSS 계산 방법</h2>
        <div className="space-y-3 text-sm text-muted-foreground">
          <p>
            <strong>hrTSS</strong> = 운동 시간(시) × IF² × 100
          </p>
          <p>
            <strong>강도 계수 (IF)</strong> = (평균 심박수 − 안정 심박수) / (LTHR − 안정 심박수)
          </p>
          <p className="text-xs">
            TSS는 훈련 부하를 측정하는 지표입니다. 100은 역치 강도로 1시간 운동한 것에 해당합니다.
          </p>
        </div>
      </div>
    </div>
  )
}
