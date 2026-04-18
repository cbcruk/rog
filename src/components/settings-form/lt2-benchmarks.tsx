'use client'

import { useActionState } from 'react'
import { buttonVariants } from '@/components/ui/button'
import { addLT2, removeLT2 } from '@/app/settings/lt2-actions'
import type { LT2Benchmark } from '@/../lib/db'

interface LT2BenchmarksProps {
  benchmarks: LT2Benchmark[]
}

const inputClass =
  'w-full rounded-md border bg-muted px-3 py-2 text-sm focus:border-foreground focus:outline-none'

const environments = [
  { value: 'flat', label: '평지' },
  { value: 'incline_2', label: '경사 2%' },
  { value: 'incline_4', label: '경사 4%' },
  { value: 'incline_6', label: '경사 6%' },
  { value: 'incline_8', label: '경사 8%' },
  { value: 'trail', label: '트레일' },
]

function formatPace(seconds: number): string {
  const min = Math.floor(seconds / 60)
  const sec = seconds % 60
  return `${min}:${String(sec).padStart(2, '0')}`
}

function getEnvLabel(env: string): string {
  return environments.find((e) => e.value === env)?.label ?? env
}

export function LT2Benchmarks({ benchmarks }: LT2BenchmarksProps): React.ReactElement {
  const [state, formAction, isPending] = useActionState(addLT2, null)

  return (
    <div className="space-y-6">
      {benchmarks.length > 0 && (
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b">
              <th className="p-2 text-left text-muted-foreground">환경</th>
              <th className="p-2 text-right text-muted-foreground">LT2 페이스</th>
              <th className="p-2 text-right text-muted-foreground">날짜</th>
              <th className="p-2 text-right text-muted-foreground" />
            </tr>
          </thead>
          <tbody>
            {benchmarks.map((b) => (
              <tr key={b.id} className="border-b">
                <td className="p-2">{getEnvLabel(b.environment)}</td>
                <td className="p-2 text-right tabular-nums">{formatPace(b.paceSeconds)}/km</td>
                <td className="p-2 text-right text-muted-foreground">{b.date}</td>
                <td className="p-2 text-right">
                  <form action={removeLT2}>
                    <input type="hidden" name="id" value={b.id} />
                    <button type="submit" className="text-xs text-red hover:underline">
                      삭제
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <form action={formAction} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-4">
          <div className="space-y-1">
            <label htmlFor="environment" className="text-xs font-medium">
              환경
            </label>
            <select id="environment" name="environment" className={inputClass}>
              {environments.map((e) => (
                <option key={e.value} value={e.value}>
                  {e.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label htmlFor="pace_min" className="text-xs font-medium">
              LT2 페이스 (/km)
            </label>
            <div className="flex items-center gap-1">
              <input
                type="number"
                id="pace_min"
                name="pace_min"
                min={2}
                max={10}
                placeholder="분"
                className={inputClass}
              />
              <span className="text-muted-foreground">:</span>
              <input
                type="number"
                name="pace_sec"
                min={0}
                max={59}
                placeholder="초"
                className={inputClass}
              />
            </div>
          </div>
          <div className="space-y-1">
            <label htmlFor="lt2_date" className="text-xs font-medium">
              측정 날짜
            </label>
            <input type="date" id="lt2_date" name="date" className={inputClass} />
          </div>
          <div className="space-y-1">
            <label htmlFor="lt2_notes" className="text-xs font-medium">
              메모
            </label>
            <input
              type="text"
              id="lt2_notes"
              name="notes"
              placeholder="선택"
              className={inputClass}
            />
          </div>
        </div>

        {state?.error && <p className="text-sm text-red">{state.error}</p>}
        {state?.success && <p className="text-sm text-green">추가되었습니다.</p>}

        <button
          type="submit"
          disabled={isPending}
          className={buttonVariants({ variant: 'default' })}
        >
          {isPending ? '추가 중...' : 'LT2 벤치마크 추가'}
        </button>
      </form>
    </div>
  )
}
