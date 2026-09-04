'use client'

/*
 * lucide 아이콘 컴포넌트를 Astryx `Icon`에 넘기려면 클라이언트 모듈이어야 한다.
 * 서버 컴포넌트에서 넘기면 함수 참조가 RSC 경계를 넘지 못해 직렬화 오류가 난다.
 */

import { Activity } from 'lucide-react'
import { Button } from '@astryxdesign/core/Button'
import { EmptyState as AstryxEmptyState } from '@astryxdesign/core/EmptyState'
import { Icon } from '@astryxdesign/core/Icon'

/**
 * PMC 데이터가 없을 때 대시보드에 표시되는 빈 상태 엘리먼트.
 * 동기화 명령어 안내와 설정 페이지 링크를 제공합니다.
 */
export const EmptyState = (
  <AstryxEmptyState
    icon={<Icon icon={Activity} size="lg" color="secondary" />}
    headingLevel={2}
    title="데이터가 없습니다"
    description="세션의 TSS와 PMC를 계산하려면 `pnpm db:sync --tss`를 실행하세요."
    actions={<Button label="설정으로 이동" variant="primary" href="/settings" />}
  />
)
