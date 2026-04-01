export interface UserSettings {
  lthr: number
  rest_hr: number
  max_hr: number
  ftp_pace: number
}

export interface SettingsFormProps {
  settings: UserSettings
  onSave: (settings: UserSettings) => Promise<void>
}

export const DEFAULT_SETTINGS: UserSettings = {
  lthr: 165,
  rest_hr: 50,
  max_hr: 185,
  ftp_pace: 270,
}
