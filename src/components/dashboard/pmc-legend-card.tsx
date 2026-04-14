interface PMCLegendCardProps {
  /** 범례 도트에 적용할 Tailwind 배경색 클래스 */
  dotColor: string
  /** 지표 이름 (예: CTL, ATL, TSB) */
  label: string
  /** 지표 정의 (영문 풀네임 + 의미) */
  description: string
  /** 활용 가이드: 이 값을 어떻게 해석하고 활용할지 */
  guide: string
}

/**
 * PMC 차트의 범례 항목 하나를 카드 형태로 표시합니다.
 * 정의(description)와 활용 가이드(guide) 두 단을 함께 보여줍니다.
 */
export function PMCLegendCard({
  dotColor,
  label,
  description,
  guide,
}: PMCLegendCardProps): React.ReactElement {
  return (
    <div className="rounded-lg border bg-muted p-4">
      <div className="mb-2 flex items-center gap-2">
        <div className={`size-3 rounded-full ${dotColor}`} />
        <span className="text-sm font-medium">{label}</span>
      </div>
      <p className="text-xs text-muted-foreground">{description}</p>
      <p className="mt-1.5 text-xs text-muted-foreground/80">{guide}</p>
    </div>
  )
}
