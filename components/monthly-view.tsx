'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { type Transaction, type Category } from '@/lib/api'
import { SummaryCardSlider } from '@/components/summary-card-slider'
import { TxRow } from '@/components/tx-row'
import { semanticColors } from '@/components/ui-colors'

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토']
const WEEKDAYS_MON = ['월', '화', '수', '목', '금', '토', '일']

type ViewMode = 'calendar' | 'week'

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

function formatDateKey(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function formatAmount(amount: number): string {
  if (amount >= 10000) {
    const man = Math.floor(amount / 10000)
    return `${man}만`
  }
  return amount.toLocaleString()
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
  onEdit: (tx: Transaction) => void
  onDeleted: () => void
}

function MonthlyGridView({
  year,
  month,
  selectedDay,
  dailySummaries,
  isFutureMonth,
  onSelectDay,
}: {
  year: number
  month: number
  selectedDay: number
  dailySummaries: Map<number, { income: number; expense: number }>
  isFutureMonth: boolean
  onSelectDay: (day: number) => void
}) {
  const today = new Date()
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() + 1 === month
  const todayDate = today.getDate()
  const firstDayWeekday = (new Date(year, month - 1, 1).getDay() + 6) % 7
  const daysInMonth = new Date(year, month, 0).getDate()

  const cells: (number | null)[] = []
  for (let i = 0; i < firstDayWeekday; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  return (
    <div>
      <div className="grid grid-cols-7 pt-3 pb-2 mb-1 border-b border-border px-0">
        {WEEKDAYS_MON.map(day => (
          <div key={day} className="text-center text-[10px] font-medium text-muted-foreground">{day}</div>
        ))}
      </div>
      <div className="w-full px-0">
        <div className="h-2" />
        <div className="grid grid-cols-7">
          {cells.map((day, i) => {
            if (!day) return <div key={`e-${i}`} className="h-[52px]" />

            const dayData = dailySummaries.get(day)
            const isToday = isCurrentMonth && day === todayDate
            const selected = selectedDay === day

            return (
              <button
                key={day}
                data-no-swipe="true"
                onClick={() => onSelectDay(day)}
                className="relative flex flex-col items-center justify-start cursor-pointer pt-1 h-[52px] rounded-lg transition-colors w-full"
                style={selected ? { backgroundColor: 'var(--calendar-selected-day)' } : {}}
              >
                <span className="relative flex items-center justify-center size-6 flex-shrink-0">
                  {isToday && <span className="absolute inset-0 rounded-full bg-accent-blue shadow-[0_0_8px_rgba(59,130,246,0.5)]" />}
                  <span className={`relative text-sm tabular-nums leading-none ${isToday ? 'text-white font-bold' : 'text-foreground'}`}>
                    {day}
                  </span>
                </span>
                <div className="flex flex-col items-center gap-0 mt-0.5">
                  {(dayData?.expense ?? 0) > 0 && (
                    <span className={`text-[8px] tabular-nums font-semibold dark:font-normal leading-tight ${isFutureMonth ? 'opacity-40' : ''}`} style={{ color: semanticColors.expense }}>
                      {formatAmount(dayData!.expense)}
                    </span>
                  )}
                  {(dayData?.income ?? 0) > 0 && (
                    <span className={`text-[8px] tabular-nums font-semibold dark:font-normal leading-tight ${isFutureMonth ? 'opacity-40' : ''}`} style={{ color: '#14b8a6' }}>
                      {formatAmount(dayData!.income)}
                    </span>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function WeekStripView({
  year,
  month,
  weekDays,
  focusedWeekDay,
  onSelectDay,
}: {
  year: number
  month: number
  weekDays: number[]
  focusedWeekDay: number | null
  onSelectDay: (day: number) => void
}) {
  return (
    <div className="px-4">
      <div className="grid grid-cols-7 pt-3 pb-2 mb-1 border-b border-border px-0">
        {WEEKDAYS_MON.map(day => (
          <div key={day} className="text-center text-[10px] font-medium text-muted-foreground">{day}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-1 pt-2">
        {weekDays.map(day => {
          const selected = focusedWeekDay === day
          return (
            <button
              key={day}
              data-no-swipe="true"
              onClick={() => onSelectDay(day)}
              className="flex flex-col items-center gap-1 pb-2"
            >
              <span className="text-[10px] font-medium text-muted-foreground">{WEEKDAYS_MON[(new Date(year, month - 1, day).getDay() + 6) % 7]}</span>
              <span className={`flex size-8 items-center justify-center rounded-full text-[14px] font-semibold tabular-nums ${selected ? 'bg-accent-blue text-white' : 'bg-surface text-foreground'}`}>{day}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
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
  const monthEndDate = `${targetYear}-${String(actualMonth).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`

  const monthTxs = useMemo(() => transactions.filter(t => {
    const d = new Date(t.date)
    return d.getFullYear() === targetYear && d.getMonth() + 1 === actualMonth
  }), [transactions, targetYear, actualMonth])

  let monthIncome = monthTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  let monthExpense = monthTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  if (isFutureMonth) {
    monthExpense += recurringItems.filter(r => r.type === 'expense').reduce((s, r) => s + r.amount, 0)
    monthIncome += recurringItems.filter(r => r.type === 'income').reduce((s, r) => s + r.amount, 0)
  }

  const monthSavingsAmt = transactions.filter(t => t.type === 'savings' && t.date <= monthEndDate && (!t.end_date || t.end_date > monthEndDate)).reduce((s, t) => s + t.amount, 0)
  const cumIncome = transactions.filter(t => t.type === 'income' && t.date <= monthEndDate).reduce((s, t) => s + t.amount, 0)
  const cumExpense = transactions.filter(t => t.type === 'expense' && t.date <= monthEndDate).reduce((s, t) => s + t.amount, 0)
  const cumSavings = transactions.filter(t => t.type === 'savings' && t.date <= monthEndDate && (!t.end_date || t.end_date > monthEndDate)).reduce((s, t) => s + t.amount, 0)
  const monthBalance = cumIncome - cumExpense - cumSavings

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

  const totalWeeks = getWeekNum(targetYear, actualMonth, daysInMonth)
  const currentWeekNum = (targetYear === today.getFullYear() && actualMonth === today.getMonth() + 1)
    ? getWeekNum(today.getFullYear(), today.getMonth() + 1, today.getDate())
    : isFutureMonth ? 1 : totalWeeks
  const defaultDay = targetYear === today.getFullYear() && actualMonth === today.getMonth() + 1 ? today.getDate() : 1

  const [viewMode, setViewMode] = useState<ViewMode>('calendar')
  const [selectedWeek, setSelectedWeek] = useState(currentWeekNum)
  const [selectedDay, setSelectedDay] = useState(defaultDay)
  const dayRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const [highlightedDate, setHighlightedDate] = useState<string | null>(null)

  useEffect(() => {
    setViewMode('calendar')
    setSelectedWeek(currentWeekNum)
    setSelectedDay(defaultDay)
    setHighlightedDate(null)
  }, [targetYear, actualMonth, currentWeekNum, defaultDay])

  const monthRecurring = useMemo(() => isFutureMonth ? recurringItems : [], [isFutureMonth, recurringItems])

  const dailySummaries = useMemo(() => {
    const map = new Map<number, { income: number; expense: number }>()
    for (const tx of monthTxs) {
      const day = new Date(tx.date).getDate()
      const current = map.get(day) ?? { income: 0, expense: 0 }
      if (tx.type === 'income') current.income += tx.amount
      if (tx.type === 'expense') current.expense += tx.amount
      map.set(day, current)
    }
    if (isFutureMonth) {
      for (const item of monthRecurring) {
        const current = map.get(item.day) ?? { income: 0, expense: 0 }
        if (item.type === 'income') current.income += item.amount
        if (item.type === 'expense') current.expense += item.amount
        map.set(item.day, current)
      }
    }
    return map
  }, [monthTxs, monthRecurring, isFutureMonth])

  const calendarDayTxs = useMemo(() => monthTxs
    .filter(t => new Date(t.date).getDate() === selectedDay)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()), [monthTxs, selectedDay])

  const calendarDayRecurring = monthRecurring.filter(r => r.day === selectedDay)
  const calendarDayIncome = (dailySummaries.get(selectedDay)?.income ?? 0)
  const calendarDayExpense = (dailySummaries.get(selectedDay)?.expense ?? 0)

  const weekTxs = useMemo(() => monthTxs
    .filter(t => getWeekNumFromDate(t.date) === selectedWeek)
    .sort((a, b) => {
      const dateDiff = new Date(a.date).getTime() - new Date(b.date).getTime()
      return dateDiff !== 0 ? dateDiff : new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    }), [monthTxs, selectedWeek])

  const weekRecurring = isFutureMonth
    ? recurringItems.filter(r => getWeekNum(targetYear, actualMonth, r.day) === selectedWeek)
    : []

  const weekIncome = weekTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
    + weekRecurring.filter(r => r.type === 'income').reduce((s, r) => s + r.amount, 0)
  const weekExpense = weekTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
    + weekRecurring.filter(r => r.type === 'expense').reduce((s, r) => s + r.amount, 0)

  const { startDay, endDay } = getWeekDateRange(targetYear, actualMonth, selectedWeek)
  const weekDays = Array.from({ length: endDay - startDay + 1 }, (_, i) => startDay + i)

  const groupedWeekTxs = useMemo(() => {
    const groups = new Map<string, Transaction[]>()
    for (const tx of weekTxs) {
      const list = groups.get(tx.date) ?? []
      list.push(tx)
      groups.set(tx.date, list)
    }
    return groups
  }, [weekTxs])

  const groupedWeekRecurring = useMemo(() => {
    const groups = new Map<string, RecurringItem[]>()
    for (const item of weekRecurring) {
      const key = formatDateKey(targetYear, actualMonth, item.day)
      const list = groups.get(key) ?? []
      list.push(item)
      groups.set(key, list)
    }
    return groups
  }, [weekRecurring, targetYear, actualMonth])

  const weekSectionDays = weekDays.filter(day => {
    const key = formatDateKey(targetYear, actualMonth, day)
    return (groupedWeekTxs.get(key)?.length ?? 0) > 0 || (groupedWeekRecurring.get(key)?.length ?? 0) > 0
  })

  const handleWeekTabClick = (week: number) => {
    setViewMode('week')
    setSelectedWeek(week)
    const { startDay } = getWeekDateRange(targetYear, actualMonth, week)
    setSelectedDay(startDay)
    setHighlightedDate(null)
  }

  const jumpToDay = (day: number) => {
    const key = formatDateKey(targetYear, actualMonth, day)
    const node = dayRefs.current[key]
    setSelectedDay(day)
    if (!node) return
    setHighlightedDate(key)
    node.scrollIntoView({ behavior: 'smooth', block: 'start' })
    window.setTimeout(() => setHighlightedDate(current => current === key ? null : current), 1400)
  }

  return (
    <>
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

      <div className="overflow-x-auto scrollbar-hide px-4 mb-4">
        <div className="flex gap-2" style={{ width: 'max-content' }}>
          <button
            data-no-swipe="true"
            onClick={() => setViewMode('calendar')}
            className={`px-6 py-2 rounded-full text-[14px] font-semibold whitespace-nowrap transition-colors ${viewMode === 'calendar' ? 'bg-accent-blue text-white' : 'bg-surface text-muted-foreground'}`}
          >
            달력
          </button>
          {Array.from({ length: totalWeeks }, (_, i) => i + 1).map(week => (
            <button
              key={week}
              data-no-swipe="true"
              onClick={() => handleWeekTabClick(week)}
              className={`px-6 py-2 rounded-full text-[14px] font-semibold whitespace-nowrap transition-colors ${viewMode === 'week' && selectedWeek === week ? 'bg-accent-blue text-white' : 'bg-surface text-muted-foreground'}`}
            >
              {week}주 차
            </button>
          ))}
        </div>
      </div>

      {viewMode === 'calendar' ? (
        <div>
          <div className="px-4">
            <MonthlyGridView
              year={targetYear}
              month={actualMonth}
              selectedDay={selectedDay}
              dailySummaries={dailySummaries}
              isFutureMonth={isFutureMonth}
              onSelectDay={setSelectedDay}
            />
          </div>

          <div className="mx-5 mb-3 mt-4 flex gap-3">
            <div className="flex-1 bg-surface rounded-[22px] px-4 py-4">
              <p className="text-[14px] font-semibold text-muted-foreground mb-1">지출</p>
              <p className="text-[20px] font-bold tabular-nums" style={{ color: semanticColors.expense }}>₩{calendarDayExpense.toLocaleString()}</p>
            </div>
            <div className="flex-1 bg-surface rounded-[22px] px-4 py-4">
              <p className="text-[14px] font-semibold text-muted-foreground mb-1">수입</p>
              <p className="text-[20px] font-bold tabular-nums" style={{ color: semanticColors.income }}>₩{calendarDayIncome.toLocaleString()}</p>
            </div>
          </div>

          <div className="flex flex-col px-4 pb-8">
            {calendarDayTxs.length === 0 && calendarDayRecurring.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">내역이 없어요</p>
            ) : (
              <>
                {calendarDayTxs.map((tx, index) => (
                  <TxRow
                    key={tx.id}
                    tx={tx}
                    categories={categories}
                    showDate={false}
                    dateLabel={index === 0 ? `${selectedDay}일` : undefined}
                    emphasizeDateLabel
                    emphasizeAmount
                    onEdit={onEdit}
                    onDeleted={onDeleted}
                  />
                ))}
                {calendarDayRecurring.map((r, ri) => (
                  <div key={`calendar-recurring-${ri}`} className="opacity-40 italic border-dashed border-b border-border px-5 py-2">
                    <div className="flex items-center gap-3">
                      <div className="w-14 flex-shrink-0">{ri === 0 ? <span className="text-[14px] font-semibold">예정</span> : null}</div>
                      <div className="flex-1 min-w-0 flex items-center gap-2">
                        <span className="text-xs text-white px-3 py-1 rounded-full inline-block" style={{ backgroundColor: r.type === 'expense' ? semanticColors.expense : semanticColors.income }}>
                          {r.categoryName || '미분류'}
                        </span>
                      </div>
                      <span className="text-sm font-semibold tabular-nums flex-shrink-0">₩{r.amount.toLocaleString()}</span>
                    </div>
                    {r.description && <p className="text-[10px] text-muted-foreground truncate mt-1 pl-[68px]">{r.description}</p>}
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      ) : (
        <div>
          <WeekStripView
            year={targetYear}
            month={actualMonth}
            weekDays={weekDays}
            focusedWeekDay={selectedDay}
            onSelectDay={jumpToDay}
          />

          <div className="mx-5 mb-3 mt-4 flex gap-3">
            <div className="flex-1 bg-surface rounded-[22px] px-4 py-4">
              <p className="text-[14px] font-semibold text-muted-foreground mb-1">지출</p>
              <p className="text-[20px] font-bold tabular-nums" style={{ color: semanticColors.expense }}>₩{weekExpense.toLocaleString()}</p>
            </div>
            <div className="flex-1 bg-surface rounded-[22px] px-4 py-4">
              <p className="text-[14px] font-semibold text-muted-foreground mb-1">수입</p>
              <p className="text-[20px] font-bold tabular-nums" style={{ color: semanticColors.income }}>₩{weekIncome.toLocaleString()}</p>
            </div>
          </div>

          <div className="flex flex-col px-4 pb-8">
            {weekSectionDays.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">내역이 없어요</p>
            ) : (
              weekSectionDays.map(day => {
                const key = formatDateKey(targetYear, actualMonth, day)
                const txs = groupedWeekTxs.get(key) ?? []
                const recurring = groupedWeekRecurring.get(key) ?? []
                const date = new Date(targetYear, actualMonth - 1, day)
                return (
                  <div
                    key={key}
                    ref={node => { dayRefs.current[key] = node }}
                    className={`rounded-[20px] transition-colors ${highlightedDate === key ? 'bg-surface/80' : ''}`}
                  >
                    <div className="px-5 pt-4 pb-2">
                      <div className="flex items-baseline gap-2">
                        <span className="text-[16px] font-semibold tabular-nums">{day}일</span>
                        <span className="text-[12px] text-muted-foreground">{DAY_NAMES[date.getDay()]}요일</span>
                      </div>
                    </div>
                    {txs.map(tx => (
                      <TxRow
                        key={tx.id}
                        tx={tx}
                        categories={categories}
                        showDate={false}
                        emphasizeAmount
                        onEdit={onEdit}
                        onDeleted={onDeleted}
                      />
                    ))}
                    {recurring.map((r, ri) => (
                      <div key={`${key}-recurring-${ri}`} className="opacity-40 italic border-dashed border-b border-border px-5 py-2">
                        <div className="flex items-center gap-3">
                          <div className="w-14 flex-shrink-0">{ri === 0 && txs.length === 0 ? <span className="text-[14px] font-semibold">예정</span> : null}</div>
                          <div className="flex-1 min-w-0 flex items-center gap-2">
                            <span className="text-xs text-white px-3 py-1 rounded-full inline-block" style={{ backgroundColor: r.type === 'expense' ? semanticColors.expense : semanticColors.income }}>
                              {r.categoryName || '미분류'}
                            </span>
                            <span className="text-[9px] bg-accent-coral/20 text-accent-coral px-1.5 py-0.5 rounded">예정</span>
                          </div>
                          <span className="text-sm font-semibold tabular-nums flex-shrink-0">₩{r.amount.toLocaleString()}</span>
                        </div>
                        {r.description && <p className="text-[10px] text-muted-foreground truncate mt-1 pl-[68px]">{r.description}</p>}
                      </div>
                    ))}
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </>
  )
}
