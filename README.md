# bb-budget 💰

유리님과 함께 만드는 가계부 PWA. 기존 Google Sheets "빵계부" 대체.

> 모바일 입력이 불편해서 → 직접 만든다.

## Stack

| Layer | 선택 | 이유 |
|-------|------|------|
| Frontend | Next.js + TypeScript + Tailwind | 표준 스택, PWA 지원 |
| DB | Supabase (public 스키마, RLS 활성) | 무료 플랜 |
| Deploy | Vercel | git push 자동 배포 |
| Charts | recharts | 리포트 그래프 |

## 컬러 시스템

| 용도 | 변수 | 값 |
|------|------|-----|
| 지출 | accent-coral | #CF6679 |
| 수입 | accent-blue | #5865F2 |
| 저축 | accent-mint | #2dd4bf |
| 배경 (다크) | background | #0a0f1a |
| 카드 (다크) | surface | #141c28 |
| 버튼/pill (다크) | muted | #1f2937 |

## 페이지 구조 (2026-04-02)

### 탭바
- **일간** (`/`) — 달력 + 일별 거래 내역
- **월간** (`/history`) — 요약 카드 슬라이더 + 주차별 아코디언
- **연간** (`/yearly`) — 연간 요약 + 월별 카드
- **+** 버튼 — 거래 추가 모달

### 상단 바 (3페이지 공통)
- 좌: 대시보드 아이콘
- 우: 검색 아이콘 + 설정 아이콘
- 타이틀: `<select>` 네이티브 연/월 선택 + 꺽쇠 아이콘
- 오늘/금월/금년 버튼

### 일간 (app/page.tsx)
- 달력: MonthlyCalendar 컴포넌트 (세로 터치 슬라이더, anchor date 기반)
- `key={calKey}` — select 변경 시만 리마운트, 스와이프 시엔 유지
- `selectChangingRef` — select↔달력 hook 중첩 방지
- 달력 위 = `bg-background`, 달력 아래 = `bg-surface`
- 날짜 헤더 + 금액 + 꺽쇠 토글 → 거래 내역

### 월간 (app/history/page.tsx → 201줄)
- **요약 카드 슬라이더**: 수입/지출/저축/잔액 4장 (각 컬러 배경 + 3D 이미지)
  - KIA ControlSlider 패턴 터치 구현 (수직/수평 방향 감지 분리)
  - 전월 대비 멘트 ("N-1월보다 OOO만 원 더 벌었어요")
  - 도트 인디케이터
- **주차별 아코디언**: WeekAccordion 컴포넌트
- **리팩토링 완료**: MonthlyView / WeekAccordion / TxRow 컴포넌트 분리

### 연간 (app/yearly/page.tsx)
- 연간 수입/지출/저축/잔액 요약 카드
- 월별 카드 (클릭 → 월간으로 이동)
- 연도 `<select>` 선택

### 대시보드 (app/dashboard/page.tsx)
- BalanceCard: 분할 바 + 전월/금월 잔액
- MonthlySummaryCard: 바 차트 요약
- 하단 "리포트 (임시)" 버튼

### 기록하기/수정하기 (components/add-transaction-modal.tsx)
- 금액/날짜/카테고리/메모/반복 입력
- 최근 카테고리 chip (TOP 5)
- CategoryPicker: 수정 모드 진입 시 선택된 카테고리 부모 자동 펼침
- 저축 회수 바텀시트

### 리포트 (app/report/page.tsx)
- 4개 카드 아코디언 (총자산, 수입·지출 추이, 지출/수입 카테고리 분석)
- recharts 차트 (BarChart, LineChart)
- 대시보드에서 임시 버튼으로 진입

## 주요 컴포넌트

| 컴포넌트 | 파일 | 역할 |
|----------|------|------|
| MonthlyCalendar | components/monthly-calendar.tsx | 세로 터치 슬라이더 달력 |
| MonthlyView | components/monthly-view.tsx | 월간 전체 뷰 (요약 + 주차) |
| WeekAccordion | components/week-accordion.tsx | 주차별 아코디언 |
| TxRow | components/tx-row.tsx | 개별 거래 행 (스와이프 삭제) |
| SummaryCardSlider | components/summary-card-slider.tsx | 요약 카드 4장 슬라이더 |
| BalanceCard | components/balance-summary-card.tsx | 잔액 카드 (대시보드) |
| CategoryPicker | components/category-picker.tsx | 카테고리 2depth 선택 |
| AddTransactionModal | components/add-transaction-modal.tsx | 거래 추가/수정 모달 |
| BottomNav | components/bottom-nav.tsx | 일간/월간/연간/+ 탭바 |

## 자산 로직

- 초기자산 ₩85,351,278 = 1월 1일 수입(income)으로 DB 기록
- 총자산 = 누적 수입 - 누적 지출
- 잔액(가용현금) = 총자산 - 운용자산(저축)
- 운용자산 = 활성 저축 합계 (end_date 없는 것만)
- 실질 수입 = 수입 - 저축

## DB 테이블

### public.transactions
- id, type (income/expense/savings), amount, category_id, description, date, created_at, end_date

### public.categories
- id, name, type, parent_id, icon, sort_order, created_at

### public.recurring_transactions
- id, type, amount, category_id, description, day_of_month, active, created_at

### RLS
- 3개 테이블 모두 RLS 활성화 + `allow all` policy (인증 없이 사용하는 앱)

## 디자인 규칙

- 타이틀 letter-spacing: -1px
- 요약 카드 금액 letter-spacing: -1px, 24px bold
- 페이지 타이틀: 28px bold (네이티브 `<select>`)
- rounded-2xl 전체 통일
- 탭바: `#2C2C2E` (dark), border white/10
- 하단 여백: pb-32

## 요약 카드 이미지

| 카드 | 배경색 | 이미지 |
|------|--------|--------|
| 수입 | #5865F2 | /card-income.png |
| 지출 | #FF70FF | /card-expense.png |
| 저축 | #2dd4bf | /card-saving.png |
| 잔액 | #2C2C2E | /card-balance.png |

## Roadmap

### Phase 1 — MVP ✅
### Phase 2 — 뷰 개선 + 분석 ✅
### Phase 3 — 확장
- [ ] PWA 아이콘 추가
- [ ] 반복 지출 frequency DB 컬럼
- [ ] 카드 결제 SMS 자동 파싱
- [ ] 예산 설정 + 잔여 예산 표시
- [ ] 2인 공유 (형주 + 유리님)

## 남은 이슈

1. PWA 아이콘 — icon-192.png, icon-512.png 없음
2. 반복 지출 frequency DB 컬럼 (매주/매년 구분)
3. 반복 지출 start_date/end_date 컬럼 추가
4. 라이트 모드 세부 조정 미완
5. Pull to refresh 스피너 — Tailwind v4 animate-spin 미동작, 인라인 animation 우회 중
6. 미사용 컴포넌트 정리 (date-picker-inline.tsx, date-picker-sheet.tsx, date-picker-modal.tsx, monthly-calendar.old.tsx)
