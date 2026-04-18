import Link from 'next/link'
import { notFound } from 'next/navigation'
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
    <div className="p-4 lg:p-6">
      <Link href={`/sessions/${id}`} className="text-blue underline">
        ← 세션으로 돌아가기
      </Link>
      <h1 className="mt-4 mb-6 text-xl font-bold">세션 메타데이터 편집</h1>
      <div className="rounded-lg border bg-muted p-6">
        <SessionMetaForm id={id} meta={meta} />
      </div>
    </div>
  )
}
