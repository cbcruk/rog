'use client'

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { TableHead } from '@/components/ui/table'
import { cn } from '@/lib/utils'

interface TableHeadTooltipProps {
  label?: string
  icon?: React.ReactNode
  description: string
  className?: string
}

export function TableHeadTooltip({
  label,
  icon,
  description,
  className,
}: TableHeadTooltipProps): React.ReactElement {
  if (!label && !icon) {
    return <TableHead className={cn(className)} />
  }

  const isRightAligned = className?.includes('text-right')

  return (
    <TableHead className={cn(className)}>
      <Tooltip>
        <TooltipTrigger
          className={cn(
            'flex items-center gap-1',
            isRightAligned && 'ml-auto'
          )}
        >
          {icon}
          {label}
        </TooltipTrigger>
        <TooltipContent>{description}</TooltipContent>
      </Tooltip>
    </TableHead>
  )
}
