# ROG (Running Log)

Garmin FIT 파일 분석기 - Bakken Norwegian Model 훈련 추적

## Claude Code 구조

```
.claude/
├── settings.local.json     # 로컬 권한 설정
└── skills/
    └── run/
        ├── SKILL.md            # 스킬 정의 및 워크플로우
        └── training-context.md # 훈련 컨텍스트
```

### `/run` 스킬

러닝 훈련 분석 및 Bakken 노르웨이 모델 기반 코칭 피드백 제공

```bash
/run           # 최신 세션 분석
/run 2025-03-10 # 특정 날짜 세션 분석
```

**워크플로우:**

1. `data/` 폴더의 FIT 파일 확인
2. `pnpm analyze`로 JSON 생성
3. 세션 유형 분류 (Easy, Threshold, Long Run 등)
4. 코칭 피드백 생성 및 `results/{date}/feedback.md`에 저장

**분석 항목:**

- Z2 체류 시간 (역치 세션 핵심)
- Z3 침범 여부
- 페이스 일관성 (CV)
- 스플릿 전략 (negative/positive)
- Cardiac Drift

### 훈련 컨텍스트

`training-context.md`에 정의된 러너 프로필:

- 심박 존 설정 (LT1 ≈ 150, LT2 ≈ 163)
- Bakken 핵심 원칙
- 세션 종료 기준
- 목표 및 시뮬레이션
