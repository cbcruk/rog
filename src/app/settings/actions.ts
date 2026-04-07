'use server'

import { updateSettings } from '@/lib/settings'
import { revalidatePath } from 'next/cache'

export interface SaveSettingsState {
  success?: boolean
  error?: string
}

export async function saveSettings(
  _prevState: SaveSettingsState | null,
  formData: FormData,
): Promise<SaveSettingsState> {
  try {
    const lthr = Number(formData.get('lthr'))
    const rest_hr = Number(formData.get('rest_hr'))
    const max_hr = Number(formData.get('max_hr'))
    const ftp_pace = Number(formData.get('ftp_pace'))

    if (isNaN(lthr) || isNaN(rest_hr) || isNaN(max_hr) || isNaN(ftp_pace)) {
      return { error: 'Invalid input values' }
    }

    if (lthr <= rest_hr) {
      return { error: 'LTHR must be greater than resting HR' }
    }

    if (max_hr <= lthr) {
      return { error: 'Max HR must be greater than LTHR' }
    }

    await updateSettings({
      lthr,
      rest_hr,
      max_hr,
      ftp_pace,
    })

    revalidatePath('/settings')
    revalidatePath('/dashboard')

    return { success: true }
  } catch (error) {
    console.error('Failed to save settings:', error)
    return { error: 'Failed to save settings' }
  }
}
