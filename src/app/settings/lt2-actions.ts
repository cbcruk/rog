'use server'

import { addLT2Benchmark, deleteLT2Benchmark } from '@/../lib/db'
import { revalidatePath } from 'next/cache'

export interface LT2ActionState {
  success?: boolean
  error?: string
}

export async function addLT2(
  _prevState: LT2ActionState | null,
  formData: FormData,
): Promise<LT2ActionState> {
  try {
    const environment = formData.get('environment') as string
    const paceMin = Number(formData.get('pace_min'))
    const paceSec = Number(formData.get('pace_sec'))
    const date = formData.get('date') as string

    if (!environment || !date) return { error: '환경과 날짜를 입력하세요' }
    if (isNaN(paceMin) || isNaN(paceSec)) return { error: '유효한 페이스를 입력하세요' }

    const paceSeconds = paceMin * 60 + paceSec
    if (paceSeconds <= 0) return { error: '페이스는 0보다 커야 합니다' }

    const notes = (formData.get('notes') as string) || undefined
    await addLT2Benchmark(environment, paceSeconds, date, notes)

    revalidatePath('/settings')
    return { success: true }
  } catch (error) {
    console.error('Failed to add LT2 benchmark:', error)
    return { error: '저장에 실패했습니다' }
  }
}

export async function removeLT2(formData: FormData): Promise<void> {
  const id = Number(formData.get('id'))
  if (!isNaN(id)) {
    await deleteLT2Benchmark(id)
    revalidatePath('/settings')
  }
}
