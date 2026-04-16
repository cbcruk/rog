import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

interface TermLabelProps {
  /** 표시할 용어 텍스트 */
  term: string
  /** 툴팁에 표시할 정의/설명 */
  definition: string
}

/**
 * 점선 밑줄과 함께 용어를 표시하고 hover 시 정의를 툴팁으로 보여줍니다.
 */
export function TermLabel({ term, definition }: TermLabelProps): React.ReactElement {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <span className="cursor-help underline decoration-dotted decoration-muted-foreground/50 underline-offset-4" />
        }
      >
        {term}
      </TooltipTrigger>
      <TooltipContent>{definition}</TooltipContent>
    </Tooltip>
  )
}
