import './globals.css'
import type { Metadata } from 'next'
import { Noto_Sans_KR } from 'next/font/google'
import { cn } from '@/lib/utils'
import { TooltipProvider } from '@/components/ui/tooltip'
import { MainLayout } from '@/components/layout/main-layout'

interface RootLayoutProps {
  children: React.ReactNode
}

const notoSans = Noto_Sans_KR({
  weight: ['400', '500', '900'],
  preload: false,
})

export const metadata: Metadata = {
  title: '은수리의 러닝 다이어리',
  description: 'Bakken 노르웨이 모델 기반 러닝 훈련 분석 및 코칭',
}

export default function RootLayout({ children }: Readonly<RootLayoutProps>): React.ReactElement {
  return (
    <html lang="ko" className={cn('font-sans', notoSans.className)}>
      <body className="antialiased">
        <TooltipProvider>
          <MainLayout>{children}</MainLayout>
        </TooltipProvider>
      </body>
    </html>
  )
}
