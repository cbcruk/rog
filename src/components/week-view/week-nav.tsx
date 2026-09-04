'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@astryxdesign/core/Button'
import { Icon } from '@astryxdesign/core/Icon'
import { IconButton } from '@astryxdesign/core/IconButton'

interface WeekNavProps {
  /** 현재 보고 있는 주의 오프셋. 0이면 이번 주 */
  offset: number
  minOffset: number
  maxOffset: number
}

/**
 * 주 이동 컨트롤.
 *
 * lucide 아이콘 컴포넌트를 Astryx `Icon`에 넘기려면 이 파일이 클라이언트 모듈이어야 한다.
 * 서버 컴포넌트에서 넘기면 함수 참조가 RSC 경계를 넘지 못해 직렬화 오류가 난다.
 * 링크 자체는 LinkProvider가 next/link로 렌더하므로 클라이언트 사이드 내비게이션이 유지된다.
 */
export function WeekNav({ offset, minOffset, maxOffset }: WeekNavProps): React.ReactElement {
  return (
    <div className="flex items-center gap-1">
      <IconButton
        label="이전 주"
        tooltip="이전 주"
        size="sm"
        href={`/week?offset=${Math.max(minOffset, offset - 1)}`}
        icon={<Icon icon={ChevronLeft} size="sm" />}
      />
      {offset !== 0 && <Button label="이번 주" size="sm" href="/week" />}
      <IconButton
        label="다음 주"
        tooltip="다음 주"
        size="sm"
        href={`/week?offset=${Math.min(maxOffset, offset + 1)}`}
        icon={<Icon icon={ChevronRight} size="sm" />}
      />
    </div>
  )
}
