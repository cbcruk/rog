'use client'

import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@astryxdesign/core/Button'
import { Card } from '@astryxdesign/core/Card'
import { Heading } from '@astryxdesign/core/Heading'
import { Icon } from '@astryxdesign/core/Icon'
import { IconButton } from '@astryxdesign/core/IconButton'
import { NumberInput } from '@astryxdesign/core/NumberInput'
import { Selector } from '@astryxdesign/core/Selector'
import { Text } from '@astryxdesign/core/Text'
import { TextInput } from '@astryxdesign/core/TextInput'
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

const TYPE_OPTIONS = PLANNED_TYPE_OPTIONS.map((type) => ({
  value: type,
  label: getPlannedTypeLabel(type),
}))

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
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <Heading level={3}>{DAY_LABELS[dayIndex]}요일</Heading>
        <Button label="세션 추가" size="sm" icon={<Icon icon={Plus} size="sm" />} onClick={onAdd} />
      </div>

      {sessions.length === 0 ? (
        <Text type="supporting" justify="center" display="block">
          휴식일입니다. 세션을 추가하면 이 날에 배치됩니다.
        </Text>
      ) : (
        <div className="flex flex-col gap-3">
          {sessions.map((session, index) => {
            const zoneOverflow = session.thresholdMinutes + session.supraMinutes
            const isOverflowing = zoneOverflow > session.durationMinutes

            return (
              <Card key={session.id} variant="muted" padding={3}>
                <div className="flex items-center justify-between gap-2">
                  <Text type="supporting">
                    세션 {index + 1} · {getPlannedTypeLabel(session.type)}
                  </Text>
                  <IconButton
                    label="세션 삭제"
                    tooltip="세션 삭제"
                    variant="destructive"
                    size="sm"
                    icon={<Icon icon={Trash2} size="sm" />}
                    onClick={() => onRemove(session.id)}
                  />
                </div>

                <div className="mt-3 flex flex-col gap-3">
                  <Selector
                    label="유형"
                    size="sm"
                    width="100%"
                    options={TYPE_OPTIONS}
                    value={session.type}
                    onChange={(value) =>
                      onChange(applyTypeDefaults(session, value as PlannedSessionType))
                    }
                  />

                  <div className="grid grid-cols-2 gap-2">
                    <NumberInput
                      label="시간"
                      units="분"
                      size="sm"
                      width="100%"
                      min={0}
                      step={5}
                      value={session.durationMinutes}
                      onChange={(value) =>
                        onChange({ ...session, durationMinutes: Math.max(0, value) })
                      }
                    />
                    <NumberInput
                      label="거리"
                      units="km"
                      size="sm"
                      width="100%"
                      min={0}
                      step={0.5}
                      value={session.distanceKm ?? 0}
                      onChange={(value) => onChange({ ...session, distanceKm: Math.max(0, value) })}
                    />
                    <NumberInput
                      label="역치 존"
                      units="분"
                      size="sm"
                      width="100%"
                      min={0}
                      step={5}
                      value={session.thresholdMinutes}
                      onChange={(value) =>
                        onChange({ ...session, thresholdMinutes: Math.max(0, value) })
                      }
                      status={
                        isOverflowing
                          ? {
                              type: 'error',
                              message: `존 시간 합(${zoneOverflow}분)이 세션 시간(${session.durationMinutes}분)을 넘습니다.`,
                            }
                          : undefined
                      }
                      statusVariant="detached"
                    />
                    <NumberInput
                      label="Z3 초과"
                      units="분"
                      size="sm"
                      width="100%"
                      min={0}
                      step={1}
                      value={session.supraMinutes}
                      onChange={(value) =>
                        onChange({ ...session, supraMinutes: Math.max(0, value) })
                      }
                      status={isOverflowing ? { type: 'error' } : undefined}
                    />
                  </div>

                  <TextInput
                    label="메모"
                    size="sm"
                    width="100%"
                    placeholder="예: 6 x 5분 / 1분 조깅"
                    value={session.note ?? ''}
                    onChange={(value) => onChange({ ...session, note: value })}
                  />
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </section>
  )
}
