# bb-budget 💰

유리님과 함께 만드는 가계부 PWA. 기존 Google Sheets "빵계부" 대체.

> 모바일 입력이 불편해서 → 직접 만든다.

## Stack

| Layer | 선택 | 이유 |
|-------|------|------|
| Frontend | Next.js + TypeScript + Tailwind | 표준 스택, PWA 지원 |
| DB | Supabase (`budget` 스키마, bb-todo 프로젝트 공유) | 무료 플랜 제약 |
| Auth | Supabase Auth | magic link or anonymous |
| Deploy | Vercel | git push 자동 배포 |

## 작업 현황 (2026-03-24)

### 적용 완료

**저축 모달 (add-transaction-modal.tsx)**
- 만기일/만기금액: 수정 모드에서만 표시 (최초 기록 시 숨김)

**월간 내역 (history/page.tsx)**
- 주간 탭 삭제 → 월간이 기본 뷰
- 월간 아코디언 구조: 주차별 헤더(▼/▲) 클릭으로 접기/펼치기
  - 최신 주차가 상단, 기본 접힌 상태
  - 오늘 날짜 기준 아직 안 온 주차는 비표시
  - 펼치면 일별 상세 (요일, 카테고리 pill, 금액, 메모)
- 월 헤더: "2026년 3월" (연도 포함)
- 월간 요약 구조:
  - 금월 수입 (파란 pill) / 금월 지출 (빨간 pill)
  - 구분선
  - 자산 (누적수입 - 누적지출)
    - 운용 자산 (민트) = 활성 저축 합계
    - 가용 현금 = 자산 - 운용자산

**연간 뷰**
- 심플 한 줄: N월 +₩변동 ₩자산
- 변동 = 해당 월 수입-지출 (파란/빨간)
- 자산 = 해당 월 말 누적
- 클릭 → 해당 월간 뷰 이동, 데이터 있는 월만 표시

**홈 (page.tsx)**
- 최상단: ₩가용현금 "가용 현금" (기존 총자산에서 변경)
- 운용자산/가용현금 박스 삭제
- 달력 헤더 아래: 금월 수입/지출 pill 스타일
- 달력 토/일 컬러 제거 (통일)

**자산 로직**
- 초기자산 ₩85,351,278은 1월 1일 수입(income)으로 DB 기록됨
- 자산 = 누적 수입 - 누적 지출
- 가용 현금 = 자산 - 운용자산(저축)
- 운용 자산 = 활성 저축 합계 (예금 + 금)

**라벨 통일 (홈 + 월간)**
- 수입 → 금월 수입, 지출 → 금월 지출
- 저축 → 운용 자산, 잔고 → 가용 현금

### 남은 이슈

1. **홈 자산/달력 영역 시각적 구분** — 여러 방식 시도 (bg 분리, 라운드, 컬러 변경) → 결론 안 남. 현재 전체 bg-background 단일
2. **저축 불입/인출 시 자산 연동** — 저축 추가=현금에서 빠짐, 인출=현금 돌아옴. 미구현
3. **홈 수입/지출 월 전환 시 데이터 연동** — 달력 월 이동 시 해당 월 데이터로 갱신되는지 확인 필요
4. **연간 뷰 디자인** — 현재 심플 한 줄, 추가 요청 가능
5. **빵계부(구글 시트) 연동** — 시트 데이터는 앱 DB로 이관 완료. 금 시세 업데이트만 시트에서 계속 (요약 탭 C34:E34)

---

## Roadmap

### Phase 0 — 기획 확정 ✅
- [x] 유리님 요구사항 확인
- [x] 기존 빵계부 시트 구조 파악
- [ ] 카카오뱅크 SMS 알림 활성화 (월 300원) 여부 확인

### Phase 1 — MVP ✅
- [x] 프로젝트 셋업 (Next.js + Supabase + Vercel)
- [x] Supabase budget 스키마 + 테이블 생성
- [x] 수입/지출/저축 수동 입력 (금액, 카테고리, 날짜, 메모)
- [x] 카테고리 관리 (2depth: 대분류 > 소분류)
- [x] 월별 달력 뷰 + 수입/지출 합계 요약
- [x] PWA 설정 (홈화면 추가)
- [x] 모바일 퍼스트 UI
- [x] 저축 기록 (만기일/만기금액은 수정 시에만)
- [ ] 카드 결제 SMS 자동 파싱 크론 (Mac Messages chat.db → Supabase)

### Phase 2 — 데이터 이관 + 뷰 개선 (진행 중)
- [x] Google Sheets 빵계부 데이터 이관
- [x] 월간 아코디언 (주차별 접기/펼치기)
- [x] 연간 뷰 (월별 변동/자산 한 줄)
- [x] 홈 헤더 가용현금 표시
- [x] 홈 달력 아래 금월 수입/지출 pill 스타일
- [x] 자산 로직 (누적수입-누적지출, 가용현금=자산-운용자산)
- [ ] 홈 자산/달력 영역 시각적 구분 (디자인 결정 필요)
- [ ] 저축 불입/인출 시 자산 연동
- [ ] 카테고리별 지출 그래프 (pie/bar)
- [ ] 월별 추이 그래프 (line)
- [ ] 예산 설정 + 잔여 예산 표시

### Phase 3 — 확장
- [ ] 반복 지출 자동 등록 (월세, 보험, 구독 등)
- [ ] 지출 챌린지
- [ ] 2인 공유 (형주 + 유리님)
- [ ] 영수증 OCR (Naver CLOVA / Google Vision)

## DB Schema (draft)

```sql
create schema if not exists budget;

create table budget.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  icon text,
  type text not null check (type in ('income', 'expense')),
  sort_order int default 0,
  created_at timestamptz default now()
);

create table budget.transactions (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('income', 'expense')),
  amount int not null,
  category_id uuid references budget.categories(id),
  description text,
  date date not null default current_date,
  source text default 'manual', -- 'manual' | 'sms'
  receipt_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table budget.monthly_budgets (
  id uuid primary key default gen_random_uuid(),
  year_month text not null,
  total_budget int not null,
  created_at timestamptz default now(),
  unique(year_month)
);
```

## SMS 자동 파싱 (Phase 1 핵심 기능)

형주 Apple 계정으로 유리님 카드 결제 문자 수신 중
→ Mac Messages.app chat.db 크론 스캔
→ 카드사 패턴 매칭 (금액, 가맹점, 날짜)
→ Supabase 자동 등록 + 가맹점→카테고리 매핑

- 카카오뱅크 SMS 알림 활성화 필요 (앱 푸시는 Mac 캡처 불가)
- 카드사 문자 패턴은 형주가 제공

## References

- [SMTM](https://github.com/2022-Winter-Bootcamp-Team-C/docker) — 영수증 OCR + 그래프 레퍼런스
- [pink-tracker](https://pink-tracker-dun.vercel.app) — UI 레퍼런스
- [docs/plan.md](./docs/plan.md) — 상세 기획 및 의사결정 로그

## Setup (형주가 직접 설정)

- [ ] Vercel 프로젝트 생성 + GitHub 연동
- [ ] Supabase bb-todo 프로젝트에 `budget` 스키마 생성
- [ ] Vercel 환경변수 설정 (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`)

## UI Library

**shadcn/ui** — pink-tracker에서 유리님이 마음에 들어했던 UI 패키지.

- 공식 사이트: https://ui.shadcn.com
- GitHub: https://github.com/shadcn-ui/ui
- 컴포넌트 데모: https://ui.shadcn.com/examples/dashboard

Tailwind 기반, 컴포넌트 소스코드를 직접 프로젝트에 복사하는 방식 (npm 패키지 아님).
