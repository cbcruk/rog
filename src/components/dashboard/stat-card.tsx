interface StatCardProps {
  /** 통계 항목 이름. 툴팁 등 ReactNode 합성도 가능 */
  label: React.ReactNode
  /** 표시할 값 (포맷된 문자열) */
  value: string
  /** 값 아래에 표시할 부연 설명 텍스트 */
  description?: React.ReactNode
  /** 카드 우측 상단에 렌더링할 보조 요소 (예: 추세 표시, 상태 배지) */
  children?: React.ReactNode
}

/**
 * 라벨과 값을 표시하는 단일 통계 카드 컴포넌트.
 * children은 우측 상단에, description은 값 아래에 렌더링됩니다.
 */
export function StatCard({
  label,
  value,
  description,
  children,
}: StatCardProps): React.ReactElement {
  return (
    <div className="relative rounded-lg border bg-muted p-4">
      <div className="mb-1 text-sm text-muted-foreground">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
      {description && <div className="mt-1 text-xs text-muted-foreground">{description}</div>}
      <div className="absolute top-4 right-4">{children}</div>
    </div>
  )
}
