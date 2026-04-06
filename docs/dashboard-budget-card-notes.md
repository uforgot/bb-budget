# Dashboard Budget Card Notes

## Scope
Recent UI work on the dashboard balance card and the new monthly budget card.

## Files
- `app/dashboard/page.tsx`
- `components/balance-summary-card.tsx`
- `components/budget-card.tsx`

## Current Budget Card Behavior

### Entry / editing flow
- No bottom sheet anymore.
- Budget is edited inline inside the card.
- Before budget is set:
  - No top-right settings button.
  - Shows `₩0` with edit icon beside it.
  - Helper text sits in the lower area of the card.
- After budget is set:
  - Top-right settings button removed.
  - Edit button is placed beside the value under `총예산`.

### Storage
- Budget is currently stored in `localStorage`.
- Key format:
  - `budget:YYYY-MM`
  - implemented in `app/dashboard/page.tsx`
- This is intentionally lightweight / local-first for now.

## Current Budget Card Copy
- Title: `한 달 예산`
- Default helper text (only before budget is set):
  - `한 달 예산 설정하고 남은 금액을 확인하세요`
- Main amount display:
  - remaining budget: `₩000,000 남음`
  - over budget: `₩000,000 초과`
- No helper sentence after budget is set.
- No over-budget helper sentence either.

## Current Budget Card Visual Rules
- Card radius: `rounded-[22px]`
- Default height: aligned back toward balance card height (`min-h-[150px]` currently)
- Inline input:
  - should keep the same visual position as the read-only `₩0`
  - input text becomes white immediately on edit
  - thousand separators are shown while typing
- Graph color:
  - expense progress bar = blurple (`#5865F2`)
- Footer labels:
  - `지출`
  - `총예산`
- Footer values:
  - both use balance-card footer typography target (`14px`, semibold for value)
  - `지출` value is blurple
  - `총예산` value is white
- Expense percentage:
  - shows raw percent, not capped at 100
  - example: `240%`

## Current Balance Card Visual Rules
- Title: `잔액`
- Previous month segment color in the graph:
  - changed to savings purple (`#8B5CF6`)
- Current month segment color:
  - blurple (`#5865F2`)

## Known Fragile Area
The budget card spacing has been adjusted many times.
The most sensitive parts are:
- gap between title and amount
- gap between amount and graph
- helper text position in default state
- maintaining the same perceived baseline between read-only amount and inline input

If further tuning is needed, inspect these blocks first in `components/budget-card.tsx`:
- top title / amount block
- inline edit row
- footer graph + `지출 / 총예산` row

## Suggested Next Step (if continuing refactor)
If more design churn continues, extract shared tokens / structures for:
- card header spacing
- card footer info row
- amount display row
This work has been iterative enough that a small internal component split may reduce repeated drift.
