import type { Metadata } from 'next'
import { Noto_Sans_KR } from 'next/font/google'
import './globals.css'

const notoSans = Noto_Sans_KR({
  weight: ['400', '500', '900'],
  preload: false,
})

export const metadata: Metadata = {
  title: 'Running Log',
  description: 'Bakken Norwegian Model Training Log',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko">
      <body className={`${notoSans.className} antialiased`}>{children}</body>
    </html>
  )
}
