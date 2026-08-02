'use server'

import { revalidatePath } from 'next/cache'
import { deleteProgram, saveProgram } from '@/lib/program'
import type { WeeklyProgram, WeeklyProgramInput } from '@/types/program'

export interface SaveProgramState {
  program?: WeeklyProgram
  error?: string
}

/** 프로그램을 저장하고 저장된 결과를 반환한다. 이름이 비어 있으면 거절한다. */
export async function saveProgramAction(input: WeeklyProgramInput): Promise<SaveProgramState> {
  const name = input.name.trim()

  if (name.length === 0) {
    return { error: '프로그램 이름을 입력하세요.' }
  }

  if (input.sessions.length === 0) {
    return { error: '세션이 하나 이상 필요합니다.' }
  }

  try {
    const program = await saveProgram({ ...input, name })

    revalidatePath('/program')

    return { program }
  } catch (error) {
    console.error('Failed to save program:', error)
    return { error: '프로그램 저장에 실패했습니다.' }
  }
}

export interface DeleteProgramState {
  success?: boolean
  error?: string
}

/** 프로그램을 삭제한다. */
export async function deleteProgramAction(id: string): Promise<DeleteProgramState> {
  try {
    await deleteProgram(id)

    revalidatePath('/program')

    return { success: true }
  } catch (error) {
    console.error('Failed to delete program:', error)
    return { error: '프로그램 삭제에 실패했습니다.' }
  }
}
