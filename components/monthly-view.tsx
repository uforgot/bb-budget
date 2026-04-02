'use client'

import { type Transaction, type Category } from '@/lib/api'
import { SummaryCardSlider } from '@/components/summary-card-slider'
import { WeekAccordion } from '@/components/week-accordion'

function getWeekNum(year: number, month: number, day: number): number {
  const firstDay = new Date(year, month - 1, 1)
  const firstMonday = (firstDay.getDay() + 6) % 7
  return Math.ceil((day + firstMonday) / 7)
}

function getWeekNumFromDate(dateStr: string): number {
  const d = new Date(dateStr)
  return getWeekNum(d.getFullYear(), d.getMonth() + 1, d.getDate())
}

interface RecurringItem {
  day: number
  type: string
  amount: number
  category_id: string
  description: string
  categoryName?: string
}

interface MonthlyViewProps {
  monthOffset: number
  transactions: Transaction[]
  categories: Category[]
  recurringItems: RecurringItem[]
  expandedWeeks: Set<number>
  autoExpanded: boolean
  setExpandedWeeks: (v: Set<number>) => void
  setAutoExpanded: (v: boolean) => void
  onEdit: (tx: Transaction) => void
  onDeleted: () => void
}

export function MonthlyView({
  monthOffset, transactions, categories, recurringItems,
  expandedWeeks, autoExpanded, setExpandedWeeks, setAutoExpanded,
  onEdit, onDeleted,
}: MonthlyViewProps) {
  const now = new Date()
  const today = new Date()
  const targetMonth = now.getMonth() + 1 + monthOffset
  const targetYear = now.getFullYear() + Math.floor((targetMonth - 1) / 12)
  const actualMonth = ((targetMonth - 1) % 12 + 12) % 12 + 1
  const isFutureMonth = targetYear > today.getFullYear() || (targetYear === today.getFullYear() && actualMonth > today.getMonth() + 1)
  const daysInMonth = new Date(targetYear, actualMonth, 0).getDate()
  const monthEndDate = `${targetYear}-${String(actualMonth).padStart(2,'0')}-${String(daysInMonth).padStart(2,'0')}`

  // 해당 월 트랜잭션
  const monthTxs = transactions.filter(t => {
    const d = new Date(t.date)
    return d.getFullYear() === targetYear && d.getMonth() + 1 === actualMonth
  })
  let monthIncome = monthTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  let monthExpense = monthTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  if (isFutureMonth) {
    monthExpense += recurringItems.filter(r => r.type === 'expense').reduce((s, r) => s + r.amount, 0)
    monthIncome += recurringItems.filter(r => r.type === 'income').reduce((s, r) => s + r.amount, 0)
  }

  // 요약
  const monthSavingsAmt = transactions.filter(t => t.type === 'savings' && t.date <= monthEndDate && (!t.end_date || t.end_date > monthEndDate)).reduce((s, t) => s + t.amount, 0)
  const cumIncome = transactions.filter(t => t.type === 'income' && t.date <= monthEndDate).reduce((s, t) => s + t.amount, 0)
  const cumExpense = transactions.filter(t => t.type === 'expense' && t.date <= monthEndDate).reduce((s, t) => s + t.amount, 0)
  const cumSavings = transactions.filter(t => t.type === 'savings' && t.date <= monthEndDate && (!t.end_date || t.end_date > monthEndDate)).reduce((s, t) => s + t.amount, 0)
  const monthBalance = cumIncome - cumExpense - cumSavings

  // 전월
  const prevM = actualMonth === 1 ? 12 : actualMonth - 1
  const prevY = actualMonth === 1 ? targetYear - 1 : targetYear
  const prevDays = new Date(prevY, prevM, 0).getDate()
  const prevEnd = `${prevY}-${String(prevM).padStart(2,'0')}-${String(prevDays).padStart(2,'0')}`
  const prevStart = `${prevY}-${String(prevM).padStart(2,'0')}-01`
  const prevTxs = transactions.filter(t => t.date >= prevStart && t.date <= prevEnd)
  const prevIncome = prevTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const prevExpense = prevTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const prevSavingsAmt = transactions.filter(t => t.type === 'savings' && t.date <= prevEnd && (!t.end_date || t.end_date > prevEnd)).reduce((s, t) => s + t.amount, 0)
  const prevCumInc = transactions.filter(t => t.type === 'income' && t.date <= prevEnd).reduce((s, t) => s + t.amount, 0)
  const prevCumExp = transactions.filter(t => t.type === 'expense' && t.date <= prevEnd).reduce((s, t) => s + t.amount, 0)
  const prevBalance = prevCumInc - prevCumExp - prevSavingsAmt

  // 주차 계산
  const totalWeeks = getWeekNum(targetYear, actualMonth, daysInMonth)
  const currentWeekNum = (targetYear === today.getFullYear() && actualMonth === today.getMonth() + 1)
    ? getWeekNum(today.getFullYear(), today.getMonth() + 1, today.getDate())
    : totalWeeks

  if (!autoExpanded && expandedWeeks.size === 0 && currentWeekNum > 0) {
    setExpandedWeeks(new Set([currentWeekNum]))
    setAutoExpanded(true)
  }

  const weekSummaries = Array.from({ length: totalWeeks }, (_, i) => {
    const weekNum = i + 1
    const weekTxs = monthTxs.filter(t => getWeekNumFromDate(t.date) === weekNum)
    let weekTotal = weekTxs.reduce((sum, t) => {
      if (t.type === 'income') return sum + t.amount
      if (t.type === 'expense') return sum - t.amount
      return sum
    }, 0)
    if (isFutureMonth) {
      const weekRecurring = recurringItems.filter(r => getWeekNum(targetYear, actualMonth, r.day) === weekNum)
      weekTotal += weekRecurring.reduce((s, r) => s + r.amount, 0)
    }
    const hasRecurring = isFutureMonth && recurringItems.some(r => getWeekNum(targetYear, actualMonth, r.day) === weekNum)
    return { weekNum, weekTotal, hasRecurring }
  }).filter(w => w.weekNum <= currentWeekNum && (w.weekTotal !== 0 || w.hasRecurring)).reverse()

  return (
    <>
      {/* 요약 카드 슬라이더 (full width) */}
      <SummaryCardSlider
        month={actualMonth}
        income={monthIncome}
        expense={monthExpense}
        savings={monthSavingsAmt}
        balance={monthBalance}
        prevMonth={prevM}
        prevIncome={prevIncome}
        prevExpense={prevExpense}
        prevSavings={prevSavingsAmt}
        prevBalance={prevBalance}
        hasPrev={prevTxs.length > 0}
      />

      {/* 주차 아코디언 */}
      <div className="px-5">
        <div className="flex flex-col mt-2">
          {weekSummaries.length === 0 && !isFutureMonth && (
            <p className="text-sm text-muted-foreground text-center py-8">아직 내역이 없어요</p>
          )}
          {weekSummaries.length === 0 && isFutureMonth && recurringItems.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">예정된 반복 지출이 없어요</p>
          )}
          {weekSummaries.map(({ weekNum, weekTotal }) => {
            const weekTxs = monthTxs
              .filter(t => getWeekNumFromDate(t.date) === weekNum)
              .sort((a, b) => {
                const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime()
                return dateDiff !== 0 ? dateDiff : new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
              })
            return (
              <WeekAccordion
                key={weekNum}
                weekNum={weekNum}
                weekTotal={weekTotal}
                actualMonth={actualMonth}
                targetYear={targetYear}
                actualMonthLabel={`${actualMonth}월`}
                isExpanded={expandedWeeks.has(weekNum)}
                onToggle={() => {
                  const next = new Set(expandedWeeks)
                  if (next.has(weekNum)) next.delete(weekNum)
                  else next.add(weekNum)
                  setExpandedWeeks(next)
                }}
                weekTxs={weekTxs}
                categories={categories}
                isFutureMonth={isFutureMonth}
                recurringItems={recurringItems}
                onEdit={onEdit}
                onDeleted={onDeleted}
                getWeekNum={getWeekNum}
              />
            )
          })}
        </div>
      </div>
    </>
  )
}
