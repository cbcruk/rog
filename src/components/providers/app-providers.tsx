'use client'

import Link from 'next/link'
import { Theme } from '@astryxdesign/core/theme'
import { LinkProvider } from '@astryxdesign/core/Link'
import { InternationalizationProvider } from '@astryxdesign/core/i18n'
import koKR from '@astryxdesign/core/locales/ko-KR.json'
import { rogTheme } from '@/theme/built/rog'

interface AppProvidersProps {
  children: React.ReactNode
}

/**
 * Astryx 테마·로케일·라우터 링크 어댑터를 앱 전체에 건다.
 *
 * - 테마: 빌드 산출물(`src/theme/built/`)이라 런타임 스타일 주입 없이 SSR 첫 페인트에 적용된다.
 *   `mode="system"`이라 색상 모드는 OS 설정을 그대로 따른다.
 * - 로케일: Astryx가 자체적으로 그리는 문구("선택 사항", "검색", 날짜 선택기 등)를 한국어로 맞춘다.
 *   앱 자체 문구는 여전히 소스에 하드코딩된 한국어를 쓴다.
 * - 링크: Astryx가 `<a>` 대신 next/link를 쓰게 해서 Link·Button href·TopNavItem이
 *   클라이언트 사이드 내비게이션을 유지하게 한다.
 */
export function AppProviders({ children }: AppProvidersProps): React.ReactElement {
  return (
    <Theme theme={rogTheme} mode="system">
      <InternationalizationProvider locale="ko-KR" messages={{ 'ko-KR': koKR }}>
        <LinkProvider component={Link}>{children}</LinkProvider>
      </InternationalizationProvider>
    </Theme>
  )
}
