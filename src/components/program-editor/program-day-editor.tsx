'use client'

import { Plus, Trash2 } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import type { PlannedSession, PlannedSessionType } from '@/types/program'
import {
  DAY_LABELS,
  PLANNED_TYPE_OPTIONS,
  applyTypeDefaults,
  getPlannedTypeLabel,
} from './program-editor.utils'

interface ProgramDayEditorProps {
  dayIndex: number
  sessions: PlannedSession[]
  onChange: (session: PlannedSession) => void
  onRemove: (id: string) => void
  onAdd: () => void
}

const inputClass =
  'w-full rounded-md border bg-muted px-2 py-1.5 text-sm tabular-nums focus:border-foreground focus:outline-none'

interface NumberFieldProps {
  label: string
  unit: string
  value: number
  step?: number
  onChange: (value: number) => void
}

function NumberField({
  label,
  unit,
  value,
  step = 1,
  onChange,
}: NumberFieldProps): React.ReactElement {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] text-muted-foreground">
        {label} <span className="text-muted-foreground/60">({unit})</span>
      </span>
      <input
        type="number"
        min={0}
        step={step}
        value={value}
        onChange={(event) => onChange(Math.max(0, Number(event.target.value) || 0))}
        className={inputClass}
      />
    </label>
  )
}

/**
 * 선택한 요일에 배치된 계획 세션들을 편집하는 패널.
 * 값이 바뀔 때마다 상위로 즉시 전달되어 주간 합계와 검증 결과가 실시간으로 갱신된다.
 */
export function ProgramDayEditor({
  dayIndex,
  sessions,
  onChange,
  onRemove,
  onAdd,
}: ProgramDayEditorProps): React.ReactElement {
  return (
    <div className="flex flex-col gap-3 rounded-lg border p-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">{DAY_LABELS[dayIndex]}요일</h3>
        <button
          type="button"
          onClick={onAdd}
          className={buttonVariants({ variant: 'outline', size: 'sm' })}
        >
          <Plus />
          세션 추가
        </button>
      </div>

      {sessions.length === 0 ? (
        <p className="py-4 text-center text-xs text-muted-foreground">
          휴식일입니다. 세션을 추가하면 이 날에 배치됩니다.
        </p>
      ) : (
        sessions.map((session, index) => {
          const zoneOverflow = session.thresholdMinutes + session.supraMinutes

          return (
            <div key={session.id} className="flex flex-col gap-3 rounded-md border bg-muted/30 p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground">
                  세션 {index + 1} · {getPlannedTypeLabel(session.type)}
                </span>
                <button
                  type="button"
                  onClick={() => onRemove(session.id)}
                  aria-label="세션 삭제"
                  className={buttonVariants({ variant: 'destructive', size: 'icon-sm' })}
                >
                  <Trash2 />
                </button>
              </div>

              <label className="flex flex-col gap-1">
                <span className="text-[11px] text-muted-foreground">유형</span>
                <select
                  value={session.type}
                  onChange={(event) =>
                    onChange(applyTypeDefaults(session, event.target.value as PlannedSessionType))
                  }
                  className={inputClass}
                >
                  {PLANNED_TYPE_OPTIONS.map((type) => (
                    <option key={type} value={type}>
                      {getPlannedTypeLabel(type)}
                    </option>
                  ))}
                </select>
              </label>

              <div className="grid grid-cols-2 gap-2">
                <NumberField
                  label="시간"
                  unit="분"
                  value={session.durationMinutes}
                  step={5}
                  onChange={(value) => onChange({ ...session, durationMinutes: value })}
                />
                <NumberField
                  label="거리"
                  unit="km"
                  value={session.distanceKm ?? 0}
                  step={0.5}
                  onChange={(value) => onChange({ ...session, distanceKm: value })}
                />
                <NumberField
                  label="역치 존"
                  unit="분"
                  value={session.thresholdMinutes}
                  step={5}
                  onChange={(value) => onChange({ ...session, thresholdMinutes: value })}
                />
                <NumberField
                  label="Z3 초과"
                  unit="분"
                  value={session.supraMinutes}
                  step={1}
                  onChange={(value) => onChange({ ...session, supraMinutes: value })}
                />
              </div>

              {zoneOverflow > session.durationMinutes && (
                <p className="text-[11px] text-destructive">
                  존 시간 합({zoneOverflow}분)이 세션 시간({session.durationMinutes}분)을 넘습니다.
                </p>
              )}

              <label className="flex flex-col gap-1">
                <span className="text-[11px] text-muted-foreground">메모</span>
                <input
                  type="text"
                  value={session.note ?? ''}
                  placeholder="예: 6 x 5분 / 1분 조깅"
                  onChange={(event) => onChange({ ...session, note: event.target.value })}
                  className="w-full rounded-md border bg-muted px-2 py-1.5 text-sm focus:border-foreground focus:outline-none"
                />
              </label>
            </div>
          )
        })
      )}
    </div>
  )
}
