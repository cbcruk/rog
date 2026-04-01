import type { UserSettings } from '@/types/settings'

export interface SettingsFormProps {
  settings: UserSettings
}

export interface SettingsFieldProps {
  label: string
  name: keyof UserSettings
  value: number
  unit: string
  description?: string
  min?: number
  max?: number
}
