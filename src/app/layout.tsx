import './globals.css'
import type { Metadata } from 'next'
import { Noto_Sans_KR, Geist } from 'next/font/google'
import type { RootLayoutProps } from './layout.types'
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const notoSans = Noto_Sans_KR({
  weight: ['400', '500', '900'],
  preload: false,
})

export const metadata: Metadata = {
  title: '은수리의 러닝 다이어리',
  description: 'Bakken 노르웨이 모델 기반 러닝 훈련 분석 및 코칭',
}

export default function RootLayout({ children }: Readonly<RootLayoutProps>) {
  return (
    <html lang="ko" className={cn("font-sans", geist.variable)}>
      <body className={`${notoSans.className} antialiased`}>{children}</body>
    </html>
  )
}
