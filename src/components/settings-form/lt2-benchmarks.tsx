'use client'

import { useActionState, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Button } from '@astryxdesign/core/Button'
import { DateInput } from '@astryxdesign/core/DateInput'
import type { DateInputProps } from '@astryxdesign/core/DateInput'
import { FieldStatus } from '@astryxdesign/core/FieldStatus'
import { Icon } from '@astryxdesign/core/Icon'
import { IconButton } from '@astryxdesign/core/IconButton'
import { NumberInput } from '@astryxdesign/core/NumberInput'
import { Selector } from '@astryxdesign/core/Selector'
import { Table, pixel, proportional } from '@astryxdesign/core/Table'
import { Text } from '@astryxdesign/core/Text'
import { TextInput } from '@astryxdesign/core/TextInput'
import { addLT2, removeLT2 } from '@/app/settings/lt2-actions'
import type { LT2Benchmark } from '@/../lib/db'

/** DateInput이 요구하는 YYYY-MM-DD 리터럴 타입. 패키지가 별칭을 내보내지 않아 prop에서 뽑아 쓴다. */
type ISODateString = NonNullable<DateInputProps['value']>

interface LT2BenchmarksProps {
  benchmarks: LT2Benchmark[]
}

const ENVIRONMENTS = [
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
  return ENVIRONMENTS.find((e) => e.value === env)?.label ?? env
}

/** Astryx Table의 data-driven 모드는 행 타입이 Record를 만족해야 한다. */
type BenchmarkRow = LT2Benchmark & Record<string, unknown>

export function LT2Benchmarks({ benchmarks }: LT2BenchmarksProps): React.ReactElement {
  const [state, formAction, isPending] = useActionState(addLT2, null)
  const [environment, setEnvironment] = useState(ENVIRONMENTS[0].value)
  const [paceMin, setPaceMin] = useState<number | null>(null)
  const [paceSec, setPaceSec] = useState<number | null>(null)
  const [date, setDate] = useState<ISODateString | undefined>(undefined)
  const [notes, setNotes] = useState('')

  const columns = [
    {
      key: 'environment',
      header: '환경',
      width: proportional(1),
      renderCell: (row: BenchmarkRow) => getEnvLabel(row.environment),
    },
    {
      key: 'paceSeconds',
      header: 'LT2 페이스',
      align: 'end' as const,
      width: proportional(1),
      renderCell: (row: BenchmarkRow) => (
        <Text hasTabularNumbers>{formatPace(row.paceSeconds)}/km</Text>
      ),
    },
    {
      key: 'date',
      header: '날짜',
      align: 'end' as const,
      width: proportional(1),
      renderCell: (row: BenchmarkRow) => (
        <Text color="secondary" hasTabularNumbers>
          {row.date}
        </Text>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'end' as const,
      width: pixel(56),
      renderCell: (row: BenchmarkRow) => (
        <form action={removeLT2}>
          <input type="hidden" name="id" value={row.id} />
          <IconButton
            label={`${getEnvLabel(row.environment)} 벤치마크 삭제`}
            tooltip="삭제"
            variant="ghost"
            size="sm"
            type="submit"
            icon={<Icon icon={Trash2} size="sm" />}
          />
        </form>
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      {benchmarks.length > 0 && (
        <Table<BenchmarkRow>
          data={benchmarks as BenchmarkRow[]}
          columns={columns}
          idKey="id"
          density="compact"
        />
      )}

      <form action={formAction} className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-4">
          <Selector
            label="환경"
            htmlName="environment"
            width="100%"
            options={ENVIRONMENTS}
            value={environment}
            onChange={setEnvironment}
          />
          <div className="flex items-end gap-1">
            <NumberInput
              label="LT2 페이스 (분/km)"
              htmlName="pace_min"
              width="100%"
              placeholder="분"
              min={2}
              max={10}
              isIntegerOnly
              value={paceMin}
              hasClear
              onChange={setPaceMin}
            />
            <NumberInput
              label="초"
              htmlName="pace_sec"
              width="100%"
              placeholder="초"
              min={0}
              max={59}
              isIntegerOnly
              value={paceSec}
              hasClear
              onChange={setPaceSec}
            />
          </div>
          <div>
            <DateInput label="측정 날짜" width="100%" value={date} onChange={setDate} />
            <input type="hidden" name="date" value={date ?? ''} />
          </div>
          <TextInput
            label="메모"
            htmlName="notes"
            width="100%"
            placeholder="선택"
            isOptional
            value={notes}
            onChange={setNotes}
          />
        </div>

        {state?.error && <FieldStatus type="error" message={state.error} variant="detached" />}
        {state?.success && (
          <FieldStatus type="success" message="추가되었습니다." variant="detached" />
        )}

        <div>
          <Button
            label={isPending ? '추가 중...' : 'LT2 벤치마크 추가'}
            variant="primary"
            type="submit"
            isLoading={isPending}
          />
        </div>
      </form>
    </div>
  )
}
