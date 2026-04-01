import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground',
        secondary: 'bg-secondary text-secondary-foreground',
        destructive: 'bg-destructive text-destructive-foreground',
        outline: 'text-foreground',
        easy: 'bg-[var(--green)]/15 text-[var(--green)]',
        recovery: 'bg-[var(--green)]/15 text-[var(--green)]',
        moderate: 'bg-[var(--yellow)]/15 text-[var(--yellow)]',
        tempo: 'bg-[var(--orange)]/15 text-[var(--orange)]',
        threshold: 'bg-[var(--red)]/15 text-[var(--red)]',
        hard: 'bg-[var(--red)]/15 text-[var(--red)]',
        longRun: 'bg-[var(--blue)]/15 text-[var(--blue)]',
        progression: 'bg-[var(--purple)]/15 text-[var(--purple)]',
        trail: 'bg-[var(--cyan)]/15 text-[var(--cyan)]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

export interface BadgeProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({
  className,
  variant,
  ...props
}: BadgeProps): React.ReactElement {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
