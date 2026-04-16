import { Nav } from './nav'

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps): React.ReactElement {
  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <main>{children}</main>
    </div>
  )
}
