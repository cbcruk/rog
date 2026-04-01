import type { PMCDataPoint } from '@/types/pmc'

export interface PMCChartProps {
  data: PMCDataPoint[]
  height?: number
  showLegend?: boolean
}

export interface PMCTooltipPayload {
  name: string
  value: number
  color: string
}
