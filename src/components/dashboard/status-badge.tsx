import { Badge } from '@/components/ui/badge'
import type { FitnessStatus } from '@/types/pmc'

interface StatusBadgeProps {
  /** 피트니스 상태 객체 (status 키와 표시용 label 포함) */
  fitnessStatus: FitnessStatus
}

/**
 * 피트니스 상태를 색상으로 구분된 배지로 표시합니다.
 * status 키로 색상을 결정하고, label을 표시 텍스트로 사용합니다.
 */
export function StatusBadge({ fitnessStatus }: StatusBadgeProps): React.ReactElement {
  return <Badge variant={fitnessStatus.status}>{fitnessStatus.label}</Badge>
}
