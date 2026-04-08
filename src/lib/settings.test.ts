import { describe, it, expect } from 'vite-plus/test'
import { formatPaceFromSeconds, parsePaceToSeconds } from './settings'

describe('formatPaceFromSeconds', () => {
  it('초를 M:SS 형식으로 변환한다', () => {
    expect(formatPaceFromSeconds(270)).toBe('4:30')
    expect(formatPaceFromSeconds(300)).toBe('5:00')
    expect(formatPaceFromSeconds(345)).toBe('5:45')
  })

  it('0초를 0:00으로 변환한다', () => {
    expect(formatPaceFromSeconds(0)).toBe('0:00')
  })

  it('60초 미만을 0:SS로 변환한다', () => {
    expect(formatPaceFromSeconds(45)).toBe('0:45')
  })
})

describe('parsePaceToSeconds', () => {
  it('M:SS 형식을 초로 변환한다', () => {
    expect(parsePaceToSeconds('4:30')).toBe(270)
    expect(parsePaceToSeconds('5:00')).toBe(300)
    expect(parsePaceToSeconds('5:45')).toBe(345)
  })

  it('초가 없으면 분만 변환한다', () => {
    expect(parsePaceToSeconds('5')).toBe(300)
  })

  it('formatPaceFromSeconds와 역변환이 성립한다', () => {
    for (const sec of [240, 270, 300, 330, 345]) {
      expect(parsePaceToSeconds(formatPaceFromSeconds(sec))).toBe(sec)
    }
  })
})
