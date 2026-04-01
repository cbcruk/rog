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
            LTHR (Lactate Threshold HR)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              id="lthr"
              name="lthr"
              defaultValue={settings.lthr}
              min={100}
              max={220}
              className="w-full rounded-md border border-tx-3 bg-bg-2 px-3 py-2 text-sm focus:border-tx focus:outline-none"
            />
            <span className="text-sm text-tx-2">bpm</span>
          </div>
          <p className="text-xs text-tx-3">
            1 hour max sustainable pace HR
          </p>
        </div>

        <div className="space-y-2">
          <label htmlFor="rest_hr" className="text-sm font-medium">
            Resting HR
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              id="rest_hr"
              name="rest_hr"
              defaultValue={settings.rest_hr}
              min={30}
              max={100}
              className="w-full rounded-md border border-tx-3 bg-bg-2 px-3 py-2 text-sm focus:border-tx focus:outline-none"
            />
            <span className="text-sm text-tx-2">bpm</span>
          </div>
          <p className="text-xs text-tx-3">
            Morning resting heart rate
          </p>
        </div>

        <div className="space-y-2">
          <label htmlFor="max_hr" className="text-sm font-medium">
            Max HR
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              id="max_hr"
              name="max_hr"
              defaultValue={settings.max_hr}
              min={150}
              max={230}
              className="w-full rounded-md border border-tx-3 bg-bg-2 px-3 py-2 text-sm focus:border-tx focus:outline-none"
            />
            <span className="text-sm text-tx-2">bpm</span>
          </div>
          <p className="text-xs text-tx-3">
            Maximum heart rate
          </p>
        </div>

        <div className="space-y-2">
          <label htmlFor="ftp_pace" className="text-sm font-medium">
            FTP (Threshold Pace)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              id="ftp_pace"
              name="ftp_pace"
              defaultValue={settings.ftp_pace}
              min={180}
              max={600}
              className="w-full rounded-md border border-tx-3 bg-bg-2 px-3 py-2 text-sm focus:border-tx focus:outline-none"
            />
            <span className="text-sm text-tx-2">sec/km</span>
          </div>
          <p className="text-xs text-tx-3">
            1 hour sustainable pace (e.g., 270 = 4:30/km)
          </p>
        </div>
      </div>

      {state?.error && (
        <p className="text-sm text-red-500">{state.error}</p>
      )}

      {state?.success && (
        <p className="text-sm text-green-600">Settings saved successfully!</p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className={buttonVariants({ variant: 'default' })}
      >
        {isPending ? 'Saving...' : 'Save Settings'}
      </button>
    </form>
  )
}
