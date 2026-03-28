# bb-budget 💰

유리님과 함께 만드는 가계부 PWA. 기존 Google Sheets "빵계부" 대체.

> 모바일 입력이 불편해서 → 직접 만든다.

## Stack

| Layer | 선택 | 이유 |
|-------|------|------|
| Frontend | Next.js + TypeScript + Tailwind | 표준 스택, PWA 지원 |
| DB | Supabase (public 스키마) | 무료 플랜 |
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

## 작업 현황 (2026-03-26)

### 홈 (app/page.tsx)
- ✅ 최상단: ₩잔액 "잔액" (sticky header)
- ✅ N월 수입/지출 2열 박스 (달력 스크롤 시 자동 업데이트)
- ✅ 달력: 세로 터치 슬라이더 (이전/현재/다음 3개월 연결, 6행 고정 컨테이너)
- ✅ 날짜별 지출(빨간)/수입(파란) 금액 표시 (1만 이상 n만, 미만 풀 표시)
- ✅ 날짜 클릭 → 상세 내역 (라운드 박스)
- ✅ "오늘" 버튼 (pill 스타일, 현재 달+날짜로 이동)
- ✅ Pull to refresh (당겨서 새로고침)
- ✅ 토/일 컬러 제거 (통일)
- ✅ 오늘 날짜: 파란 glow + 흰 볼드

### 월간 내역 (app/history/page.tsx)
- ✅ 주간 탭 삭제 → 월간 기본 뷰
- ✅ 월 헤더: "2026년 3월" (연도 포함)
- ✅ 주차별 아코디언 (▼/▲ 꺽쇠, 최신 주차 기본 펼침)
- ✅ 오늘 기준 아직 안 온 주차 비표시
- ✅ 서머리: N월 수입(파란 pill) / N월 지출(빨간 pill) / N월 저축(민트 pill) → 구분선 → 잔액
- ✅ 저축: 해당 월까지 누적 표시 (1월 저축이 2,3월에도)
- ✅ 잔액: 누적 수입 - 누적 지출 - 누적 저축

### 연간 내역
- ✅ 연간 수입/지출 pill 서머리
- ✅ 월별 카드 (최신순, 수입/지출/저축/잔액)
- ✅ 저축/잔액 누적 기준
- ✅ 카드 클릭 → 해당 월 월간 뷰 이동

### 검색
- ✅ 내역 화면 탭 바에 🔍 아이콘 (탭 스타일 토글)
- ✅ 카테고리명, 메모, 금액, "미분류" 검색
- ✅ 전체 기간 대상, 실시간 필터
- ✅ 결과 클릭 → 수정 모달

### 기록하기/수정하기 (components/add-transaction-modal.tsx)
- ✅ 날짜/금액/카테고리/메모 입력
- ✅ 최근 카테고리 chip (TOP 5, 토글 on/off, 가운데 정렬)
- ✅ 금액: text-5xl, 파란 라인 삭제
- ✅ 카테고리/메모 일렬 레이아웃 (w-14 라벨)
- ✅ 폰트 text-[15px] 통일
- ✅ 하단 버튼 여백 40px + safe-area 통일

### 저축
- ✅ 저축 기록 시 수입에서 차감 (수입 - 지출 - 저축 = 잔액)
- ✅ 누적 표시 (1월 저축 → 이후 달에도 계속)
- ✅ end_date로 종료 관리 (삭제 안 함, 취소선 표시)
- ✅ 회수 바텀시트 (카테고리 피커 스타일)
  - 회수일 + 회수 금액 입력
  - 적용 → income 트랜잭션 생성 + 기존 저축 end_date 기록
- ✅ 수정 화면: [수정하기] [회수하기] [삭제하기] 일렬

### 반복 지출
- ✅ DB: public.recurring_transactions 테이블
- ✅ 설정 > 반복 지출 관리 페이지
- ✅ 매주/매월/매년 선택 (주=요일, 월=일자, 년=날짜)
- ✅ CRUD (추가/편집/삭제)
- ✅ 예정 표시: 현재 달+미래 달에 연하게 (확정 안 된 것만)
- ✅ 자동 확정: 홈 로드 시 날짜 지난 반복 지출 자동 트랜잭션 생성
- ✅ 카드 클릭 → 편집 모드

### 리포트 (app/report/page.tsx)
- ✅ 4개 카드 아코디언 (기본 닫힘)
- ✅ **총자산**: 세로 스택 막대 (잔액 파란 + 저축 초록), 1~12월
- ✅ **연간 실질 수입·지출**: [전체/지출/수입] 토글 라인 차트
  - 실질 수입 = 수입 - 저축
  - 커스텀 툴팁 (전월 대비 증감)
  - 닫힘: 연간 누적 실수입/지출 + 작년 대비
- ✅ **지출 카테고리별 분석**: 2depth TOP 5 연간 라인 차트
  - 사용자 선택 pill (on/off 토글 + ↻ 초기화)
  - 연간 총액 기준 TOP 5 고정
  - 닫힘: 연간 TOP 3 리스트 (연간 1위/2위/3위)
- ✅ **수입 카테고리별 분석**: 동일 구조
- ✅ 물음표(?) 툴팁 (총자산, 실질수입, 지출분석, 수입분석)
- ✅ 차트 점선 그리드, cursor false 툴팁

### 자산 로직
- 초기자산 ₩85,351,278 = 1월 1일 수입(income)으로 DB 기록
- 총자산 = 누적 수입 - 누적 지출
- 잔액(가용현금) = 총자산 - 운용자산(저축)
- 운용자산 = 활성 저축 합계 (end_date 없는 것만)
- 실질 수입 = 수입 - 저축

### 라벨 통일
- 금월 수입/지출 → N월 수입/지출
- 저축 → 운용 자산 (자산 컨텍스트)
- 잔고 → 잔액/가용 현금
- 상세 내역 → 내역

### 디자인 통일
- rounded-[18px] 전체 통일
- 폰트: text-[15px] (입력/버튼), text-sm (라벨)
- 라이트 모드: surface=#ffffff, muted=#ffffff
- 다크 모드: surface=#141c28, muted=#1f2937
- 플로팅 탭 바: 라이트=bg-white/80, 다크=bg-black/85
- 하단 여백: calc(40px + safe-area) 통일

## 남은 이슈

1. **PWA 아이콘** — icon-192.png, icon-512.png 없음. 이미지 만들어서 public/에 추가 필요
2. **반복 지출 주기 DB 컬럼** — 현재 day_of_month만 있음. 매주/매년 구분 컬럼 필요 (frequency)
3. **빵계부 구글 시트** — 금 시세 업데이트만 시트에서 계속 (요약 탭 C34:E34)
4. **라이트 모드 세부 조정** — 일부 컴포넌트 라이트 대응 미완
5. **달력 터치 슬라이더** — KIA ControlSlider 방식 적용 완료, 추가 개선 가능

## Roadmap

### Phase 0 — 기획 확정 ✅
- [x] 유리님 요구사항 확인
- [x] 기존 빵계부 시트 구조 파악

### Phase 1 — MVP ✅
- [x] 프로젝트 셋업 (Next.js + Supabase + Vercel)
- [x] Supabase 테이블 생성
- [x] 수입/지출/저축 수동 입력
- [x] 카테고리 관리 (2depth)
- [x] 월별 달력 뷰 + 수입/지출 합계
- [x] PWA 설정
- [x] 모바일 퍼스트 UI
- [x] 저축 기록 + 회수

### Phase 2 — 뷰 개선 + 분석 ✅
- [x] Google Sheets 빵계부 데이터 이관
- [x] 월간 아코디언 (주차별)
- [x] 연간 뷰 (월별 카드)
- [x] 검색 기능
- [x] 리포트 (총자산, 수입/지출 추이, 카테고리 분석)
- [x] 반복 지출 관리
- [x] 예정 내역 표시 + 자동 확정
- [x] Pull to refresh
- [x] 최근 카테고리 추천

### Phase 3 — 확장
- [ ] PWA 아이콘 추가
- [ ] 반복 지출 frequency DB 컬럼
- [ ] 카드 결제 SMS 자동 파싱
- [ ] 예산 설정 + 잔여 예산 표시
- [ ] 2인 공유 (형주 + 유리님)

## DB 테이블

### public.transactions
- id, type (income/expense/savings), amount, category_id, description, date, created_at, end_date

### public.categories
- id, name, type, parent_id, icon, sort_order, created_at

### public.recurring_transactions
- id, type, amount, category_id, description, day_of_month, active, created_at

## 빵계부 구글 시트 연동
- Spreadsheet ID: 1KmxklHl9Zp-UoHAvkryanIyzCtHjOqvVBCm9N-BpZUE
- 서비스 계정: bb-management-bot@bb-management-488517.iam.gserviceaccount.com
- 금 시세 업데이트: 요약 탭 C34:E34 (KRX 기준)
- 가이드: docs/bbang-budget-guide.md

## 남은 이슈 (2026-03-29 추가)

6. **반복 지출 일시정지/삭제** — active 토글 UI + 삭제 시 내역 유지/함께삭제 선택 모달
7. **반복 지출 frequency DB 컬럼** — 매주/매년 구분 저장 (현재 day_of_month만)
8. **Pull to refresh 스피너** — animate-spin이 Tailwind v4에서 미동작, 인라인 animation으로 우회 중
