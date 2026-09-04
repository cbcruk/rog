'use client'

import { AlertTriangle, Check, X } from 'lucide-react'
import { Card } from '@astryxdesign/core/Card'
import { Divider } from '@astryxdesign/core/Divider'
import { Icon } from '@astryxdesign/core/Icon'
import { Text } from '@astryxdesign/core/Text'
import type { ProgramCheck } from '@/types/program'

interface ProgramChecklistProps {
  checks: ProgramCheck[]
}

const STATUS_STYLE = {
  pass: { icon: Check, color: 'success' },
  warn: { icon: AlertTriangle, color: 'warning' },
  fail: { icon: X, color: 'error' },
} as const

/**
 * Bakken 모델 제약 검증 결과 목록.
 * `recommendations.ts`가 주가 끝난 뒤 알려주던 규칙들을 프로그램을 짜는 시점에 보여준다.
 */
export function ProgramChecklist({ checks }: ProgramChecklistProps): React.ReactElement {
  const failCount = checks.filter((check) => check.status === 'fail').length
  const warnCount = checks.filter((check) => check.status === 'warn').length

  return (
    <Card padding={3}>
      <div className="flex items-baseline justify-between gap-2">
        <Text type="label">모델 검증</Text>
        <Text type="supporting" hasTabularNumbers>
          {failCount > 0 || warnCount > 0
            ? `위반 ${failCount} · 주의 ${warnCount}`
            : `${checks.length}개 항목 통과`}
        </Text>
      </div>

      <Divider />

      <ul className="flex flex-col gap-2">
        {checks.map((check) => {
          const { icon, color } = STATUS_STYLE[check.status]

          return (
            <li key={check.id} className="flex items-start gap-2">
              <span className="mt-0.5 shrink-0">
                <Icon icon={icon} size="xsm" color={color} label={check.status} />
              </span>
              <div className="flex flex-col">
                <Text type="label" size="sm">
                  {check.label}
                </Text>
                <Text type="supporting" size="sm" display="block">
                  {check.message}
                </Text>
              </div>
            </li>
          )
        })}
      </ul>
    </Card>
  )
}
