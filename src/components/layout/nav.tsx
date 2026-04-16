'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BarChart3, ClipboardList, Settings } from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: '대시보드', icon: BarChart3 },
  { href: '/sessions', label: '세션', icon: ClipboardList },
  { href: '/settings', label: '설정', icon: Settings },
]

/**
 * 글로벌 상단 네비게이션.
 * 현재 경로에 해당하는 항목을 활성 상태로 표시합니다.
 */
export function Nav(): React.ReactElement {
  const pathname = usePathname()

  return (
    <nav className="sticky top-0 z-50 border-b bg-background">
      <div className="flex h-12 items-center gap-1 px-4 lg:px-6">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href)

          return (
            <Link
              key={href}
              href={href}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors ${
                active
                  ? 'bg-foreground/10 font-medium text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="size-4" />
              {label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
