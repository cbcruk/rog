import { Minus, TrendingDown, TrendingUp } from 'lucide-react'

interface TrendIndicatorProps {
  /** 변화량. 양수면 상승, 음수면 하락, 0이면 유지 */
  value: number
  /** 기간을 나타내는 한국어 표현 (예: "7일간") */
  period: string
  /** 변화의 주체 (예: "체력 수치") */
  subject: string
}

/**
 * 변화량을 아이콘과 함께 서술형 문장으로 표시합니다.
 * (예: "7일간 체력 수치가 4.9 증가했어요")
 */
export function TrendIndicator({
  value,
  period,
  subject,
}: TrendIndicatorProps): React.ReactElement {
  const Icon = value > 0 ? TrendingUp : value < 0 ? TrendingDown : Minus
  const color = value > 0 ? 'text-green' : value < 0 ? 'text-red' : 'text-muted-foreground'
  const absValue = Math.abs(value).toFixed(1)
  const sentence =
    value === 0
      ? `${period} ${subject}가 유지되고 있어요`
      : `${period} ${subject}가 ${absValue} ${value > 0 ? '증가했어요' : '감소했어요'}`

  return (
    <span className={`inline-flex items-center gap-1 ${color}`}>
      <Icon className="size-3.5" />
      <span>{sentence}</span>
    </span>
  )
}
