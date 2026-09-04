import { AppShell } from '@astryxdesign/core/AppShell'
import { Nav } from './nav'

interface MainLayoutProps {
  children: React.ReactNode
}

/**
 * 앱 프레임. 상단 네비게이션과 본문 영역을 AppShell이 소유하고,
 * 각 라우트는 본문 콘텐츠만 책임진다.
 *
 * `height="auto"`는 셸이 콘텐츠만큼 자라면서 네비게이션만 sticky로 붙이는 모드다.
 * 대시보드·프로그램 화면이 페이지 스크롤을 그대로 쓰기 때문에 뷰포트를 꽉 채우는
 * 기본값(`fill`) 대신 이쪽을 쓴다.
 */
export function MainLayout({ children }: MainLayoutProps): React.ReactElement {
  return (
    <AppShell topNav={<Nav />} height="auto" variant="section">
      {children}
    </AppShell>
  )
}
