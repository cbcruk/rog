---
name: season
description: 시즌 진척도를 분석하고 훈련 추세를 리포트합니다
argument-hint: '[기간]'
---

# 시즌 분석 스킬

## 목적

SQLite 데이터베이스에 저장된 전체 세션 데이터를 분석하여 시즌 진척도를 리포트합니다.

## 워크플로우

### 1. 기간 설정

- 인자가 있으면: 해당 기간으로 분석 (예: `3m` = 3개월, `6w` = 6주)
- 인자가 없으면: 최근 12주 분석

### 2. 데이터 조회

`lib/db.mjs`의 함수들을 활용:

```javascript
import {
  getWeeklyVolume,
  getMonthlyTrend,
  getConsecutiveHardSessions,
  getSeasonStats,
} from './lib/db.mjs'
```

### 3. 분석 항목

#### 볼륨 추세

```sql
SELECT
  strftime('%Y-W%W', date) as week,
  COUNT(*) as sessions,
  SUM(distance) as distance,
  SUM(duration_seconds) / 3600.0 as hours
FROM sessions
WHERE date >= date('now', '-12 weeks')
GROUP BY week
ORDER BY week
```

평가 기준:

- 주간 볼륨 변화율 10% 이내: 안정적
- 20% 이상 급증: 볼륨 점프 경고
- 감소 추세: 회복기 또는 부상 신호

#### 평균 심박 추세

- 같은 페이스에서 심박 감소: 심폐 적응 진행 중
- 같은 페이스에서 심박 증가: 피로 누적 또는 오버트레이닝

#### 연속 하드 세션 패턴

```sql
SELECT date, avg_hr,
       LAG(avg_hr) OVER (ORDER BY date) as prev_hr
FROM sessions
WHERE avg_hr > 150
ORDER BY date DESC
```

Bakken 원칙 위반 감지:

- 이틀 연속 Z2+ 세션 감지 시 경고
- "하드 → 이지 규율" 준수 여부 평가

#### 일관성 추세

- consistency_cv 평균 추적
- 개선 추세면 페이스 제어력 향상 신호

### 4. 출력 형식

```markdown
## 시즌 분석 리포트

**분석 기간**: [시작일] ~ [종료일]

### 볼륨 요약

| 항목        | 값              |
| ----------- | --------------- |
| 총 세션     | [count]         |
| 총 거리     | [km]            |
| 총 시간     | [hours]         |
| 주평균 거리 | [km/week]       |
| 주평균 세션 | [sessions/week] |

### 주간 볼륨 추세

| 주차 | 세션 | 거리 | 시간 | 평균 HR |
| ---- | ---- | ---- | ---- | ------- |
| W01  | 4    | 42km | 4.2h | 148     |
| ...  | ...  | ...  | ...  | ...     |

### 심폐 적응 지표

- 평균 심박 추세: [상승/하락/유지]
- 같은 페이스 대비 HR 변화: [bpm]

### Bakken 원칙 준수

- 연속 하드 세션 횟수: [count]
- 하드 → 이지 규율 준수율: [%]

### 코칭 포인트

1. **[항목]**: [구체적 피드백]
2. **[항목]**: [구체적 피드백]
```

## 참고사항

- DB가 없으면 먼저 `pnpm db:sync` 실행 안내
- 한국어로 출력
- Bakken 모델 원칙에 기반한 평가
