import { Badge } from '@astryxdesign/core/Badge'
import type { FitnessStatus } from '@/types/pmc'

interface StatusBadgeProps {
  /** 피트니스 상태 객체 (status 키와 표시용 label 포함) */
  fitnessStatus: FitnessStatus
}

/**
 * 피트니스 상태별 배지 색.
 *
 * 회복 정도를 초록 → 파랑 → 노랑 → 주황 → 빨강 순서로 읽히게 배치했다.
 * Astryx의 semantic 변형(success/warning/error)은 "사용자가 조치해야 하는 상태"
 * 전용이라, 정상 범위인 fresh/recovered/neutral에는 색상 태그 변형을 쓴다.
 */
const BADGE_VARIANT = {
  fresh: 'green',
  recovered: 'blue',
  neutral: 'yellow',
  tired: 'orange',
  overreaching: 'error',
  unknown: 'gray',
} as const

/**
 * 피트니스 상태를 색상으로 구분된 배지로 표시합니다.
 * status 키로 색상을 결정하고, label을 표시 텍스트로 사용합니다.
 */
export function StatusBadge({ fitnessStatus }: StatusBadgeProps): React.ReactElement {
  return <Badge variant={BADGE_VARIANT[fitnessStatus.status]} label={fitnessStatus.label} />
}
