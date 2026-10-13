'use client'

/*
 * lucide 아이콘 컴포넌트를 Astryx `Icon`에 넘기려면 클라이언트 모듈이어야 한다.
 * 서버 컴포넌트에서 넘기면 함수 참조가 RSC 경계를 넘지 못해 직렬화 오류가 난다.
 */

import { AlertTriangle, Info, Lightbulb } from 'lucide-react'
import { Card } from '@astryxdesign/core/Card'
import { Heading } from '@astryxdesign/core/Heading'
import { Icon } from '@astryxdesign/core/Icon'
import { Text } from '@astryxdesign/core/Text'
import type { Recommendation } from '@/lib/recommendations'

interface RecommendationsCardProps {
  recommendations: Recommendation[]
}

const ICON_MAP = {
  warning: { icon: AlertTriangle, color: 'warning' },
  suggestion: { icon: Lightbulb, color: 'accent' },
  info: { icon: Info, color: 'secondary' },
} as const

/**
 * 현재 훈련 상태 기반 추천 목록을 표시하는 카드.
 */
export function RecommendationsCard({
  recommendations,
}: RecommendationsCardProps): React.ReactElement {
  return (
    <Card>
      <Heading level={2}>이번 주 훈련 추천</Heading>
      <ul className="mt-3 flex flex-col gap-2">
        {recommendations.map((rec, i) => {
          const { icon, color } = ICON_MAP[rec.type]

          return (
            <li key={i} className="flex items-start gap-2">
              <span className="mt-0.5 shrink-0">
                <Icon icon={icon} size="sm" color={color} />
              </span>
              <Text>{rec.message}</Text>
            </li>
          )
        })}
      </ul>
    </Card>
  )
}
