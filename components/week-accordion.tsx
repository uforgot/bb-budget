'use client'

import { type Transaction, type Category } from '@/lib/api'
import { TxRow } from '@/components/tx-row'

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토']

interface RecurringItem {
  day: number
  type: string
  amount: number
  category_id: string
  description: string
  categoryName?: string
}

interface WeekAccordionProps {
  weekNum: number
  weekTotal: number
  actualMonth: number
  targetYear: number
  actualMonthLabel: string
  isExpanded: boolean
  onToggle: () => void
  weekTxs: Transaction[]
  categories: Category[]
  isFutureMonth: boolean
  recurringItems: RecurringItem[]
  onEdit: (tx: Transaction) => void
  onDeleted: () => void
  getWeekNum: (year: number, month: number, day: number) => number
}

export function WeekAccordion({
  weekNum, weekTotal, actualMonth, targetYear, actualMonthLabel,
  isExpanded, onToggle, weekTxs, categories, isFutureMonth,
  recurringItems, onEdit, onDeleted, getWeekNum,
}: WeekAccordionProps) {
  const weekRecurring = isFutureMonth
    ? recurringItems.filter(r => getWeekNum(targetYear, actualMonth, r.day) === weekNum)
    : []

  let lastDate: string | null = null

  return (
    <div>
      {/* 주차 헤더 */}
      <div
        onClick={onToggle}
        className="flex items-center justify-between px-5 py-4 cursor-pointer active:bg-muted/30 bg-surface rounded-[22px] mb-3"
      >
        <span className="text-sm font-semibold">{actualMonthLabel} {weekNum}주 차</span>
        <div className="flex items-center gap-2">
          <span className={`text-sm font-semibold tabular-nums ${weekTotal >= 0 ? 'text-accent-blue' : 'text-accent-coral'}`}>
            ₩{Math.abs(weekTotal).toLocaleString()}
          </span>
          <svg
            width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            className={`text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </div>
      </div>

      {/* 펼친 내역 */}
      {isExpanded && (
        <div className="pb-2">
          {/* 반복 지출 예정 */}
          {weekRecurring.map((r, ri) => {
            const d = new Date(targetYear, actualMonth - 1, r.day)
            return (
              <div key={`recurring-${ri}`} className="opacity-40 italic border-dashed border-b border-border">
                <div className="px-5 py-2">
                  <div className="flex items-center gap-3">
                    <div className="w-14 flex-shrink-0">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-sm font-medium">{DAY_NAMES[d.getDay()]}</span>
                        <span className="text-sm text-muted-foreground tabular-nums">{r.day}일</span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0 flex items-center gap-2">
                      <span className="text-xs bg-muted px-3 py-1 rounded-full inline-block">
                        <span className="text-foreground">{r.categoryName || '미분류'}</span>
                      </span>
                      <span className="text-[9px] bg-accent-coral/20 text-accent-coral px-1.5 py-0.5 rounded">예정</span>
                    </div>
                    <span className={`text-sm font-semibold tabular-nums flex-shrink-0 ${
                      r.type === 'expense' ? 'text-accent-coral' : r.type === 'income' ? 'text-accent-blue' : 'text-accent-purple'
                    }`}>
                      ₩{r.amount.toLocaleString()}
                    </span>
                  </div>
                  {r.description && <p className="text-[10px] text-muted-foreground truncate mt-1 pl-[68px]">{r.description}</p>}
                </div>
              </div>
            )
          })}

          {/* 일별 내역 */}
          {weekTxs.length === 0 && weekRecurring.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">내역이 없어요</p>
          ) : weekTxs.map(tx => {
            const showDivider = lastDate !== null && lastDate !== tx.date
            const showDate = lastDate !== tx.date
            lastDate = tx.date
            return (
              <div key={tx.id}>
                {showDivider && <div className="border-t border-border mx-5 my-1" />}
                <TxRow
                  tx={tx}
                  categories={categories}
                  showDate={showDate}
                  onEdit={onEdit}
                  onDeleted={onDeleted}
                />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
