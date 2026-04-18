'use client'

import { useActionState } from 'react'
import { buttonVariants } from '@/components/ui/button'
import { saveSessionMeta } from './actions'
import type { SessionMetaUpdate } from '@/../lib/db'

interface SessionMetaFormProps {
  id: string
  meta: SessionMetaUpdate
}

const selectClass =
  'w-full rounded-md border bg-muted px-3 py-2 text-sm focus:border-foreground focus:outline-none'
const inputClass = selectClass

const sessionTypes = [
  { value: '', label: '선택 안 함' },
  { value: 'easy', label: '이지' },
  { value: 'recovery', label: '회복' },
  { value: 'tempo', label: '템포' },
  { value: 'threshold_interval', label: '역치 인터벌' },
  { value: 'long_run', label: '롱런' },
  { value: 'progression', label: '프로그레션' },
  { value: 'trail', label: '트레일' },
]

const intents = [
  { value: '', label: '선택 안 함' },
  { value: 'z2_volume', label: 'Z2 볼륨' },
  { value: 'aerobic_base', label: '유산소 기초' },
  { value: 'mp_practice', label: 'MP 연습' },
  { value: 'recovery', label: '회복' },
  { value: 'race_specific', label: '레이스 특화' },
  { value: 'exploration', label: '탐험' },
]

const sleepQualities = [
  { value: '', label: '선택 안 함' },
  { value: 'poor', label: '나쁨' },
  { value: 'fair', label: '보통' },
  { value: 'good', label: '좋음' },
  { value: 'excellent', label: '매우 좋음' },
]

const fatigueLevels = [
  { value: '', label: '선택 안 함' },
  { value: 'fresh', label: '상쾌' },
  { value: 'normal', label: '보통' },
  { value: 'tired', label: '피곤' },
  { value: 'exhausted', label: '극도로 피곤' },
]

export function SessionMetaForm({ id, meta }: SessionMetaFormProps): React.ReactElement {
  const [state, formAction, isPending] = useActionState(saveSessionMeta, null)

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="id" value={id} />

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="session_type" className="text-sm font-medium">
            세션 유형
          </label>
          <select
            id="session_type"
            name="session_type"
            defaultValue={meta.sessionType ?? ''}
            className={selectClass}
          >
            {sessionTypes.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="intent" className="text-sm font-medium">
            훈련 의도
          </label>
          <select
            id="intent"
            name="intent"
            defaultValue={meta.intent ?? ''}
            className={selectClass}
          >
            {intents.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="rpe" className="text-sm font-medium">
            주관적 강도 (RPE)
          </label>
          <input
            type="number"
            id="rpe"
            name="rpe"
            min={1}
            max={10}
            defaultValue={meta.rpe ?? ''}
            placeholder="1-10"
            className={inputClass}
          />
          <p className="text-xs text-muted-foreground/60">1 (매우 쉬움) ~ 10 (최대 노력)</p>
        </div>

        <div className="space-y-2">
          <label htmlFor="sleep_quality" className="text-sm font-medium">
            수면 품질
          </label>
          <select
            id="sleep_quality"
            name="sleep_quality"
            defaultValue={meta.sleepQuality ?? ''}
            className={selectClass}
          >
            {sleepQualities.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="fatigue_level" className="text-sm font-medium">
            컨디션
          </label>
          <select
            id="fatigue_level"
            name="fatigue_level"
            defaultValue={meta.fatigueLevel ?? ''}
            className={selectClass}
          >
            {fatigueLevels.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="notes" className="text-sm font-medium">
          메모
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          defaultValue={meta.notes ?? ''}
          placeholder="오늘 훈련에 대한 메모를 남기세요"
          className={`${inputClass} resize-none`}
        />
      </div>

      {state?.error && <p className="text-sm text-red">{state.error}</p>}
      {state?.success && <p className="text-sm text-green">저장되었습니다.</p>}

      <button type="submit" disabled={isPending} className={buttonVariants({ variant: 'default' })}>
        {isPending ? '저장 중...' : '저장'}
      </button>
    </form>
  )
}
