'use client'

import { Star, Trash2 } from 'lucide-react'
import { Card } from '@astryxdesign/core/Card'
import { Icon } from '@astryxdesign/core/Icon'
import { IconButton } from '@astryxdesign/core/IconButton'
import { Text } from '@astryxdesign/core/Text'
import type { WeeklyProgram } from '@/types/program'

interface ProgramLibraryProps {
  programs: WeeklyProgram[]
  currentId?: string
  onLoad: (program: WeeklyProgram) => void
  onDelete: (id: string) => void
  disabled: boolean
}

/** 저장된 프로그램 목록. 불러오기와 삭제, 활성 프로그램 표시를 담당한다. */
export function ProgramLibrary({
  programs,
  currentId,
  onLoad,
  onDelete,
  disabled,
}: ProgramLibraryProps): React.ReactElement {
  if (programs.length === 0) {
    return (
      <Card padding={3}>
        <Text type="supporting" justify="center" display="block">
          저장된 프로그램이 없습니다.
        </Text>
      </Card>
    )
  }

  return (
    <Card padding={0}>
      <ul className="flex flex-col">
        {programs.map((program) => (
          <li
            key={program.id}
            className={`flex items-center gap-2 border-b border-border px-3 py-2 last:border-b-0 ${
              program.id === currentId ? 'bg-muted' : ''
            }`}
          >
            <button
              type="button"
              onClick={() => onLoad(program)}
              disabled={disabled}
              className="flex min-w-0 flex-1 flex-col text-left disabled:opacity-50"
            >
              <span className="flex items-center gap-1">
                {program.isActive && (
                  <Icon icon={Star} size="xsm" color="warning" label="적용 중" />
                )}
                <Text type="label" size="sm" maxLines={1}>
                  {program.name}
                </Text>
              </span>
              <Text type="supporting" size="sm" maxLines={1} display="block">
                {program.sessions.length}개 세션
              </Text>
            </button>
            <IconButton
              label={`${program.name} 삭제`}
              tooltip="삭제"
              variant="ghost"
              size="sm"
              isDisabled={disabled}
              icon={<Icon icon={Trash2} size="sm" />}
              onClick={() => onDelete(program.id)}
            />
          </li>
        ))}
      </ul>
    </Card>
  )
}
