'use client'

import { AlertTriangle, Check, X } from 'lucide-react'
import type { ProgramCheck } from '@/types/program'

interface ProgramChecklistProps {
  checks: ProgramCheck[]
}

const STATUS_STYLE = {
  pass: { icon: Check, color: 'var(--green)' },
  warn: { icon: AlertTriangle, color: 'var(--yellow)' },
  fail: { icon: X, color: 'var(--red)' },
} as const

/**
 * Bakken 모델 제약 검증 결과 목록.
 * `recommendations.ts`가 주가 끝난 뒤 알려주던 규칙들을 프로그램을 짜는 시점에 보여준다.
 */
export function ProgramChecklist({ checks }: ProgramChecklistProps): React.ReactElement {
  const failCount = checks.filter((check) => check.status === 'fail').length
  const warnCount = checks.filter((check) => check.status === 'warn').length

  return (
    <div className="rounded-lg border">
      <div className="flex items-baseline justify-between border-b px-3 py-2">
        <span className="text-xs font-medium">모델 검증</span>
        <span className="text-[11px] tabular-nums text-muted-foreground">
          {failCount > 0 || warnCount > 0
            ? `위반 ${failCount} · 주의 ${warnCount}`
            : `${checks.length}개 항목 통과`}
        </span>
      </div>

      <ul className="flex flex-col divide-y">
        {checks.map((check) => {
          const { icon: Icon, color } = STATUS_STYLE[check.status]

          return (
            <li key={check.id} className="flex items-start gap-2 px-3 py-2">
              <Icon className="mt-0.5 size-3.5 shrink-0" style={{ color }} />
              <div className="flex flex-col gap-0.5">
                <span className="text-[11px] font-medium">{check.label}</span>
                <span className="text-[11px] leading-snug text-muted-foreground">
                  {check.message}
                </span>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
