'use client'

import { memo, useEffect, useMemo, useRef, useState } from 'react'
import { type Transaction, type Category } from '@/lib/api'
import { SummaryCardSlider } from '@/components/summary-card-slider'
import { TxRow } from '@/components/tx-row'
import { semanticColors } from '@/components/ui-colors'
import { formatCompactAmount } from '@/lib/format'
import { resolveYearMonthFromOffset } from '@/lib/date'

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토']
const WEEKDAYS_MON = ['월', '화', '수', '목', '금', '토', '일']

type ViewMode = 'calendar' | 'week'

function getWeekNum(year: number, month: number, day: number): number {
  const firstDay = new Date(year, month - 1, 1)
  const firstMonday = (firstDay.getDay() + 6) % 7
  return Math.ceil((day + firstMonday) / 7)
}

function parseDateParts(dateStr: string) {
  const [year, month, day] = dateStr.split('-').map(Number)
  return { year, month, day }
}

function getWeekNumFromDate(dateStr: string): number {
  const { year, month, day } = parseDateParts(dateStr)
  return getWeekNum(year, month, day)
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


interface RecurringItem {
  day: number
  type: string
  amount: number
  category_id: string
  description: string
  categoryName?: string
  anchor_date?: string
}

interface MonthlyViewProps {
  monthOffset: number
  transactions: Transaction[]
  categories: Category[]
  recurringItems: RecurringItem[]
  forceCalendarView?: boolean
  todayResetToken?: number
  onEdit: (tx: Transaction) => void
  onDeleted: () => void
}

function getCategoryLabel(tx: Transaction, categories: Category[]) {
  const cat = tx.category as Category | undefined
  if (!cat) return '미분류'
  if (!cat.parent_id) return cat.name
  const parent = categories.find(c => c.id === cat.parent_id)
  return parent ? `${parent.name} · ${cat.name}` : cat.name
}

function getTypeLabel(type: Transaction['type'] | RecurringItem['type']) {
  if (type === 'income') return '수입'
  if (type === 'savings') return '저축'
  return '지출'
}

const MonthlyGridView = memo(function MonthlyGridView({
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
      <div className="grid grid-cols-7 pt-3 pb-0 px-0">
        {WEEKDAYS_MON.map(day => (
          <div key={day} className="text-center text-[10px] font-medium text-muted-foreground">{day}</div>
        ))}
      </div>
      <div className="w-full px-0">
        <div className="h-0.5" />
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
                className="relative flex h-[52px] w-full cursor-pointer flex-col items-center justify-start rounded-lg pt-1 transition-colors"
                style={selected ? { backgroundColor: 'var(--calendar-selected-day)' } : {}}
              >
                <span className="relative flex items-center justify-center size-6 flex-shrink-0">
                  <span
                    className={`relative text-[16px] ${isToday ? 'font-semibold text-accent-blue' : 'font-medium text-foreground'} tabular-nums leading-none`}
                    style={{ letterSpacing: '-0.0625em' }}
                  >
                    {day}
                  </span>
                </span>
                <div className="flex flex-col items-center gap-0 mt-0">
                  {(dayData?.expense ?? 0) > 0 && (
                    <span className={`text-[8px] tabular-nums font-semibold dark:font-normal leading-tight ${isFutureMonth ? 'opacity-40' : ''}`} style={{ color: semanticColors.expense, letterSpacing: '-0.0625em' }}>
                      {formatCompactAmount(dayData!.expense)}
                    </span>
                  )}
                  {(dayData?.income ?? 0) > 0 && (
                    <span className={`text-[8px] tabular-nums font-semibold dark:font-normal leading-tight ${isFutureMonth ? 'opacity-40' : ''}`} style={{ color: '#14b8a6', letterSpacing: '-0.0625em' }}>
                      {formatCompactAmount(dayData!.income)}
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
})

const WeekStripView = memo(function WeekStripView({
  year,
  month,
  weekDays,
  focusedWeekDay,
  onSelectDay,
  registerDayButton,
}: {
  year: number
  month: number
  weekDays: number[]
  focusedWeekDay: number | null
  onSelectDay: (day: number) => void
  registerDayButton: (day: number, node: HTMLButtonElement | null) => void
}) {
  const firstWeekday = weekDays.length > 0 ? (new Date(year, month - 1, weekDays[0]).getDay() + 6) % 7 : 0
  const leadingEmpty = Array.from({ length: firstWeekday }, (_, i) => i)

  return (
    <div className="px-5 mb-4">
      <div className="grid grid-cols-7 gap-2">
        {leadingEmpty.map(i => (
          <div key={`empty-${i}`} className="h-[64px]" />
        ))}
        {weekDays.map(day => {
          const selected = focusedWeekDay === day
          const weekdayLabel = WEEKDAYS_MON[(new Date(year, month - 1, day).getDay() + 6) % 7]
          return (
            <button
              key={day}
              ref={node => registerDayButton(day, node)}
              data-no-swipe="true"
              onClick={() => onSelectDay(day)}
              className={`flex h-[64px] flex-col items-center justify-center rounded-[22px] transition-colors ${selected ? 'bg-accent-blue text-white' : 'bg-background text-foreground'}`}
            >
              <span className={`text-[10px] font-medium ${selected ? 'text-white/80' : 'text-muted-foreground'}`}>{weekdayLabel}</span>
              <span className="mt-1 text-[16px] font-medium tracking-[-0.0625em] tabular-nums">{day}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
})

const CalendarDayDetail = memo(function CalendarDayDetail({
  selectedDay,
  targetYear,
  targetMonth,
  calendarDayTxs,
  calendarDayRecurring,
  categories,
  onEdit,
  onDeleted,
}: {
  selectedDay: number
  targetYear: number
  targetMonth: number
  calendarDayTxs: Transaction[]
  calendarDayRecurring: RecurringItem[]
  categories: Category[]
  onEdit: (tx: Transaction) => void
  onDeleted: () => void
}) {
  if (calendarDayTxs.length === 0 && calendarDayRecurring.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-8">내역이 없어요</p>
  }

  return (
    <div className="pb-8 pt-4">
      <WeekDayCard
        day={selectedDay}
        date={new Date(targetYear, targetMonth - 1, selectedDay)}
        txs={calendarDayTxs}
        recurring={calendarDayRecurring}
        categories={categories}
        highlighted={false}
        onEdit={onEdit}
        onDeleted={onDeleted}
        registerRef={() => {}}
      />
    </div>
  )
})

const WeekDayCard = memo(function WeekDayCard({
  day,
  date,
  txs,
  recurring,
  categories,
  highlighted,
  onEdit,
  onDeleted,
  registerRef,
}: {
  day: number
  date: Date
  txs: Transaction[]
  recurring: RecurringItem[]
  categories: Category[]
  highlighted: boolean
  onEdit: (tx: Transaction) => void
  onDeleted: () => void
  registerRef: (node: HTMLDivElement | null) => void
}) {
  const dayIncome = txs.filter(tx => tx.type === 'income').reduce((sum, tx) => sum + tx.amount, 0)
    + recurring.filter(item => item.type === 'income').reduce((sum, item) => sum + item.amount, 0)
  const dayExpense = txs.filter(tx => tx.type === 'expense').reduce((sum, tx) => sum + tx.amount, 0)
    + recurring.filter(item => item.type === 'expense').reduce((sum, item) => sum + item.amount, 0)
  return (
    <div
      ref={registerRef}
      className={`mx-5 mb-3 rounded-[22px] bg-surface transition-colors ${highlighted ? 'ring-1 ring-accent-blue/40' : ''}`}
    >
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-baseline gap-2">
          <span className="text-[14px] font-semibold tabular-nums text-foreground">{date.getMonth() + 1}월 {day}일 {DAY_NAMES[date.getDay()]}요일</span>
        </div>
      </div>

      <div className="mx-4 border-t border-border" />

      <div className="px-4 pb-5 pt-3">
        <div className="space-y-4">
          {txs.map(tx => {
            const label = getCategoryLabel(tx, categories)
            const memoText = tx.description?.trim()
            return (
              <button
                key={tx.id}
                onClick={() => onEdit(tx)}
                className="flex w-full items-center justify-between gap-3 text-left"
              >
                <div className="min-w-0 flex flex-1 items-center gap-3 overflow-hidden">
                  <span
                    className="size-2.5 flex-shrink-0 rounded-full"
                    style={{ backgroundColor: tx.type === 'expense' ? semanticColors.expense : tx.type === 'income' ? semanticColors.income : semanticColors.savings }}
                  />
                  <div className="min-w-0 flex flex-1 items-center gap-3 overflow-hidden text-[14px] text-foreground">
                    <span className="flex-shrink-0 font-medium text-foreground">{label}</span>
                    {memoText && <span className="truncate text-[10px] text-muted-foreground">{memoText}</span>}
                  </div>
                </div>
                <span className="flex-shrink-0 text-[14px] font-semibold tracking-[-0.02em] tabular-nums text-foreground">₩{tx.amount.toLocaleString()}</span>
              </button>
            )
          })}

          {recurring.map((r, ri) => (
            <button
              key={`${day}-recurring-${ri}`}
              type="button"
              onClick={() => {
                const anchor = r.anchor_date ? new Date(`${r.anchor_date}T00:00:00`) : new Date(date)
                alert(`${anchor.getFullYear()}년 ${anchor.getMonth() + 1}월 ${anchor.getDate()}일 반복 지출의 첫 내역에서 항목을 수정하세요.`)
              }}
              className="flex w-full items-center justify-between gap-3 opacity-40 italic text-left"
            >
              <div className="min-w-0 flex flex-1 items-center gap-3 overflow-hidden">
                <span
                  className="size-2.5 flex-shrink-0 rounded-full"
                  style={{ backgroundColor: r.type === 'expense' ? semanticColors.expense : semanticColors.income }}
                />
                <div className="min-w-0 flex flex-1 items-center gap-3 overflow-hidden text-[14px] text-foreground">
                  <span className="flex-shrink-0 font-medium text-foreground">{r.categoryName || '미분류'}</span>
                  {r.description && <span className="truncate text-[10px] text-muted-foreground">{r.description}</span>}
                </div>
              </div>
              <span className="flex-shrink-0 text-[14px] font-semibold tracking-[-0.02em] tabular-nums text-foreground">₩{r.amount.toLocaleString()}</span>
            </button>
          ))}
        </div>

        <div className="mt-3 border-t border-border pt-3 space-y-2">
          <div className="flex items-center justify-between text-[14px] text-muted-foreground">
            <span className="font-medium text-muted-foreground">수입</span>
            <span className="font-semibold tracking-[-0.02em] tabular-nums text-muted-foreground">₩{dayIncome.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between text-[14px] text-muted-foreground">
            <span className="font-medium text-muted-foreground">지출</span>
            <span className="font-semibold tracking-[-0.02em] tabular-nums text-muted-foreground">₩{dayExpense.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  )
})

export function MonthlyView({
  monthOffset, transactions, categories, recurringItems,
  forceCalendarView = false,
  todayResetToken = 0,
  onEdit, onDeleted,
}: MonthlyViewProps) {
  const now = new Date()
  const today = new Date()
  const { currentYear: targetYear, currentMonth: actualMonth } = resolveYearMonthFromOffset(monthOffset, now)
  const isFutureMonth = targetYear > today.getFullYear() || (targetYear === today.getFullYear() && actualMonth > today.getMonth() + 1)
  const isCurrentMonthView = targetYear === today.getFullYear() && actualMonth === today.getMonth() + 1
  const daysInMonth = new Date(targetYear, actualMonth, 0).getDate()
  const monthEndDate = `${targetYear}-${String(actualMonth).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`

  const monthTxs = useMemo(() => transactions.filter(t => {
    const { year, month } = parseDateParts(t.date)
    return year === targetYear && month === actualMonth
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
  const compareDay = Math.min(today.getDate(), prevDays)
  const prevPartialEnd = `${prevY}-${String(prevM).padStart(2,'0')}-${String(compareDay).padStart(2,'0')}`
  const prevPartialTxs = transactions.filter(t => t.date >= prevStart && t.date <= prevPartialEnd)
  const prevIncome = (targetYear === today.getFullYear() && actualMonth === today.getMonth() + 1 ? prevPartialTxs : prevTxs).filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const prevExpense = (targetYear === today.getFullYear() && actualMonth === today.getMonth() + 1 ? prevPartialTxs : prevTxs).filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const prevCompareEndForCard = targetYear === today.getFullYear() && actualMonth === today.getMonth() + 1 ? prevPartialEnd : prevEnd
  const prevSavingsAmt = transactions.filter(t => t.type === 'savings' && t.date <= prevCompareEndForCard && (!t.end_date || t.end_date > prevCompareEndForCard)).reduce((s, t) => s + t.amount, 0)
  const prevCumInc = transactions.filter(t => t.type === 'income' && t.date <= prevCompareEndForCard).reduce((s, t) => s + t.amount, 0)
  const prevCumExp = transactions.filter(t => t.type === 'expense' && t.date <= prevCompareEndForCard).reduce((s, t) => s + t.amount, 0)
  const prevBalance = prevCumInc - prevCumExp - prevSavingsAmt

  const totalWeeks = getWeekNum(targetYear, actualMonth, daysInMonth)
  const isCurrentMonth = targetYear === today.getFullYear() && actualMonth === today.getMonth() + 1
  const currentWeekNum = isCurrentMonth ? getWeekNum(targetYear, actualMonth, today.getDate()) : 1
  const defaultDay = isCurrentMonth ? today.getDate() : 1

  const [viewMode, setViewMode] = useState<ViewMode>('week')
  const [selectedWeek, setSelectedWeek] = useState(currentWeekNum)
  const [selectedDay, setSelectedDay] = useState(defaultDay)
  const dayRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const weekDayButtonRefs = useRef<Record<number, HTMLButtonElement | null>>({})
  const weekTabsScrollRef = useRef<HTMLDivElement | null>(null)
  const stickyRef = useRef<HTMLDivElement | null>(null)
  const [highlightedDate, setHighlightedDate] = useState<string | null>(null)
  const lastMonthKeyRef = useRef(`${targetYear}-${actualMonth}`)

  useEffect(() => {
    setViewMode(forceCalendarView ? 'calendar' : 'week')
  }, [forceCalendarView])

  useEffect(() => {
    const monthKey = `${targetYear}-${actualMonth}`
    if (lastMonthKeyRef.current === monthKey) return
    lastMonthKeyRef.current = monthKey
    setViewMode(forceCalendarView ? 'calendar' : 'week')
    setSelectedWeek(currentWeekNum)
    setSelectedDay(defaultDay)
    setHighlightedDate(null)
    weekTabsScrollRef.current?.scrollTo({ left: 0, behavior: 'auto' })
  }, [targetYear, actualMonth, currentWeekNum, defaultDay, forceCalendarView])

  useEffect(() => {
    if (todayResetToken === 0) return
    const today = new Date()
    const isCurrentMonth = targetYear === today.getFullYear() && actualMonth === today.getMonth() + 1
    const nextDay = isCurrentMonth ? today.getDate() : 1
    const nextWeek = isCurrentMonth ? getWeekNum(targetYear, actualMonth, nextDay) : 1
    setSelectedWeek(nextWeek)
    setSelectedDay(nextDay)
    setHighlightedDate(null)
  }, [todayResetToken, targetYear, actualMonth])

  const monthRecurring = useMemo(() => isFutureMonth ? recurringItems : [], [isFutureMonth, recurringItems])

  const dailySummaries = useMemo(() => {
    const map = new Map<number, { income: number; expense: number }>()
    for (const tx of monthTxs) {
      const { day } = parseDateParts(tx.date)
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
    .filter(t => parseDateParts(t.date).day === selectedDay)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()), [monthTxs, selectedDay])

  const calendarDayRecurring = useMemo(() => monthRecurring.filter(r => r.day === selectedDay), [monthRecurring, selectedDay])
  const calendarDayIncome = dailySummaries.get(selectedDay)?.income ?? 0
  const calendarDayExpense = dailySummaries.get(selectedDay)?.expense ?? 0

  const weekTxs = useMemo(() => monthTxs
    .filter(t => getWeekNumFromDate(t.date) === selectedWeek)
    .sort((a, b) => {
      const aParts = parseDateParts(a.date)
      const bParts = parseDateParts(b.date)
      const dateDiff = new Date(aParts.year, aParts.month - 1, aParts.day).getTime() - new Date(bParts.year, bParts.month - 1, bParts.day).getTime()
      return dateDiff !== 0 ? dateDiff : new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    }), [monthTxs, selectedWeek])

  const weekRecurring = useMemo(() => isFutureMonth
    ? recurringItems.filter(r => getWeekNum(targetYear, actualMonth, r.day) === selectedWeek)
    : [], [isFutureMonth, recurringItems, targetYear, actualMonth, selectedWeek])

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
      list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
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

  const weekSectionDays = useMemo(() => weekDays.filter(day => {
    const key = formatDateKey(targetYear, actualMonth, day)
    return (groupedWeekTxs.get(key)?.length ?? 0) > 0 || (groupedWeekRecurring.get(key)?.length ?? 0) > 0
  }), [weekDays, groupedWeekTxs, groupedWeekRecurring, targetYear, actualMonth])

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
    setHighlightedDate(key)

    if (!node || !stickyRef.current) return

    const stickyRect = stickyRef.current.getBoundingClientRect()
    const isSticky = stickyRect.top === 0

    if (isSticky) {
      const cardTop = node.getBoundingClientRect().top
      const delta = cardTop - stickyRect.bottom - 8
      window.scrollTo({ top: Math.max(0, window.scrollY + delta), behavior: 'smooth' })
    } else {
      const stickyOffset = stickyRef.current.offsetTop
      window.scrollTo({ top: stickyOffset, behavior: 'smooth' })

      window.setTimeout(() => {
        const newStickyBottom = stickyRef.current?.getBoundingClientRect().bottom ?? 0
        const cardTop = node.getBoundingClientRect().top
        const delta = cardTop - newStickyBottom - 8
        window.scrollTo({ top: Math.max(0, window.scrollY + delta), behavior: 'smooth' })
      }, 300)
    }

    window.setTimeout(() => setHighlightedDate(current => current === key ? null : current), 1400)
  }

  return (
    <>
      {viewMode !== 'calendar' && (
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
          labelPrefixOverride={isCurrentMonthView ? `${actualMonth}월` : undefined}
          prevLabelOverride={isCurrentMonthView ? `${prevM}월 동일 시점` : undefined}
        />
      )}

      <div ref={stickyRef} className={`bg-background ${viewMode === 'week' ? 'sticky top-14 z-20 pb-2' : ''}`}>
        {viewMode !== 'calendar' && (
          <div ref={weekTabsScrollRef} className="overflow-x-auto scrollbar-hide px-5 mb-4 pt-1">
            <div className="flex gap-2" style={{ width: 'max-content' }}>
              {Array.from({ length: totalWeeks }, (_, i) => i + 1).map(week => (
                <button
                  key={week}
                  data-no-swipe="true"
                  onClick={() => handleWeekTabClick(week)}
                  className={`px-6 py-2 rounded-full text-[14px] font-semibold whitespace-nowrap transition-colors ${viewMode === 'week' && selectedWeek === week ? 'bg-accent-blue text-white' : 'bg-surface text-muted-foreground opacity-70'}`}
                >
                  {week}주 차
                </button>
              ))}
            </div>
          </div>
        )}

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

          <CalendarDayDetail
            selectedDay={selectedDay}
            targetYear={targetYear}
            targetMonth={actualMonth}
            calendarDayTxs={calendarDayTxs}
            calendarDayRecurring={calendarDayRecurring}
            categories={categories}
            onEdit={onEdit}
            onDeleted={onDeleted}
          />
        </div>
      ) : (
        <div>
          <WeekStripView
            year={targetYear}
            month={actualMonth}
            weekDays={weekDays}
            focusedWeekDay={selectedDay}
            onSelectDay={jumpToDay}
            registerDayButton={(day, node) => { weekDayButtonRefs.current[day] = node }}
          />
        </div>
      )}
      </div>

      {viewMode === 'week' && (
        <>
          <div className="mx-5 mb-3 mt-2 flex gap-3">
            <div className="flex-1 bg-surface rounded-[22px] px-4 pt-4 pb-3">
              <p className="text-[14px] font-semibold text-foreground mb-0">주간 지출</p>
              <p className="text-[20px] font-bold tracking-[-0.03em] tabular-nums" style={{ color: semanticColors.expense }}>₩{weekExpense.toLocaleString()}</p>
            </div>
            <div className="flex-1 bg-surface rounded-[22px] px-4 pt-4 pb-3">
              <p className="text-[14px] font-semibold text-foreground mb-0">주간 수입</p>
              <p className="text-[20px] font-bold tracking-[-0.03em] tabular-nums" style={{ color: semanticColors.income }}>₩{weekIncome.toLocaleString()}</p>
            </div>
          </div>

          <div className="pb-8">
            {weekSectionDays.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">내역이 없어요</p>
            ) : (
              [...weekSectionDays].reverse().map(day => {
                const key = formatDateKey(targetYear, actualMonth, day)
                const txs = groupedWeekTxs.get(key) ?? []
                const recurring = groupedWeekRecurring.get(key) ?? []
                const date = new Date(targetYear, actualMonth - 1, day)
                return (
                  <WeekDayCard
                    key={key}
                    day={day}
                    date={date}
                    txs={txs}
                    recurring={recurring}
                    categories={categories}
                    highlighted={highlightedDate === key}
                    onEdit={onEdit}
                    onDeleted={onDeleted}
                    registerRef={node => { dayRefs.current[key] = node }}
                  />
                )
              })
            )}
          </div>
        </>
      )}
    </>
  )
}
