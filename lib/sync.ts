import 'dotenv/config'
import GarminConnect, { type Activity } from 'garmin-connect'
import { existsSync, mkdirSync, readdirSync, unlinkSync, renameSync } from 'fs'
import { join } from 'path'
import { execSync } from 'child_process'

const DATA_DIR = join(process.cwd(), 'data')

function ensureDir(dir: string): void {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
}

function getExistingActivityIds(): Set<string> {
  if (!existsSync(DATA_DIR)) return new Set()
  return new Set(
    readdirSync(DATA_DIR)
      .filter((f) => f.endsWith('.fit'))
      .map((f) => {
        const name = f.replace(/\.fit$/, '')
        const parts = name.split('_')
        if (parts.length >= 3) {
          return parts[2]
        }
        return parts[0]
      }),
  )
}


function extractAndCleanup(
  zipPath: string,
  activity: Activity,
): string | null {
  const activityId = activity.activityId.toString()
  const startTimeLocal = activity.startTimeLocal || ''

  let dateStr = 'unknown'
  let timeStr = '0000'

  if (startTimeLocal) {
    const [datePart, timePart] = startTimeLocal.split(' ')
    dateStr = datePart
    if (timePart) {
      const [hours, minutes] = timePart.split(':')
      timeStr = `${hours}${minutes}`
    }
  }

  const beforeFiles = new Set(readdirSync(DATA_DIR))
  execSync(`unzip -o "${zipPath}" -d "${DATA_DIR}"`, { stdio: 'ignore' })
  unlinkSync(zipPath)

  const afterFiles = readdirSync(DATA_DIR)
  const newFiles = afterFiles.filter(
    (f) => !beforeFiles.has(f) && f.endsWith('.fit'),
  )

  if (newFiles.length > 0) {
    const extractedFit = newFiles[0]
    const oldPath = join(DATA_DIR, extractedFit)
    const newPath = join(DATA_DIR, `${dateStr}_${timeStr}_${activityId}.fit`)
    renameSync(oldPath, newPath)
    return `${dateStr}_${timeStr}_${activityId}.fit`
  }
  return null
}

async function main(): Promise<void> {
  if (!process.env.GARMIN_EMAIL || !process.env.GARMIN_PASSWORD) {
    console.error('Error: GARMIN_EMAIL and GARMIN_PASSWORD required in .env')
    process.exit(1)
  }

  const count = parseInt(process.argv[2]) || 5

  console.log('='.repeat(50))
  console.log('Garmin Connect Sync')
  console.log('='.repeat(50))

  ensureDir(DATA_DIR)
  const existingIds = getExistingActivityIds()
  console.log(`Found ${existingIds.size} existing activities in data/`)

  const client = new GarminConnect.GarminConnect()

  try {
    console.log('Logging in...')
    await client.login(process.env.GARMIN_EMAIL, process.env.GARMIN_PASSWORD)
    console.log('Login successful!')

    console.log(`\nFetching last ${count} activities...`)
    const activities: Activity[] = await client.getActivities(0, count)
    console.log(`Found ${activities.length} activities`)

    let downloaded = 0
    let skipped = 0

    for (const activity of activities) {
      const id = activity.activityId.toString()
      const name = activity.activityName || 'Activity'
      const date = activity.startTimeLocal?.split(' ')[0] || 'unknown'

      if (existingIds.has(id)) {
        console.log(`  Skip: ${date} - ${name} (already exists)`)
        skipped++
        continue
      }

      console.log(`  Downloading: ${date} - ${name}...`)

      try {
        await client.downloadOriginalActivityData(
          { activityId: activity.activityId },
          DATA_DIR,
          'zip',
        )
        const zipPath = join(DATA_DIR, `${id}.zip`)
        const fitFile = extractAndCleanup(zipPath, activity)
        downloaded++
        console.log(`    -> Saved: ${fitFile}`)
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error)
        console.error(`    -> Error: ${msg}`)
      }
    }

    console.log('\n' + '='.repeat(50))
    console.log(`Done! ${downloaded} downloaded, ${skipped} skipped`)
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('Error:', msg)
    process.exit(1)
  }
}

main()
