import { readdirSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join, basename } from 'path'
import { parseFitFile } from './parser.mjs'
import { analyzeRun } from './analyzer.mjs'
import { initDb, upsertSession, getAllSettings } from './db.mjs'
import { calculateAndStorePMC } from './pmc-calculator.mjs'

const DATA_DIR = join(process.cwd(), 'data')
const RESULTS_DIR = join(process.cwd(), 'results')

function ensureDir(dir) {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
}

function getOutputDir(analysis) {
  const startTime = new Date(analysis.startTime)
  const year = startTime.getFullYear()
  const month = String(startTime.getMonth() + 1).padStart(2, '0')
  const day = String(startTime.getDate()).padStart(2, '0')
  const hours = String(startTime.getHours()).padStart(2, '0')
  const minutes = String(startTime.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}_${hours}${minutes}`
}

function generateMarkdown(analysis) {
  const { summary, splits, segments, laps, consistency, highlights, heartRate, fatigue, elevation, intervals, metadata, tss } = analysis

  let md = `# ${analysis.date} Running Report

## Summary

| Item | Value |
|------|-------|
| Date | ${analysis.date} |
| Distance | ${summary.distance} km |
| Duration | ${summary.duration} |
| Avg Pace | ${summary.avgPace}/km |
| Avg HR | ${summary.avgHeartRate} bpm |
| Max HR | ${summary.maxHeartRate} bpm |
| Calories | ${summary.calories} kcal |
| Avg Cadence | ${summary.avgCadence || '-'} spm |
| Elevation | +${elevation.totalAscent}m / -${elevation.totalDescent}m |
| TSS | ${tss?.rtss || '-'} (${tss?.zoneLabel || '-'}) |
| Intensity | ${tss?.intensityFactor ? (tss.intensityFactor * 100).toFixed(0) + '%' : '-'} |

## Splits

| Half | Pace | Diff |
|------|------|------|
| First | ${splits.firstHalfPace}/km | - |
| Second | ${splits.secondHalfPace}/km | ${splits.diffSeconds > 0 ? '+' : ''}${splits.diffSeconds}s |
| Type | ${splits.type} | |

## Segments

| Range | Pace | Avg HR |
|-------|------|--------|
${segments.map((s) => `| ${s.range} | ${s.pace}/km | ${s.avgHeartRate || '-'} bpm |`).join('\n')}

## Lap Details

| km | Pace | HR | Cadence | Elev |
|----|------|-----|---------|------|
${laps.map((l) => `| ${l.km} | ${l.paceFormatted}/km | ${l.heartRate || '-'} | ${l.cadence || '-'} | +${l.ascent}/-${l.descent}m |`).join('\n')}

## Consistency

| Metric | Value |
|--------|-------|
| Std Dev | ${consistency.stdDevSeconds}s/km |
| CV | ${consistency.cv}% |
| Rating | ${consistency.rating} |

## Highlights

- Fastest: ${highlights.fastestLap.km}km (${highlights.fastestLap.pace}/km)
- Slowest: ${highlights.slowestLap.km}km (${highlights.slowestLap.pace}/km)
`

  if (heartRate) {
    md += `
## Heart Rate

| Metric | Value |
|--------|-------|
| Average | ${heartRate.avgHeartRate} bpm |
| Min | ${heartRate.minHeartRate} bpm |
| Max | ${heartRate.maxHeartRate} bpm |
| Drift | ${heartRate.drift}% |
`
  }

  if (fatigue) {
    md += `
## Fatigue (First 5km vs Last 5km)

| Segment | Pace |
|---------|------|
| First 5km | ${fatigue.first5kmPace}/km |
| Last 5km | ${fatigue.last5kmPace}/km |
| Drop | ${fatigue.dropSeconds > 0 ? '+' : ''}${fatigue.dropSeconds}s/km |
`
  }

  if (metadata) {
    md += `
## Session Info

| Item | Value |
|------|-------|
| Type | ${metadata.type} |
| Location | ${metadata.location} |
${metadata.intent ? `| Intent | ${metadata.intent} |` : ''}
${metadata.rpe ? `| RPE | ${metadata.rpe}/10 |` : ''}
${metadata.sleepQuality ? `| Sleep | ${metadata.sleepQuality} |` : ''}
${metadata.treadmill ? `| Treadmill | ${metadata.treadmill.incline}% @ ${metadata.treadmill.workSpeed}/${metadata.treadmill.restSpeed || '-'} km/h |` : ''}
`
  }

  if (intervals) {
    md += `
## Interval Analysis

| Metric | Value |
|--------|-------|
| Structure | ${intervals.structure} |
| Completed | ${intervals.totalSets}/${intervals.targetSets} sets |
| Avg Work HR | ${intervals.summary.avgWorkHR} bpm |
| Avg Rest HR | ${intervals.summary.avgRestHR} bpm |
| HR Recovery | ${intervals.summary.hrRecovery} bpm |

### Set Details

| Set | Work HR | Max HR | Pace | Rest HR | Zone% |
|-----|---------|--------|------|---------|-------|
${intervals.sets.map((s) => `| ${s.set} | ${s.work.avgHR || '-'} | ${s.work.maxHR || '-'} | ${s.work.avgPace || '-'}/km | ${s.rest.minHR || '-'} | ${s.work.hrInZone || '-'}% |`).join('\n')}
`
  }

  return md
}

function processFile(filePath, settings = {}) {
  const filename = basename(filePath)
  console.log(`\nProcessing: ${filename}`)

  try {
    const data = parseFitFile(filePath)
    const analysis = analyzeRun({
      session: data.session,
      laps: data.laps,
      records: data.records,
      metadata: data.metadata,
      settings,
    })

    const outputDir = join(RESULTS_DIR, getOutputDir(analysis))
    ensureDir(outputDir)

    writeFileSync(join(outputDir, 'data.json'), JSON.stringify(analysis, null, 2))
    writeFileSync(join(outputDir, 'spec.md'), generateMarkdown(analysis))

    const dirName = getOutputDir(analysis)
    console.log(`  -> Saved: ${dirName}/`)

    printSummary(analysis)
    return { success: true, output: dirName, analysis }
  } catch (error) {
    console.error(`  Error: ${error.message}`)
    return { success: false, error: error.message, analysis: null }
  }
}

function printSummary(analysis) {
  const { summary, splits, consistency, metadata, intervals, tss } = analysis
  console.log(`  Distance: ${summary.distance}km`)
  console.log(`  Duration: ${summary.duration}`)
  console.log(`  Avg Pace: ${summary.avgPace}/km`)
  console.log(`  Avg HR: ${summary.avgHeartRate} bpm`)
  console.log(`  Split: ${splits.type} (${splits.diffSeconds > 0 ? '+' : ''}${splits.diffSeconds}s)`)
  console.log(`  Consistency: ${consistency.rating} (CV: ${consistency.cv}%)`)
  if (tss?.rtss) {
    console.log(`  TSS: ${tss.rtss} (${tss.zoneLabel})`)
  }
  if (metadata) {
    console.log(`  Type: ${metadata.type} (${metadata.location})`)
  }
  if (intervals) {
    console.log(`  Intervals: ${intervals.totalSets}/${intervals.targetSets} sets, Avg Work HR: ${intervals.summary.avgWorkHR}`)
  }
}

async function main() {
  const args = process.argv.slice(2)

  console.log('='.repeat(50))
  console.log('FIT File Analyzer')
  console.log('='.repeat(50))

  await initDb()
  const settings = await getAllSettings()
  console.log(`Settings: LTHR=${settings.lthr}, RestHR=${settings.rest_hr}`)

  let files = []

  if (args.length > 0) {
    files = args.map((arg) => (arg.startsWith('/') ? arg : join(process.cwd(), arg)))
  } else {
    if (!existsSync(DATA_DIR)) {
      console.log('\nNo data/ folder found. Creating...')
      ensureDir(DATA_DIR)
      console.log('Place your .fit files in the data/ folder and run again.')
      return
    }

    files = readdirSync(DATA_DIR)
      .filter((f) => f.endsWith('.fit'))
      .map((f) => join(DATA_DIR, f))

    if (files.length === 0) {
      console.log('\nNo .fit files found in data/ folder.')
      return
    }
  }

  console.log(`\nFound ${files.length} file(s)`)

  const results = []
  for (const file of files) {
    const result = processFile(file, settings)
    results.push(result)
    if (result.success && result.analysis) {
      await upsertSession(result.analysis)
    }
  }

  const success = results.filter((r) => r.success).length
  const failed = results.filter((r) => !r.success).length

  console.log('\n' + '='.repeat(50))
  console.log(`Done! ${success} processed, ${failed} failed`)
  console.log(`Results saved to: ${RESULTS_DIR}`)

  if (success > 0) {
    console.log('\nCalculating PMC...')
    await calculateAndStorePMC()
  }
}

main()
