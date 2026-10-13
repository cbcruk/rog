'use client'

import { useActionState, useState } from 'react'
import { Button } from '@astryxdesign/core/Button'
import { FieldStatus } from '@astryxdesign/core/FieldStatus'
import { NumberInput } from '@astryxdesign/core/NumberInput'
import type { SettingsFormProps } from './settings-form.types'
import { saveSettings } from '@/app/settings/actions'

/**
 * 훈련 구간 설정 폼.
 *
 * Astryx 입력 컴포넌트는 제어 컴포넌트라 서버 액션에 값을 넘기려면 로컬 상태가 필요하다.
 * `htmlName`이 히든 입력을 함께 렌더링해 FormData 키는 기존 서버 액션과 그대로 맞춘다.
 */
export function SettingsForm({ settings }: SettingsFormProps): React.ReactElement {
  const [state, formAction, isPending] = useActionState(saveSettings, null)
  const [lthr, setLthr] = useState(settings.lthr)
  const [restHr, setRestHr] = useState(settings.rest_hr)
  const [maxHr, setMaxHr] = useState(settings.max_hr)
  const [ftpPace, setFtpPace] = useState(settings.ftp_pace)

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <NumberInput
          label="젖산 역치 심박수 (LTHR)"
          description="1시간 동안 유지 가능한 최대 페이스의 심박수"
          htmlName="lthr"
          units="bpm"
          width="100%"
          min={100}
          max={220}
          isIntegerOnly
          value={lthr}
          onChange={setLthr}
        />
        <NumberInput
          label="안정 심박수"
          description="기상 직후 안정 시 심박수"
          htmlName="rest_hr"
          units="bpm"
          width="100%"
          min={30}
          max={100}
          isIntegerOnly
          value={restHr}
          onChange={setRestHr}
        />
        <NumberInput
          label="최대 심박수"
          description="측정된 최대 심박수"
          htmlName="max_hr"
          units="bpm"
          width="100%"
          min={150}
          max={230}
          isIntegerOnly
          value={maxHr}
          onChange={setMaxHr}
        />
        <NumberInput
          label="역치 페이스 (FTP)"
          description="1시간 유지 가능한 페이스 (예: 270 = 4:30/km)"
          htmlName="ftp_pace"
          units="sec/km"
          width="100%"
          min={180}
          max={600}
          isIntegerOnly
          value={ftpPace}
          onChange={setFtpPace}
        />
      </div>

      {state?.error && <FieldStatus type="error" message={state.error} variant="detached" />}
      {state?.success && (
        <FieldStatus type="success" message="설정이 저장되었습니다." variant="detached" />
      )}

      <div>
        <Button
          label={isPending ? '저장 중...' : '설정 저장'}
          variant="primary"
          type="submit"
          isLoading={isPending}
        />
      </div>
    </form>
  )
}
