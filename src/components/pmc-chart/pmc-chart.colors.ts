/**
 * PMC 차트 시리즈 색.
 *
 * Astryx의 데이터 시각화 전용 토큰을 쓴다. 이 토큰들은 UI 색(accent/status)과 달리
 * 계열끼리 구분이 잘 되도록 조정돼 있고 light/dark 모두에서 대비가 보장된다.
 * 범례(`PMCLegend`)와 차트가 같은 값을 읽도록 여기 한 곳에만 둔다.
 */
export const PMC_SERIES_COLOR = {
  ctl: 'var(--color-data-categorical-blue)',
  atl: 'var(--color-data-categorical-pink)',
  tsb: 'var(--color-data-categorical-green)',
} as const

/** 축·그리드·기준선처럼 데이터가 아닌 차트 크롬에 쓰는 색 */
export const CHART_CHROME_COLOR = {
  grid: 'var(--color-border-emphasized)',
  axis: 'var(--color-text-secondary)',
} as const
