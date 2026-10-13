'use client'

import { usePathname } from 'next/navigation'
import { BarChart3, CalendarCheck, CalendarRange, ClipboardList, Settings } from 'lucide-react'
import { TopNav, TopNavHeading, TopNavItem } from '@astryxdesign/core/TopNav'
import { Icon } from '@astryxdesign/core/Icon'

const navItems = [
  { href: '/dashboard', label: '대시보드', icon: BarChart3 },
  { href: '/week', label: '이번 주', icon: CalendarCheck },
  { href: '/program', label: '프로그램', icon: CalendarRange },
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
    <TopNav
      label="주요 메뉴"
      heading={<TopNavHeading>러닝 다이어리</TopNavHeading>}
      startContent={navItems.map(({ href, label, icon }) => (
        <TopNavItem
          key={href}
          href={href}
          label={label}
          icon={<Icon icon={icon} size="sm" />}
          isSelected={pathname.startsWith(href)}
        />
      ))}
    />
  )
}
