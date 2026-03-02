# bb-budget — 가계부 PWA

## Overview

유리님(배유리)과 함께 만드는 가계부 PWA.
기존 Google Sheets "빵계부" 대체 — 모바일 입력이 불편해서 전환 결정.

**Reference:** https://github.com/2022-Winter-Bootcamp-Team-C/docker (SMTM — 영수증 OCR + 그래프)

## Decision Log

- DB: bb-todo Supabase 프로젝트에 `budget` 스키마 추가 (무료 플랜 2개 제한)
- Stack: Next.js + Supabase + Vercel (형주 표준 스택)
- UI: shadcn/ui + Tailwind (pink-tracker에서 유리님이 마음에 들어함)
- Discord: #bb-budget 채널 (형주 생성, 유리님 참여)
- Google Sheets 데이터 이관 필요 (로드맵 Phase 2)
- 고정비 자동 등록 ❌ — 대출 포함 모든 항목 날짜/금액 다름, 그때그때 수동 입력
- SMS 자동 파싱 ❌ (Phase 1) — 카카오뱅크 앱 알림만 사용 중, Mac 캡처 불가. 나중에 필요하면 SMS 전환 후 자동화
- 수동 입력 우선, 자동화는 나중에 디벨롭

## Tech Stack

| Layer | Choice | Reason |
|-------|--------|--------|
| Frontend | Next.js + TypeScript + Tailwind | 형주 표준, PWA 지원 |
| UI | shadcn/ui | pink-tracker 레퍼런스, 유리님 승인 |
| DB | Supabase (bb-todo 프로젝트, `budget` 스키마) | 무료 플랜 제약 |
| Auth | Supabase Auth (magic link) | 유리님 단독 사용 |
| Deploy | Vercel | Git push 자동 배포 |

## 빵계부 시트 구조 (2026)

**수입:** 월급 + 기타  
**지출 16개 카테고리:** 대출 / 카드 / 어머니 / 청약적금 / 보험 / 생활 / 용돈 / 차 / 식비 / 생활용품 / 꾸밈 / 건강 / 세금 / 부동산 / 경조사 / 기타  
**자산:** 저축 / 정기예금 / 증권 / 잔고  
**핵심 지표:** 고정비(대출·카드·어머니·청약·보험·용돈·차) 외 변동지출 합계

## UI Concept

- 메인: 오늘 날짜 기준 이번달 잔여금액 + 지출/수입 현황
- 변동지출 현황 크게 표시 (실질적 소비 지표)
- 하단 FAB(+) → 빠른 입력 (금액 → 카테고리 → 완료, 3탭 이내)
- 카테고리 선택: 변동비 우선 노출 (식비, 생활용품, 생활, 꾸밈, 건강, 경조사, 기타)
- 캘린더 뷰 → 날짜별 지출 dot 표시
- 다크/라이트 테마
- pink-tracker 수준의 심플함

## Features (Priority)

### Must Have (Phase 1)
- [ ] 프로젝트 셋업 (Next.js + shadcn/ui + Supabase + Vercel)
- [ ] Supabase `budget` 스키마 + 테이블 생성
- [ ] 수입/지출 수동 입력 (금액, 카테고리, 날짜, 메모)
- [ ] 카테고리 관리 (빵계부 16개 기준)
- [ ] 홈: 오늘 기준 이번달 잔여금액 + 지출/수입 요약
- [ ] 월별 내역 목록
- [ ] PWA (홈화면 추가, 오프라인 기본 지원)
- [ ] 모바일 퍼스트 UI

### Should Have (Phase 2)
- [ ] Google Sheets "빵계부" 데이터 이관 스크립트
- [ ] 카테고리별 지출 그래프 (pie/bar)
- [ ] 월별 추이 그래프 (line)
- [ ] 예산 설정 + 잔여 예산 표시

### Nice to Have (Phase 3)
- [ ] SMS 자동 파싱 (카카오뱅크 문자 전환 시)
- [ ] 반복 지출 자동 등록
- [ ] 지출 챌린지
- [ ] 2인 공유 (형주 + 유리님)

## DB Schema

```sql
create schema if not exists budget;

create table budget.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  icon text,
  type text not null check (type in ('income', 'expense')),
  sort_order int default 0,
  is_variable bool default true, -- false=고정비, true=변동비
  created_at timestamptz default now()
);

create table budget.transactions (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('income', 'expense')),
  amount int not null,
  category_id uuid references budget.categories(id),
  description text,
  date date not null default current_date,
  source text default 'manual', -- 'manual' | 'sms' (future)
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

## Roadmap

| Phase | Scope | Status |
|-------|-------|--------|
| 0 | 기획 확정 + 요구사항 수집 | ✅ 완료 |
| 1 | 수동 입력 + 목록 + 요약 + PWA | 🔜 다음 |
| 2 | 시트 이관 + 그래프 + 예산 | - |
| 3 | SMS 자동화 + 챌린지 등 | - |

## Setup (형주가 직접 설정)

- [ ] Vercel 프로젝트 생성 + GitHub 연동
- [ ] Supabase bb-todo 프로젝트에 `budget` 스키마 생성
- [ ] Vercel 환경변수 설정 (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
