import { Card } from '@astryxdesign/core/Card'
import { Text } from '@astryxdesign/core/Text'

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
    <Card>
      <div className="flex items-start justify-between gap-2">
        <Text type="supporting">{label}</Text>
        {children}
      </div>
      <Text size="2xl" weight="bold" display="block" hasTabularNumbers>
        {value}
      </Text>
      {description && (
        <Text size="sm" color="secondary" display="block">
          {description}
        </Text>
      )}
    </Card>
  )
}
