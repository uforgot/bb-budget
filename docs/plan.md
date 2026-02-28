# bb-budget — 가계부 PWA

## Overview

유리님(배유리)과 함께 만드는 가계부 PWA.
기존 Google Sheets "빵계부" 대체 — 모바일 입력이 불편해서 전환 결정.

**Reference:** https://github.com/2022-Winter-Bootcamp-Team-C/docker (SMTM — 부트캠프 가계부 프로젝트, 영수증 OCR + 그래프)

## Decision Log

- DB: bb-todo Supabase 프로젝트에 `budget` 스키마 추가 (무료 플랜 2개 제한)
- Stack: Next.js + Supabase + Vercel (형주 표준 스택)
- Discord: #bb-budget 채널 (형주가 직접 생성 예정, 유리님 참여)
- Google Sheets 데이터 이관 필요 (로드맵 Phase 2)

## Tech Stack

| Layer | Choice | Reason |
|-------|--------|--------|
| Frontend | Next.js + TypeScript + Tailwind | 형주 표준, PWA 지원 |
| DB | Supabase (bb-todo 프로젝트, `budget` 스키마) | 무료 플랜 제약 |
| Auth | Supabase Auth (anonymous or magic link) | 유리님 단독 사용 가능성 높음 |
| Deploy | Vercel | Git push 자동 배포 |
| OCR | TBD (Naver CLOVA OCR / Google Vision) | 영수증 자동 인식 — 유리님 요구사항 확인 필요 |

## Features (Priority)

### Must Have (Phase 1)
- [ ] 수입/지출 수동 입력 (금액, 카테고리, 날짜, 메모)
- [ ] 카드 결제 SMS 자동 입력 (Mac Messages.app chat.db → 크론 스캔 → 파싱 → Supabase)
  - 형주 Apple 계정으로 유리님 카드 결제 문자 수신됨 (Mac Messages.app chat.db)
  - 카카오뱅크 결제 SMS 알림 활성화 (월 300원) — 앱 푸시는 Mac에서 캡처 불가
  - 카드사 문자 패턴 매칭 (금액, 가맹점, 날짜) — 번호/패턴 형주가 제공 예정
  - 가맹점명 → 카테고리 자동 매핑 (학습형)
- [ ] 카테고리 관리 (식비, 교통, 생활, 교육, 의료 등)
- [ ] 월별 목록 조회
- [ ] 월별 수입/지출 합계 요약
- [ ] PWA (홈화면 추가, 오프라인 기본 지원)
- [ ] 모바일 퍼스트 UI (pink-tracker 수준의 심플함)

### Should Have (Phase 2)
- [ ] Google Sheets "빵계부" 데이터 이관 스크립트
- [ ] 카테고리별 지출 그래프 (pie/bar)
- [ ] 월별 추이 그래프 (line)
- [ ] 예산 설정 + 잔여 예산 표시

### Nice to Have (Phase 3)
- [ ] 반복 지출 자동 등록 (월세, 보험, 구독 등)
- [ ] 지출 챌린지 (SMTM 참고)
- [ ] 2인 공유 (형주 + 유리님 동시 사용)

## DB Schema (draft)

```sql
-- budget 스키마 사용
create schema if not exists budget;

-- 카테고리
create table budget.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  icon text, -- emoji
  type text not null check (type in ('income', 'expense')),
  sort_order int default 0,
  created_at timestamptz default now()
);

-- 거래 내역
create table budget.transactions (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('income', 'expense')),
  amount int not null, -- 원 단위
  category_id uuid references budget.categories(id),
  description text,
  date date not null default current_date,
  receipt_url text, -- OCR용 영수증 이미지 (Phase 3)
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 월별 예산 (Phase 2)
create table budget.monthly_budgets (
  id uuid primary key default gen_random_uuid(),
  year_month text not null, -- '2026-02'
  total_budget int not null,
  created_at timestamptz default now(),
  unique(year_month)
);
```

## UI Concept

- pink-tracker 스타일 미니멀 모바일 UI
- 메인: 이번 달 요약 (수입/지출/잔액) + 최근 거래 목록
- 하단 FAB(+) → 빠른 입력 (금액 → 카테고리 → 완료, 3탭 이내)
- 캘린더 뷰 → 날짜별 지출 합계 dot 표시
- 다크/라이트 테마

## Roadmap

| Phase | Scope | Est. |
|-------|-------|------|
| 0 | 채널 개설 + 유리님 요구사항 확인 | 이번 주 |
| 1 | 수동 입력 + 목록 + 요약 + PWA | 1주 |
| 2 | 시트 이관 + 그래프 + 예산 | 1주 |
| 3 | OCR + 반복 지출 + 챌린지 | TBD |

## Notes

- 유리님이 SMTM 레포에서 뭘 좋아했는지 채널에서 확인 필요
- 유리님 기획자 출신 → 요구사항 구체적으로 나올 가능성 높음
- 입력 편의성이 핵심 (시트가 불편해서 바꾸는 거니까)
- 기존 빵계부 시트 구조 파악 필요 (bb-management에서 연동했으니 형주 확인)
