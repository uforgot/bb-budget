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

## Roadmap

### Phase 0 — 기획 확정
- [ ] 유리님 요구사항 확인 (SMTM 레포에서 뭘 좋아했는지)
- [ ] 기존 빵계부 시트 구조 파악
- [ ] 카카오뱅크 SMS 알림 활성화 (월 300원) 여부 확인

### Phase 1 — MVP
- [ ] 프로젝트 셋업 (Next.js + Supabase + Vercel)
- [ ] Supabase budget 스키마 + 테이블 생성
- [ ] 수입/지출 수동 입력 (금액, 카테고리, 날짜, 메모)
- [ ] 카테고리 관리 (식비, 교통, 생활, 교육, 의료 등)
- [ ] 월별 목록 조회 + 수입/지출 합계 요약
- [ ] PWA 설정 (홈화면 추가, 오프라인 기본)
- [ ] 모바일 퍼스트 UI (pink-tracker 스타일)
- [ ] 카드 결제 SMS 자동 파싱 크론 (Mac Messages chat.db → Supabase)

### Phase 2 — 데이터 이관 + 그래프
- [ ] Google Sheets 빵계부 데이터 이관 스크립트
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
