'use client'

import { useActionState, useState } from 'react'
import { Button } from '@astryxdesign/core/Button'
import { FieldStatus } from '@astryxdesign/core/FieldStatus'
import { NumberInput } from '@astryxdesign/core/NumberInput'
import { Selector } from '@astryxdesign/core/Selector'
import { TextArea } from '@astryxdesign/core/TextArea'
import { saveSessionMeta } from './actions'
import type { SessionMetaUpdate } from '@/../lib/db'

interface SessionMetaFormProps {
  id: string
  meta: SessionMetaUpdate
}

const UNSET = { value: '', label: '선택 안 함' }

const SESSION_TYPES = [
  UNSET,
  { value: 'easy', label: '이지' },
  { value: 'recovery', label: '회복' },
  { value: 'tempo', label: '템포' },
  { value: 'threshold_interval', label: '역치 인터벌' },
  { value: 'long_run', label: '롱런' },
  { value: 'progression', label: '프로그레션' },
  { value: 'trail', label: '트레일' },
]

const INTENTS = [
  UNSET,
  { value: 'z2_volume', label: 'Z2 볼륨' },
  { value: 'aerobic_base', label: '유산소 기초' },
  { value: 'mp_practice', label: 'MP 연습' },
  { value: 'recovery', label: '회복' },
  { value: 'race_specific', label: '레이스 특화' },
  { value: 'exploration', label: '탐험' },
]

const SLEEP_QUALITIES = [
  UNSET,
  { value: 'poor', label: '나쁨' },
  { value: 'fair', label: '보통' },
  { value: 'good', label: '좋음' },
  { value: 'excellent', label: '매우 좋음' },
]

const FATIGUE_LEVELS = [
  UNSET,
  { value: 'fresh', label: '상쾌' },
  { value: 'normal', label: '보통' },
  { value: 'tired', label: '피곤' },
  { value: 'exhausted', label: '극도로 피곤' },
]

/**
 * 세션 메타데이터 편집 폼.
 *
 * Astryx 입력은 제어 컴포넌트라 서버 액션에 값을 넘기려면 로컬 상태가 필요하다.
 * `htmlName`이 히든 입력을 렌더링해 FormData 키는 기존 서버 액션과 그대로 맞춘다.
 */
export function SessionMetaForm({ id, meta }: SessionMetaFormProps): React.ReactElement {
  const [state, formAction, isPending] = useActionState(saveSessionMeta, null)
  const [sessionType, setSessionType] = useState(meta.sessionType ?? '')
  const [intent, setIntent] = useState(meta.intent ?? '')
  const [rpe, setRpe] = useState<number | null>(meta.rpe ?? null)
  const [sleepQuality, setSleepQuality] = useState(meta.sleepQuality ?? '')
  const [fatigueLevel, setFatigueLevel] = useState(meta.fatigueLevel ?? '')
  const [notes, setNotes] = useState(meta.notes ?? '')

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <input type="hidden" name="id" value={id} />

      <div className="grid gap-6 sm:grid-cols-2">
        <Selector
          label="세션 유형"
          htmlName="session_type"
          width="100%"
          options={SESSION_TYPES}
          value={sessionType}
          onChange={setSessionType}
        />
        <Selector
          label="훈련 의도"
          htmlName="intent"
          width="100%"
          options={INTENTS}
          value={intent}
          onChange={setIntent}
        />
        <NumberInput
          label="주관적 강도 (RPE)"
          description="1 (매우 쉬움) ~ 10 (최대 노력)"
          htmlName="rpe"
          width="100%"
          placeholder="1-10"
          min={1}
          max={10}
          isIntegerOnly
          hasClear
          value={rpe}
          onChange={setRpe}
        />
        <Selector
          label="수면 품질"
          htmlName="sleep_quality"
          width="100%"
          options={SLEEP_QUALITIES}
          value={sleepQuality}
          onChange={setSleepQuality}
        />
        <Selector
          label="컨디션"
          htmlName="fatigue_level"
          width="100%"
          options={FATIGUE_LEVELS}
          value={fatigueLevel}
          onChange={setFatigueLevel}
        />
      </div>

      <TextArea
        label="메모"
        htmlName="notes"
        width="100%"
        rows={3}
        placeholder="오늘 훈련에 대한 메모를 남기세요"
        value={notes}
        onChange={setNotes}
      />

      {state?.error && <FieldStatus type="error" message={state.error} variant="detached" />}
      {state?.success && (
        <FieldStatus type="success" message="저장되었습니다." variant="detached" />
      )}

      <div>
        <Button
          label={isPending ? '저장 중...' : '저장'}
          variant="primary"
          type="submit"
          isLoading={isPending}
        />
      </div>
    </form>
  )
}
