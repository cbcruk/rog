export interface UserSettings {
  /** Lactate Threshold Heart Rate (bpm) */
  lthr: number
  /** 안정시 심박 (bpm) */
  rest_hr: number
  /** 최대 심박 (bpm) */
  max_hr: number
  /** FTP 페이스 (초/km) */
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
