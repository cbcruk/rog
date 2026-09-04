import './layers.css'
import './globals.css'
import type { Metadata } from 'next'
import { Noto_Sans_KR } from 'next/font/google'
import { AppProviders } from '@/components/providers'
import { MainLayout } from '@/components/layout/main-layout'

interface RootLayoutProps {
  children: React.ReactNode
}

/**
 * 본문 서체. `src/theme/rog.ts`가 `--font-noto-sans-kr`을 Astryx 본문/제목
 * 폰트 토큰으로 받아 쓰므로 변수 이름이 바뀌면 테마를 다시 빌드해야 한다.
 */
const notoSans = Noto_Sans_KR({
  weight: ['400', '500', '700', '900'],
  subsets: ['latin'],
  variable: '--font-noto-sans-kr',
  preload: false,
})

export const metadata: Metadata = {
  title: '은수리의 러닝 다이어리',
  description: 'Bakken 노르웨이 모델 기반 러닝 훈련 분석 및 코칭',
}

export default function RootLayout({ children }: Readonly<RootLayoutProps>): React.ReactElement {
  return (
    /*
     * `data-astryx-theme`는 Astryx <Theme>가 하이드레이션 때 <html>에 다시 쓰는 값이다.
     * 서버에서 미리 박아두면 포털(툴팁·다이얼로그)까지 첫 페인트부터 테마 범위에 들어온다.
     * 색상 모드는 mode="system"이라 data-theme 없이 color-scheme으로 결정된다.
     */
    <html lang="ko" data-astryx-theme="rog" className={notoSans.variable}>
      <body>
        <AppProviders>
          <MainLayout>{children}</MainLayout>
        </AppProviders>
      </body>
    </html>
  )
}
