import { Tooltip } from '@astryxdesign/core/Tooltip'

interface TermLabelProps {
  /** 표시할 용어 텍스트 */
  term: string
  /** 툴팁에 표시할 정의/설명 */
  definition: string
}

/**
 * 용어를 표시하고 hover 시 정의를 툴팁으로 보여줍니다.
 * 점선 밑줄(hover 힌트)은 Tooltip이 직접 그립니다.
 */
export function TermLabel({ term, definition }: TermLabelProps): React.ReactElement {
  return (
    <Tooltip content={definition} touchTrigger="tap">
      <span>{term}</span>
    </Tooltip>
  )
}
