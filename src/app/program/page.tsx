import { ProgramEditor } from '@/components/program-editor/program-editor'
import { getFourWeekAvgDistance } from '@/lib/pmc'
import { getPrograms } from '@/lib/program'

export const dynamic = 'force-dynamic'

export default async function ProgramPage(): Promise<React.ReactElement> {
  const [programs, fourWeekAvgDistance] = await Promise.all([
    getPrograms(),
    getFourWeekAvgDistance(),
  ])

  return (
    <div className="flex flex-col gap-4 p-4 lg:p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-bold">주간 프로그램</h1>
        <p className="text-sm text-muted-foreground">
          한 주의 훈련 구성을 미리 설계합니다. 세션을 편집하면 주간 합계와 Bakken 모델 검증이 바로
          갱신됩니다.
        </p>
      </div>

      <ProgramEditor initialPrograms={programs} fourWeekAvgDistance={fourWeekAvgDistance} />
    </div>
  )
}
