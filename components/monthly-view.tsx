'use client'

import { useState } from 'react'
import { type Transaction, type Category } from '@/lib/api'
import { SummaryCardSlider } from '@/components/summary-card-slider'
import { TxRow } from '@/components/tx-row'

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토']

function getWeekNum(year: number, month: number, day: number): number {
  const firstDay = new Date(year, month - 1, 1)
  const firstMonday = (firstDay.getDay() + 6) % 7
  return Math.ceil((day + firstMonday) / 7)
}

function getWeekNumFromDate(dateStr: string): number {
  const d = new Date(dateStr)
  return getWeekNum(d.getFullYear(), d.getMonth() + 1, d.getDate())
}

function getWeekDateRange(year: number, month: number, weekNum: number): { startDay: number; endDay: number } {
  const firstDay = new Date(year, month - 1, 1)
  const firstMonday = (firstDay.getDay() + 6) % 7
  const startDay = Math.max(1, (weekNum - 1) * 7 - firstMonday + 1)
  const daysInMonth = new Date(year, month, 0).getDate()
  const endDay = Math.min(daysInMonth, weekNum * 7 - firstMonday)
  return { startDay, endDay }
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

  // 주차
  const totalWeeks = getWeekNum(targetYear, actualMonth, daysInMonth)
  const currentWeekNum = (targetYear === today.getFullYear() && actualMonth === today.getMonth() + 1)
    ? getWeekNum(today.getFullYear(), today.getMonth() + 1, today.getDate())
    : isFutureMonth ? 1 : totalWeeks

  const [selectedWeek, setSelectedWeek] = useState(currentWeekNum)

  // 선택된 주의 거래
  const weekTxs = monthTxs
    .filter(t => getWeekNumFromDate(t.date) === selectedWeek)
    .sort((a, b) => {
      const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime()
      return dateDiff !== 0 ? dateDiff : new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

  const weekIncome = weekTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const weekExpense = weekTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)

  // 주차 날짜 범위
  const { startDay, endDay } = getWeekDateRange(targetYear, actualMonth, selectedWeek)
  const dateRangeLabel = `${actualMonth}월 ${startDay}일 - ${actualMonth}월 ${endDay}일`

  // 미래 주 여부
  const isSelectedWeekFuture = (targetYear === today.getFullYear() && actualMonth === today.getMonth() + 1)
    ? selectedWeek > currentWeekNum
    : isFutureMonth

  let lastDate: string | null = null

  return (
    <>
      {/* 요약 카드 슬라이더 */}
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

      {/* 주차 탭 버튼 */}
      <div className="overflow-x-auto scrollbar-hide px-5 mb-4">
        <div className="flex gap-2" style={{ width: 'max-content' }}>
          {Array.from({ length: totalWeeks }, (_, i) => i + 1).map(week => (
            <button
              key={week}
              onClick={() => setSelectedWeek(week)}
              className={`px-6 py-2 rounded-full text-[14px] font-semibold whitespace-nowrap transition-colors ${
                week === selectedWeek
                  ? 'bg-accent-blue text-white'
                  : 'bg-surface text-muted-foreground'
              }`}
            >
              {week}주 차
            </button>
          ))}
        </div>
      </div>

      {/* 주차 요약 + 내역 */}
      <div>
        {isSelectedWeekFuture ? (
          <p className="text-sm text-muted-foreground text-center py-8">내역이 없습니다.</p>
        ) : (
          <>
            {/* 주차 요약 카드 */}
            {(() => {
              const net = weekIncome - weekExpense
              const netColor = 'text-foreground'
              return (
                <div className="mx-5 mb-3 mt-4 bg-surface rounded-2xl px-5 py-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[14px] font-semibold">{dateRangeLabel}</span>
                    <span className={`text-[15px] font-bold tabular-nums ${netColor}`}>
                      {net >= 0 ? '+' : '-'}₩{Math.abs(net).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] text-muted-foreground">지출</span>
                    <span className="text-[13px] font-semibold tabular-nums text-[#5865F2]">₩{weekExpense.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[13px] text-muted-foreground">수입</span>
                    <span className="text-[13px] font-semibold tabular-nums text-accent-blue">₩{weekIncome.toLocaleString()}</span>
                  </div>
                </div>
              )
            })()}
            {/* 내역 */}
            {weekTxs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">내역이 없어요</p>
            ) : (
              <div className="flex flex-col px-5">
                {weekTxs.map(tx => {
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

            {/* 반복 지출 예정 */}
            {isFutureMonth && recurringItems
              .filter(r => getWeekNum(targetYear, actualMonth, r.day) === selectedWeek)
              .map((r, ri) => {
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
                          <span className="text-xs text-foreground px-3 py-1 rounded-full inline-block" style={{ backgroundColor: '#1C1C1E' }}>
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
          </>
        )}
      </div>
    </>
  )
}
