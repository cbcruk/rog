'use client'

import { Star, Trash2 } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
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
      <div className="rounded-lg border px-3 py-4 text-center text-xs text-muted-foreground">
        저장된 프로그램이 없습니다.
      </div>
    )
  }

  return (
    <ul className="flex flex-col divide-y overflow-hidden rounded-lg border">
      {programs.map((program) => (
        <li
          key={program.id}
          className={`flex items-center gap-2 px-3 py-2 ${
            program.id === currentId ? 'bg-foreground/5' : ''
          }`}
        >
          <button
            type="button"
            onClick={() => onLoad(program)}
            disabled={disabled}
            className="flex min-w-0 flex-1 flex-col text-left disabled:opacity-50"
          >
            <span className="flex items-center gap-1 truncate text-xs font-medium">
              {program.isActive && (
                <Star className="size-3 shrink-0" style={{ color: 'var(--yellow)' }} />
              )}
              {program.name}
            </span>
            <span className="truncate text-[11px] text-muted-foreground">
              {program.sessions.length}개 세션
            </span>
          </button>
          <button
            type="button"
            onClick={() => onDelete(program.id)}
            disabled={disabled}
            aria-label={`${program.name} 삭제`}
            className={buttonVariants({ variant: 'ghost', size: 'icon-sm' })}
          >
            <Trash2 />
          </button>
        </li>
      ))}
    </ul>
  )
}
