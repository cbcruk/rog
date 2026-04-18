import { AlertTriangle, Info, Lightbulb } from 'lucide-react'
import type { Recommendation } from '@/lib/recommendations'

interface RecommendationsCardProps {
  recommendations: Recommendation[]
}

const iconMap = {
  warning: { Icon: AlertTriangle, color: 'text-orange' },
  suggestion: { Icon: Lightbulb, color: 'text-blue' },
  info: { Icon: Info, color: 'text-muted-foreground' },
}

/**
 * 현재 훈련 상태 기반 추천 목록을 표시하는 카드.
 */
export function RecommendationsCard({
  recommendations,
}: RecommendationsCardProps): React.ReactElement {
  return (
    <div className="mb-6 rounded-lg border bg-muted p-4">
      <h2 className="mb-3 text-sm font-medium text-muted-foreground">이번 주 훈련 추천</h2>
      <ul className="space-y-2">
        {recommendations.map((rec, i) => {
          const { Icon, color } = iconMap[rec.type]
          return (
            <li key={i} className="flex items-start gap-2">
              <Icon className={`mt-0.5 size-4 shrink-0 ${color}`} />
              <span className="text-sm">{rec.message}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
