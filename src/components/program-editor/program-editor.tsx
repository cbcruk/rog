'use client'

import { useMemo, useState, useTransition } from 'react'
import { Save } from 'lucide-react'
import { Button } from '@astryxdesign/core/Button'
import { CheckboxInput } from '@astryxdesign/core/CheckboxInput'
import { Card } from '@astryxdesign/core/Card'
import { FieldStatus } from '@astryxdesign/core/FieldStatus'
import { Icon } from '@astryxdesign/core/Icon'
import { Text } from '@astryxdesign/core/Text'
import { TextInput } from '@astryxdesign/core/TextInput'
import { deleteProgramAction, saveProgramAction } from '@/app/program/actions'
import { calculateProgramTotals, groupSessionsByDay } from '@/lib/program-metrics'
import { PROGRAM_PRESETS, instantiatePreset } from '@/lib/program-presets'
import { validateProgram } from '@/lib/program-validation'
import type { PlannedSession, WeeklyProgram } from '@/types/program'
import type { ProgramPreset } from '@/lib/program-presets'
import { ProgramChecklist } from './program-checklist'
import { ProgramDayEditor } from './program-day-editor'
import { ProgramLibrary } from './program-library'
import { ProgramSummaryPanel } from './program-summary-panel'
import { ProgramWeekGrid } from './program-week-grid'
import { createPlannedSession } from './program-editor.utils'

interface ProgramEditorProps {
  /** 저장된 프로그램 목록 */
  initialPrograms: WeeklyProgram[]
  /** 최근 4주 평균 주간 거리 (km). 볼륨 증가율 검증의 기준선 */
  fourWeekAvgDistance: number
}

interface Draft {
  /** 저장된 프로그램을 편집 중이면 해당 id, 새 프로그램이면 undefined */
  id?: string
  name: string
  description?: string
  sessions: PlannedSession[]
  isActive: boolean
}

function toDraft(program: WeeklyProgram): Draft {
  return {
    id: program.id,
    name: program.name,
    description: program.description,
    sessions: program.sessions,
    isActive: program.isActive,
  }
}

function presetToDraft(preset: ProgramPreset): Draft {
  return {
    name: preset.name,
    description: preset.description,
    sessions: instantiatePreset(preset),
    isActive: false,
  }
}

/** 편집 중인 내용이 저장본과 다른지 비교하기 위한 직렬화 키. */
function draftKey(draft: Draft): string {
  return JSON.stringify([draft.name, draft.description, draft.sessions, draft.isActive])
}

function getInitialDraft(programs: WeeklyProgram[]): Draft {
  const active = programs.find((program) => program.isActive) ?? programs[0]
  if (active) return toDraft(active)

  return presetToDraft(PROGRAM_PRESETS[0])
}

/**
 * 주간 훈련 프로그램 에디터.
 *
 * 7일 그리드에서 세션을 조립하면 주간 합계와 Bakken 모델 검증이 즉시 갱신된다.
 * 저장된 프로그램이 없으면 빈 화면 대신 프리셋을 초안으로 띄운다.
 */
export function ProgramEditor({
  initialPrograms,
  fourWeekAvgDistance,
}: ProgramEditorProps): React.ReactElement {
  const [programs, setPrograms] = useState(initialPrograms)
  const [draft, setDraft] = useState<Draft>(() => getInitialDraft(initialPrograms))
  const [savedKey, setSavedKey] = useState(() => {
    const initial = getInitialDraft(initialPrograms)
    return initial.id ? draftKey(initial) : ''
  })
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const totals = useMemo(() => calculateProgramTotals(draft.sessions), [draft.sessions])
  const checks = useMemo(
    () => validateProgram(draft.sessions, { fourWeekAvgDistance }),
    [draft.sessions, fourWeekAvgDistance],
  )

  const daySessions = useMemo(
    () => (selectedDay === null ? [] : groupSessionsByDay(draft.sessions)[selectedDay]),
    [draft.sessions, selectedDay],
  )

  const isDirty = draftKey(draft) !== savedKey

  function replaceDraft(next: Draft): void {
    if (isDirty && !window.confirm('저장하지 않은 변경이 있습니다. 계속할까요?')) return

    setDraft(next)
    setSavedKey(next.id ? draftKey(next) : '')
    setSelectedDay(null)
    setError(null)
  }

  function updateSession(updated: PlannedSession): void {
    setDraft((current) => ({
      ...current,
      sessions: current.sessions.map((session) => (session.id === updated.id ? updated : session)),
    }))
  }

  function removeSession(id: string): void {
    setDraft((current) => ({
      ...current,
      sessions: current.sessions.filter((session) => session.id !== id),
    }))
  }

  function addSession(): void {
    if (selectedDay === null) return

    setDraft((current) => ({
      ...current,
      sessions: [...current.sessions, createPlannedSession(selectedDay)],
    }))
  }

  function handleSave(): void {
    setError(null)

    startTransition(async () => {
      const result = await saveProgramAction({
        id: draft.id,
        name: draft.name,
        description: draft.description,
        sessions: draft.sessions,
        isActive: draft.isActive,
      })

      if (result.error || !result.program) {
        setError(result.error ?? '프로그램 저장에 실패했습니다.')
        return
      }

      const saved = result.program

      setPrograms((current) => {
        const others = current
          .filter((program) => program.id !== saved.id)
          .map((program) => (saved.isActive ? { ...program, isActive: false } : program))

        return [saved, ...others]
      })
      setDraft(toDraft(saved))
      setSavedKey(draftKey(toDraft(saved)))
    })
  }

  function handleDelete(id: string): void {
    if (!window.confirm('이 프로그램을 삭제할까요?')) return

    setError(null)

    startTransition(async () => {
      const result = await deleteProgramAction(id)

      if (result.error) {
        setError(result.error)
        return
      }

      const remaining = programs.filter((program) => program.id !== id)
      setPrograms(remaining)

      if (draft.id === id) {
        const next = getInitialDraft(remaining)
        setDraft(next)
        setSavedKey(next.id ? draftKey(next) : '')
        setSelectedDay(null)
      }
    })
  }

  return (
    <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end gap-2">
          <div className="min-w-48 flex-1">
            <TextInput
              label="프로그램 이름"
              isLabelHidden
              width="100%"
              placeholder="프로그램 이름"
              value={draft.name}
              onChange={(value) => setDraft((current) => ({ ...current, name: value }))}
            />
          </div>
          <CheckboxInput
            label="현재 적용"
            value={draft.isActive}
            onChange={(checked) => setDraft((current) => ({ ...current, isActive: checked }))}
          />
          <Button
            label={isPending ? '저장 중...' : isDirty ? '저장 *' : '저장'}
            variant="primary"
            icon={<Icon icon={Save} size="sm" />}
            isLoading={isPending}
            onClick={handleSave}
          />
        </div>

        {error && <FieldStatus type="error" message={error} variant="detached" />}

        <ProgramWeekGrid
          sessions={draft.sessions}
          selectedDay={selectedDay}
          onSelectDay={setSelectedDay}
        />

        {selectedDay === null ? (
          <Card variant="muted">
            <Text type="supporting" justify="center" display="block">
              요일을 선택하면 해당 날의 세션을 편집할 수 있습니다.
            </Text>
          </Card>
        ) : (
          <ProgramDayEditor
            dayIndex={selectedDay}
            sessions={daySessions}
            onChange={updateSession}
            onRemove={removeSession}
            onAdd={addSession}
          />
        )}
      </div>

      <div className="flex flex-col gap-4 lg:sticky lg:top-16">
        <ProgramSummaryPanel totals={totals} />
        <ProgramChecklist checks={checks} />

        <div className="flex flex-col gap-2">
          <Text type="label">프리셋</Text>
          <div className="flex flex-wrap gap-1.5">
            {PROGRAM_PRESETS.map((preset) => (
              <Button
                key={preset.id}
                label={preset.name}
                size="sm"
                tooltip={preset.description}
                onClick={() => replaceDraft(presetToDraft(preset))}
              />
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Text type="label">저장된 프로그램</Text>
          <ProgramLibrary
            programs={programs}
            currentId={draft.id}
            onLoad={(program) => replaceDraft(toDraft(program))}
            onDelete={handleDelete}
            disabled={isPending}
          />
        </div>
      </div>
    </div>
  )
}
