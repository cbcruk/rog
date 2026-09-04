import { defineTheme } from '@astryxdesign/core/theme'
import { neutralTheme } from '@astryxdesign/theme-neutral'

/**
 * rog 테마. Astryx neutral을 그대로 상속하고 본문/제목 서체만 한글 서체로 바꾼다.
 *
 * `--font-noto-sans-kr`은 `src/app/layout.tsx`의 next/font가 선언하는 CSS 변수다.
 * 빌드 산출물(`rog.css` / `rog.js`)은 SSR 첫 페인트에 테마가 이미 적용되도록
 * `astryx theme build`로 생성한다. 소스를 고치면 반드시 다시 빌드해야 한다.
 */
export const rogTheme = defineTheme({
  name: 'rog',
  extends: neutralTheme,
  typography: {
    body: {
      family: 'var(--font-noto-sans-kr)',
      fallbacks: 'system-ui, -apple-system, "Apple SD Gothic Neo", "Malgun Gothic", sans-serif',
    },
    heading: {
      family: 'var(--font-noto-sans-kr)',
      fallbacks: 'system-ui, -apple-system, "Apple SD Gothic Neo", "Malgun Gothic", sans-serif',
    },
  },
})
