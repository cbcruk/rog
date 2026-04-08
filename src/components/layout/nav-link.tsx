'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavLinkProps {
  href: string
  icon: LucideIcon
  label: string
  exact?: boolean
}

export function NavLink({
  href,
  icon: Icon,
  label,
  exact = false,
}: NavLinkProps): React.ReactElement {
  const pathname = usePathname()
  const isActive = exact ? pathname === href : pathname.startsWith(href)

  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
        isActive
          ? 'bg-foreground/10 text-foreground font-medium'
          : 'text-muted-foreground hover:bg-foreground/5 hover:text-foreground',
      )}
    >
      <Icon className="size-5" />
      <span className="hidden lg:inline">{label}</span>
    </Link>
  )
}

export function MobileNavLink({
  href,
  icon: Icon,
  label,
  exact = false,
}: NavLinkProps): React.ReactElement {
  const pathname = usePathname()
  const isActive = exact ? pathname === href : pathname.startsWith(href)

  return (
    <Link
      href={href}
      className={cn(
        'flex flex-col items-center gap-1 py-2 text-xs transition-colors',
        isActive ? 'text-foreground' : 'text-muted-foreground/60 hover:text-muted-foreground',
      )}
    >
      <Icon className="size-5" />
      <span>{label}</span>
    </Link>
  )
}
