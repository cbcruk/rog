'use server'

import { updateSessionMeta } from '@/../lib/db'
import { revalidatePath } from 'next/cache'

export interface SaveSessionMetaState {
  success?: boolean
  error?: string
}

export async function saveSessionMeta(
  _prevState: SaveSessionMetaState | null,
  formData: FormData,
): Promise<SaveSessionMetaState> {
  try {
    const id = formData.get('id') as string
    if (!id) return { error: '세션 ID가 없습니다' }

    await updateSessionMeta(id, {
      sessionType: (formData.get('session_type') as string) || null,
      intent: (formData.get('intent') as string) || null,
      rpe: formData.get('rpe') ? Number(formData.get('rpe')) : null,
      sleepQuality: (formData.get('sleep_quality') as string) || null,
      fatigueLevel: (formData.get('fatigue_level') as string) || null,
      notes: (formData.get('notes') as string) || null,
    })

    revalidatePath(`/sessions/${id}`)
    return { success: true }
  } catch (error) {
    console.error('Failed to save session meta:', error)
    return { error: '저장에 실패했습니다' }
  }
}
