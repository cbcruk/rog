import { Card } from '@astryxdesign/core/Card'
import { Text } from '@astryxdesign/core/Text'

interface PMCLegendCardProps {
  /** 범례 도트 색. PMC 차트가 쓰는 데이터 시각화 토큰과 같은 값이어야 한다 */
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
    <Card>
      <div className="mb-2 flex items-center gap-2">
        <span
          aria-hidden
          className="inline-flex w-3 rounded-full aspect-square"
          style={{ backgroundColor: dotColor }}
        />
        <Text type="label">{label}</Text>
      </div>
      <Text type="supporting" display="block">
        {description}
      </Text>
      <Text type="supporting" color="disabled" display="block">
        {guide}
      </Text>
    </Card>
  )
}
