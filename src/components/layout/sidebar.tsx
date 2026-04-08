'use client'

import { Activity, Calendar, List, Settings } from 'lucide-react'
import { NavLink, MobileNavLink } from './nav-link'

const navItems = [
  { href: '/dashboard', icon: Activity, label: 'Dashboard' },
  { href: '/calendar', icon: Calendar, label: 'Calendar' },
  { href: '/', icon: List, label: 'Sessions', exact: true },
  { href: '/settings', icon: Settings, label: 'Settings' },
]

export function Sidebar(): React.ReactElement {
  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-16 flex-col border-r bg-background lg:flex lg:w-56">
      <div className="flex h-14 items-center border-b px-4">
        <span className="hidden text-lg font-bold lg:inline">ROG</span>
        <span className="text-lg font-bold lg:hidden">R</span>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-2">
        {navItems.map((item) => (
          <NavLink key={item.href} {...item} />
        ))}
      </nav>
    </aside>
  )
}

export function MobileNav(): React.ReactElement {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t bg-background px-2 pb-safe lg:hidden">
      {navItems.map((item) => (
        <MobileNavLink key={item.href} {...item} />
      ))}
    </nav>
  )
}
