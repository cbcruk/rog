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
        fresh: 'border border-green/20 bg-green/10 text-green',
        recovered: 'border border-blue/20 bg-blue/10 text-blue',
        neutral: 'border border-yellow/20 bg-yellow/10 text-yellow',
        tired: 'border border-orange/20 bg-orange/10 text-orange',
        overreaching: 'border border-red/20 bg-red/10 text-red',
        unknown: 'bg-muted-foreground/10 text-muted-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps): React.ReactElement {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
