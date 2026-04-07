import { Sidebar, MobileNav } from './sidebar'

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps): React.ReactElement {
  return (
    <div className="min-h-screen bg-bg">
      <Sidebar />
      <MobileNav />
      <main className="pb-20 lg:ml-56 lg:pb-0">{children}</main>
    </div>
  )
}
