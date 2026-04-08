import { readFileSync, readdirSync, existsSync } from 'fs'
import { join } from 'path'
import type { RunSession, SessionWithFeedback } from '@/types/running'

console.log(process.cwd())

const RESULTS_DIR = join(process.cwd(), 'results')

/** results/ 디렉토리의 모든 세션을 날짜 역순으로 로드한다. 각 세션에 feedback.md가 있으면 함께 포함한다. */
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

/** ID(폴더명)로 단일 세션을 로드한다. 존재하지 않으면 null을 반환한다. */
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

/** results/ 디렉토리에서 data.json이 존재하는 세션 ID 목록을 날짜 역순으로 반환한다. */
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
