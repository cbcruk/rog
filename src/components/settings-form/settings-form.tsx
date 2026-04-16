'use client'

import { useActionState } from 'react'
import { buttonVariants } from '@/components/ui/button'
import type { SettingsFormProps } from './settings-form.types'
import { saveSettings } from '@/app/settings/actions'

export function SettingsForm({ settings }: SettingsFormProps): React.ReactElement {
  const [state, formAction, isPending] = useActionState(saveSettings, null)

  return (
    <form action={formAction} className="space-y-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="lthr" className="text-sm font-medium">
            젖산 역치 심박수 (LTHR)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              id="lthr"
              name="lthr"
              defaultValue={settings.lthr}
              min={100}
              max={220}
              className="w-full rounded-md border bg-muted px-3 py-2 text-sm focus:border-foreground focus:outline-none"
            />
            <span className="text-sm text-muted-foreground">bpm</span>
          </div>
          <p className="text-xs text-muted-foreground/60">
            1시간 동안 유지 가능한 최대 페이스의 심박수
          </p>
        </div>

        <div className="space-y-2">
          <label htmlFor="rest_hr" className="text-sm font-medium">
            안정 심박수
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              id="rest_hr"
              name="rest_hr"
              defaultValue={settings.rest_hr}
              min={30}
              max={100}
              className="w-full rounded-md border bg-muted px-3 py-2 text-sm focus:border-foreground focus:outline-none"
            />
            <span className="text-sm text-muted-foreground">bpm</span>
          </div>
          <p className="text-xs text-muted-foreground/60">기상 직후 안정 시 심박수</p>
        </div>

        <div className="space-y-2">
          <label htmlFor="max_hr" className="text-sm font-medium">
            최대 심박수
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              id="max_hr"
              name="max_hr"
              defaultValue={settings.max_hr}
              min={150}
              max={230}
              className="w-full rounded-md border bg-muted px-3 py-2 text-sm focus:border-foreground focus:outline-none"
            />
            <span className="text-sm text-muted-foreground">bpm</span>
          </div>
          <p className="text-xs text-muted-foreground/60">측정된 최대 심박수</p>
        </div>

        <div className="space-y-2">
          <label htmlFor="ftp_pace" className="text-sm font-medium">
            역치 페이스 (FTP)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              id="ftp_pace"
              name="ftp_pace"
              defaultValue={settings.ftp_pace}
              min={180}
              max={600}
              className="w-full rounded-md border bg-muted px-3 py-2 text-sm focus:border-foreground focus:outline-none"
            />
            <span className="text-sm text-muted-foreground">sec/km</span>
          </div>
          <p className="text-xs text-muted-foreground/60">
            1시간 유지 가능한 페이스 (예: 270 = 4:30/km)
          </p>
        </div>
      </div>

      {state?.error && <p className="text-sm text-red-500">{state.error}</p>}

      {state?.success && <p className="text-sm text-green">설정이 저장되었습니다.</p>}

      <button type="submit" disabled={isPending} className={buttonVariants({ variant: 'default' })}>
        {isPending ? '저장 중...' : '설정 저장'}
      </button>
    </form>
  )
}
