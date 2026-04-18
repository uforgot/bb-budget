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

## 페이지 구조 (updated 2026-04-10)

### 탭바
- **홈(`/`)** → `/history` redirect
- **월간** (`/history`) — 주간/달력 전환 중심 메인 화면
- **연간** (`/yearly`) — 연간 요약 + 월별 그래프
- **+** 버튼 — 거래 추가 모달

### 상단 바
- 월간: 좌측 달력 토글 아이콘, 우측 검색/설정, 타이틀 옆 오늘 버튼
- 연간: 우측 검색/설정, 연도 선택 + 오늘 버튼
- 대시보드 페이지는 제거되고 `/dashboard`는 `/history`로 redirect

### 일간 (app/page.tsx)
- 달력: MonthlyCalendar 컴포넌트 (세로 터치 슬라이더, anchor date 기반)
- `key={calKey}` — select 변경 시만 리마운트, 스와이프 시엔 유지
- `selectChangingRef` — select↔달력 hook 중첩 방지
- 달력 위 = `bg-background`, 달력 아래 = `bg-surface`
- 날짜 헤더 + 금액 + 꺽쇠 토글 → 거래 내역

### 월간 (app/history/page.tsx)
- **요약 카드 슬라이더**: 수입/지출/저축/잔액 4장
- **주간 뷰**: 주간 스트립 + 주간 수입/지출 카드 + 날짜별 상세 카드
- **달력 모드**: 월간 달력 + 선택 날짜 상세
- 좌상단 달력 아이콘으로 주간/달력 토글
- 우상단 `오늘` 버튼으로 현재 월/현재 주/오늘 날짜 복귀
- 미래 날짜도 주간 스트립에서 선택 가능

### 연간 (app/yearly/page.tsx)
- 연간 수입/지출/저축/잔액 요약 카드
- 지출/수입 단일 월별 그래프 박스 + 우상단 토글
- 비교 문구: `월 평균 NNN만 원 대비 ↑/↓ NNN만 원`
- 연도 `<select>` 선택 + 오늘 버튼

### 대시보드 (app/dashboard/page.tsx)
- 제거됨. 현재는 `/history`로 redirect.

### 기록하기/수정하기 (components/add-transaction-modal.tsx)
- 금액/날짜/카테고리/메모/반복 입력
- 최근 카테고리 chip (TOP 5)
- 반복 거래 생성 가능 (`frequency + anchor_date + end_date`)
- 반복 원본 거래 수정 시 반복 설정 변경 가능
- 반복 원본 거래 삭제 시 이후 예정 반복도 같이 제거되도록 cascade 처리
- 저축 회수는 인라인 UI
- 바텀시트형 거래 입력 UI 사용
- 닫힘 상태에서는 modal/backdrop DOM 자체를 unmount
- 열릴 때/닫힐 때 시트 애니메이션 유지 후 visible/unmount 제어
- 반복 선택은 인라인 드롭다운이 아니라 네이티브 시스템 picker/select 사용

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
- id, type, amount, category_id, description, frequency, anchor_date, end_date, active, created_at

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

## 2025 Google Sheets migration work (2026-04-15)

### What was done
- Read the live 2025 Google Sheets ledger and the current Supabase `categories` table, then built comparison sheets inside the same spreadsheet instead of overwriting the source tabs.
- Added these working sheets:
  - `2025-category-mapping` — old 2025 expense categories vs current app category structure
  - `current-expense-categories` — current app expense category list from Supabase
  - `2025-category-review` — row-level replacement targets for 2025 detail rows
  - `2025-ceremony-unmatched` — temporary review sheet for ceremony rows, later reduced to 0 unmatched detail rows
- Mapped all 2025 detail rows to current categories based on explicit review rules from 유리님.
- Excluded monthly aggregate rows from migration decisions and only treated detailed entries as source-of-truth.

### Key mapping rules finalized
- `건강-병원` → `건강-병원비`
- `건강-약국` → `건강-약국`
- `기타-샤미` → `반려동물`
- `기타-서울페이` → `생활-서울페이`
- `기타-잡비` → `생활-잡비`
- `꾸밈` → `쇼핑`, `꾸밈-헤어` → `쇼핑-미용`
- `대출-*` → `주거-대출`
- `부동산-부동산` → `주거-인테리어`
- `생활-구독료` → `통신-구독료`
- `생활-여가` → `여가`
- `생활-통신비` → `통신-통신비`
- `생활-학비` → `자녀-학비`
- `생활용품-기타용품` → `생활-생필품`
- `생활용품-아이용품` → `자녀-용품`
- `생활용품-가전/가구` → `생활-(가전/가구)`, decided by memo
- `차-주유` → `교통-주유비`
- `차-유지` → `교통-(정비/주차비 등)`, decided by memo
- `카드-농협카드` → `금융-농협 카드`
- `카드-기타카드` → `금융-기타 카드`
- `배유리청약 / 신형주청약` → `금융-청약` with note for owner
- `신형주적금` → `금융-적금`
- `배유리/신형주 보험` → `금융-보험`
- `신민아/신윤아 보험` → `자녀-보험`
- `배유리용돈 / 신형주용돈` → `생활-용돈` with note for owner
- `경조사` detailed rows were fully classified into concrete replacement targets such as `생일`, `명절`, `어머니 만남`, `결혼/조의/집들이`, with memo-based fallback handling

### Result
- Detailed 2025 rows reached **0 unmatched migration rows**.
- Remaining non-migration rows are monthly aggregate rows that were intentionally ignored.
- For 2025 import, the temporary conclusion discussed in chat was:
  - remove the already-entered `2026-01-01` initial asset row (`₩85,351,278`)
  - use the separately confirmed 2025 opening-asset logic when importing 2025 history

### Critical verification rule after 2025 migration work
- Never decide a mismatch from memo/description text alone.
- Row verification must use at least this tuple together:
  - `date`
  - `amount`
  - `description`
  - `category` when available
- If totals differ, compare both:
  - monthly total sum
  - row-level multiset (`date + amount + description`, or stronger)
- Do **not** delete or overwrite a DB row until the candidate mismatch is proven by amount-aware comparison.
- A real incident happened on `2026-04-16`: a row was wrongly deleted after comparing mainly by memo text, then had to be restored. Treat this as a hard rule, not a suggestion.

## Recent UX Changes (2026-04-14)

### Category management / editor polish
- Category management was reworked into a single-page 3-section layout: `지출 / 수입 / 저축`.
- Each section now has its own inline `+` add row instead of a global add button flow.
- Add-row behavior was refined so:
  - the row keeps the same height before/after click,
  - only the inner content changes from `+` to text input,
  - the row is center-aligned and uses the same vertical rhythm as other rows.
- Parent category rows now use inset dividers that start from the text column instead of full-width lines.
- Outer borders on rounded category boxes were removed. Only dividers remain.
- Category edit screen keeps internal divider separation, but outer rounded-box borders were removed.
- Chevron styles were unified across settings/category management/add transaction flows.
- Inline add actions were changed from text buttons to icon actions to avoid 2-line wrapping in narrow widths.

### History / today behavior / shared toolbar
- `오늘` on `/history` now preserves the current view mode.
  - In calendar mode, it jumps to the current month and selects today.
  - In monthly detail mode, it keeps monthly detail mode and selects today.
- The forced switch to week mode caused by `todayResetToken` logic in `components/monthly-view.tsx` was removed.
- Search/settings actions were extracted into a shared `TopToolbar` and applied across history, yearly, and analysis pages.
- Analysis search now opens inline inside the tab instead of navigating away.

### Yearly / charts
- Yearly chart mode was changed from 2 toggle buttons to a single dropdown.
- Chart types were expanded to `지출 / 수입 / 저축`.
- `MonthlyBarChart` gained `maxHeight` and customizable `comparisonText`, with special comparison copy for savings.

### Ongoing visual tuning done today
- Daily detail card spacing and divider spacing were tuned multiple times.
- Bottom tab/calendar/history icons were normalized (`Calendar`, `Calendar1`, `Calendars`).
- Category management affordances were adjusted several times:
  - default row = edit affordance,
  - edit mode = `Check`, `Trash2`, `X`, drag handle,
  - hit areas preserved while icons changed.

## Recent Transaction Sheet Tuning (2026-04-18)

### Bottom sheet / overlay behavior
- Add transaction UI was refactored into a near-fullscreen bottom sheet with rounded top corners.
- Background dim backdrop was removed from the add-transaction sheet after it caused the underlying page/tab bar to look dark even when the sheet logic was under investigation.
- Closed transaction sheets now fully unmount instead of staying in the DOM with pointer-events disabled.
- Opening/closing animation timing was adjusted so the sheet stays rendered through the close animation, then unmounts.
- Open animation and close animation now have separate visibility timing so the sheet feels native instead of abruptly appearing/disappearing.
- While the sheet is open, body/document scrolling and overscroll are locked so the monthly page behind it does not move and pull-to-refresh does not fire.
- Sheet shadow direction was changed to fall downward rather than bleeding upward into the top safe area.

### Header / actions
- Header controls were changed back to left back button + right delete button.
- Delete button in edit mode is now actually wired to delete flow with confirmation instead of incorrectly pointing at save behavior.
- A missing `Check` icon import introduced during header refactor was fixed.

### Repeat selector
- Repeat selection was tested as a custom bottom action sheet.
- Final behavior was changed back to the native system picker/select for consistency with the rest of the app.

### Light/Dark visual tuning inside transaction sheet
- Light-mode sheet shell background was tuned separately from the inner card area.
- Light-mode sheet shell is now `light 50`, dark mode sheet shell is `dark 900` via `bg-sheet`.
- Header left/right circular action buttons use `light 0 / dark 800`.
- The main inner rounded transaction card and cancel button use `light 0 / dark 800`.
- Divider lines inside the main transaction card use `light 200 / dark 700`.
- Inactive transaction type pills use `light 100 / dark 700` with text `light 500 / dark 300`.
- Parent category inactive pills use `light 100 / dark 700` with text `light 500 / dark 300`.
- Child-category wrapper box uses `light 100 / dark 700`.
- Child category inactive pills use `light 0 / dark muted`, with text `light 500 / dark 300`.
- Category manage button uses background `light 100 / dark 700` and text `light 500 / dark 500`.
- Memo input now distinguishes placeholder vs typed value: placeholder `입력` uses `light 500 / dark 500`, but typed text renders in normal foreground `black/white`.
- Divider lines inside the main transaction card were tuned separately for light and dark mode.

### Category / picker tuning
- Transaction category picker and category-edit child pills got light-mode-only gray tuning so pills remain distinguishable in bright theme.
- Category edit screen child category pills now use `#f3f4f6` in light mode.

## Recent UX Changes (2026-04-10)

### History / Monthly page
- Home route (`/`) redirects to `/history`.
- Dashboard route is retired and redirects to `/history`.
- Header left dashboard button was replaced by a calendar toggle icon.
- Header right calendar-mode button was replaced by a `오늘` pill button.
- `오늘` resets monthly view to current month, current week, and current day.
- Calendar typography was retuned:
  - date numbers medium by default
  - today uses bluple text + semibold
  - amount labels use tighter letter spacing
- Week strip date numbers changed to medium.
- Future dates in week strip are selectable even when no transactions exist.

### Weekly history view
- Week strip redesigned as weekday+date pills.
- Weekly summary amount letter spacing tightened.
- Day jump behavior updated so tapping `오늘` or week-strip dates properly selects the intended day.

### Daily detail cards
- Daily detail is now shown as rounded cards grouped by date.
- Header format: `N월 N일 N요일`.
- Category/detail rows were simplified to reduce noise.
- Bottom summary rows now use:
  - labels: 14px medium
  - amounts: 14px semibold
- Additional spacing was added between the date header and the first row.

### Shared summary cards / yearly charts
- Yearly expense/income charts were merged into a single box with top-right toggle.
- Toggle and title layout was decoupled so the text block keeps its own spacing.
- Yearly chart title/amount spacing was tuned multiple times.
- Comparison copy shortened to `월 평균 NNN만 원 대비 ↑/↓ NNN만 원`.

### Theme / polish
- Initial light-mode dark flash was reduced by removing default SSR `dark` class and letting the inline theme script add `dark` only when saved theme is dark.

## Roadmap

### Phase 1 — MVP ✅
### Phase 2 — 뷰 개선 + 분석 ✅
### Phase 3 — 확장
- [ ] PWA 아이콘 추가
- [ ] 카드 결제 SMS 자동 파싱
- [ ] 예산 설정 + 잔여 예산 표시
- [ ] 2인 공유 (형주 + 유리님)

## 남은 이슈

1. PWA 아이콘 — icon-192.png, icon-512.png 없음
2. 라이트 모드 세부 조정 미완
3. Pull to refresh 스피너 — Tailwind v4 animate-spin 미동작, 인라인 animation 우회 중
4. 미사용 컴포넌트 정리 (date-picker-inline.tsx, monthly-calendar.old.tsx)
