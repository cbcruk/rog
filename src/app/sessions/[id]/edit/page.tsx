import { notFound } from 'next/navigation'
import { Card } from '@astryxdesign/core/Card'
import { Heading } from '@astryxdesign/core/Heading'
import { Link as AstryxLink } from '@astryxdesign/core/Link'
import { getSessionMeta } from '@/../lib/db'
import { SessionMetaForm } from './session-meta-form'

export const dynamic = 'force-dynamic'

export default async function EditSessionPage({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<React.ReactElement> {
  const { id } = await params
  const meta = await getSessionMeta(id)

  if (!meta) notFound()

  return (
    <div className="flex flex-col gap-4 p-4 lg:p-6">
      <AstryxLink href={`/sessions/${id}`} isStandalone>
        ← 세션으로 돌아가기
      </AstryxLink>
      <Heading level={1}>세션 메타데이터 편집</Heading>
      <Card padding={6}>
        <SessionMetaForm id={id} meta={meta} />
      </Card>
    </div>
  )
}
