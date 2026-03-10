import { readFileSync, readdirSync, existsSync } from 'fs'
import { join } from 'path'
import type { RunSession, SessionWithFeedback } from '@/types/running'

console.log(process.cwd())

const RESULTS_DIR = join(process.cwd(), 'results')

export function getAllSessions(): SessionWithFeedback[] {
  if (!existsSync(RESULTS_DIR)) {
    return []
  }

  const folders = readdirSync(RESULTS_DIR, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name)
    .sort()
    .reverse()

  const sessions: SessionWithFeedback[] = []

  for (const folder of folders) {
    const dataPath = join(RESULTS_DIR, folder, 'data.json')
    const feedbackPath = join(RESULTS_DIR, folder, 'feedback.md')

    if (!existsSync(dataPath)) continue

    try {
      const data = JSON.parse(readFileSync(dataPath, 'utf-8')) as RunSession
      let feedback: string | undefined

      if (existsSync(feedbackPath)) {
        feedback = readFileSync(feedbackPath, 'utf-8')
      }

      sessions.push({
        ...data,
        id: folder,
        feedback,
      })
    } catch {
      console.warn(`Failed to load session: ${folder}`)
    }
  }

  return sessions
}

export function getSession(id: string): SessionWithFeedback | null {
  const dataPath = join(RESULTS_DIR, id, 'data.json')
  const feedbackPath = join(RESULTS_DIR, id, 'feedback.md')

  if (!existsSync(dataPath)) {
    return null
  }

  try {
    const data = JSON.parse(readFileSync(dataPath, 'utf-8')) as RunSession
    let feedback: string | undefined

    if (existsSync(feedbackPath)) {
      feedback = readFileSync(feedbackPath, 'utf-8')
    }

    return {
      ...data,
      id,
      feedback,
    }
  } catch {
    return null
  }
}

export function getAllSessionIds(): string[] {
  if (!existsSync(RESULTS_DIR)) {
    return []
  }

  return readdirSync(RESULTS_DIR, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .filter((dirent) => existsSync(join(RESULTS_DIR, dirent.name, 'data.json')))
    .map((dirent) => dirent.name)
    .sort()
    .reverse()
}
