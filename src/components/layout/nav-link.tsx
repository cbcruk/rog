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
        isActive ? 'bg-tx/10 text-tx font-medium' : 'text-tx-2 hover:bg-tx/5 hover:text-tx',
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
        isActive ? 'text-tx' : 'text-tx-3 hover:text-tx-2',
      )}
    >
      <Icon className="size-5" />
      <span>{label}</span>
    </Link>
  )
}
