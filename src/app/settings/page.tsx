import { SettingsForm } from '@/components/settings-form'
import { getSettings } from '@/lib/settings'

export const dynamic = 'force-dynamic'

export default async function SettingsPage(): Promise<React.ReactElement> {
  const settings = await getSettings()

  return (
    <div className="p-4 lg:p-6">
      <h1 className="mb-6 text-xl font-bold">Settings</h1>

      <div className="rounded-lg border border-tx-3 bg-bg-2 p-6">
        <h2 className="mb-4 text-lg font-medium">Training Zones</h2>
        <p className="mb-6 text-sm text-tx-2">
          Configure your heart rate zones and threshold values for accurate TSS calculation.
        </p>

        <SettingsForm settings={settings} />
      </div>

      <div className="mt-6 rounded-lg border border-tx-3 bg-bg-2 p-6">
        <h2 className="mb-4 text-lg font-medium">How TSS is Calculated</h2>
        <div className="space-y-3 text-sm text-tx-2">
          <p>
            <strong>hrTSS</strong> = Duration (hours) x IF² x 100
          </p>
          <p>
            <strong>Intensity Factor (IF)</strong> = (Avg HR - Rest HR) / (LTHR - Rest HR)
          </p>
          <p className="text-xs">
            TSS helps measure training load. A value of 100 represents a 1-hour workout at threshold intensity.
          </p>
        </div>
      </div>
    </div>
  )
}
