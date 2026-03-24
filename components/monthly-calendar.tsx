'use client'

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { getMonthlySummary, type Transaction } from '@/lib/api'

// ─── Types ────────────────────────────────────────────────────

interface DayData {
  income?: number
  expense?: number
  savings?: number
  items?: DayItem[]
}

interface DayItem {
  type: 'income' | 'expense' | 'savings'
  category: string
  parentCategory?: string
  description: string
  amount: number
}

interface CachedMonth {
  income: number
  expense: number
  savings: number
  daily: Record<number, DayData>
  transactions: Transaction[]
}

type MonthEntry = { year: number; month: number /* 0-indexed */ }

interface SelectedDay {
  year: number
  month: number // 0-indexed
  day: number
}

// ─── Constants ────────────────────────────────────────────────

const INITIAL_RANGE = 12

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']


function buildInitialMonths(anchor: Date): MonthEntry[] {
  const months: MonthEntry[] = []
  const y = anchor.getFullYear()
  const m = anchor.getMonth()
  for (let offset = -INITIAL_RANGE; offset <= INITIAL_RANGE; offset++) {
    const d = new Date(y, m + offset, 1)
    months.push({ year: d.getFullYear(), month: d.getMonth() })
  }
  return months
}

function monthKey(year: number, month: number): string {
  return `${year}-${month}`
}

function formatAmount(amount: number): string {
  if (amount >= 100000000) {
    const eok = Math.floor(amount / 100000000)
    const rest = Math.floor((amount % 100000000) / 10000000)
    return rest > 0 ? `${eok}.${rest}억` : `${eok}억`
  }
  if (amount >= 100000) {
    const man = Math.floor(amount / 10000)
    return `${man}만`
  }
  return amount.toLocaleString()
}

// ─── MonthGrid ────────────────────────────────────────────────

function MonthGrid({
  year,
  month,
  data,

  selectedDay,
  onDayClick,
}: {
  year: number
  month: number // 0-indexed
  data: Record<number, DayData>
  selectedDay: SelectedDay | null
  onDayClick: (year: number, month: number, day: number) => void
}) {
  const today = new Date()
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month
  const todayDate = today.getDate()

  const firstDayWeekday = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const cells: (number | null)[] = []
  for (let i = 0; i < firstDayWeekday; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  const isSelected = (day: number) =>
    selectedDay?.year === year && selectedDay?.month === month && selectedDay?.day === day

  return (
    <div className="w-full px-2">
      {/* Month separator */}
      <div className="h-2" />

      {/* Day grid */}
      <div className="grid grid-cols-7">
        {cells.map((day, i) => {
          if (!day) return <div key={`e-${i}`} className="h-[52px]" />

          const dayData = data[day]
          const isToday = isCurrentMonth && day === todayDate
          const selected = isSelected(day)

          return (
            <div
              key={day}
              onClick={() => onDayClick(year, month, day)}
              className={`relative flex flex-col items-center cursor-pointer py-1.5 h-[52px] rounded-lg transition-colors ${
                selected ? 'bg-accent' : ''
              }`}
            >
              <span className="relative flex items-center justify-center size-6">
                {isToday && <span className="absolute inset-0 rounded-full bg-primary" />}
                <span
                  className={`relative text-sm tabular-nums leading-none ${
                    isToday ? 'text-primary-foreground font-semibold' : 'text-foreground'
                  }`}
                >
                  {day}
                </span>
              </span>
              <div className="mt-0.5 flex flex-col items-center gap-0">
                {(dayData?.income ?? 0) > 0 && (
                  <span className="text-[8px] tabular-nums text-accent-blue leading-tight">
                    {formatAmount(dayData!.income!)}
                  </span>
                )}
                {(dayData?.expense ?? 0) > 0 && (
                  <span className="text-[8px] tabular-nums text-accent-coral leading-tight">
                    {formatAmount(dayData!.expense!)}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Main Calendar Component ─────────────────────────────────

export interface MonthlyCalendarProps {
  onMonthChange?: (year: number, month: number, income: number, expense: number) => void
  onTransactionClick?: (transaction: Transaction) => void
  refreshKey?: number
}

export function MonthlyCalendar({ onMonthChange, onTransactionClick, refreshKey = 0 }: MonthlyCalendarProps) {
  const [months, setMonths] = useState<MonthEntry[]>(() => buildInitialMonths(new Date()))
  const [focusedMonthIndex, setFocusedMonthIndex] = useState(INITIAL_RANGE)
  const [headerLabel, setHeaderLabel] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}년 ${now.getMonth() + 1}월`
  })
  const [selectedDay, setSelectedDay] = useState<SelectedDay | null>(() => {
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth(), day: now.getDate() }
  })
  const [dataCache, setDataCache] = useState<Map<string, CachedMonth>>(new Map())


  const loadingMonthsRef = useRef<Set<string>>(new Set())
  const touchStartYRef = useRef<number | null>(null)

  // Load data for a specific month
  const loadMonthData = useCallback(async (year: number, month: number) => {
    const key = monthKey(year, month)
    if (loadingMonthsRef.current.has(key)) return
    loadingMonthsRef.current.add(key)
    try {
      const summary = await getMonthlySummary(year, month + 1)
      setDataCache(prev => {
        const next = new Map(prev)
        next.set(key, {
          income: summary.income,
          expense: summary.expense,
          savings: summary.savings,
          daily: summary.daily,
          transactions: summary.transactions,
        })
        return next
      })
    } catch (e) {
      console.error(`Failed to load ${year}-${month + 1}:`, e)
    } finally {
      loadingMonthsRef.current.delete(key)
    }
  }, [])

  // Refresh data when refreshKey changes
  useEffect(() => {
    if (refreshKey === 0) return
    setDataCache(new Map())
    loadingMonthsRef.current.clear()
  }, [refreshKey])

  // Load focused month data + notify parent
  useEffect(() => {
    const entry = months[focusedMonthIndex]
    if (entry) {
      const key = monthKey(entry.year, entry.month)
      if (!dataCache.has(key)) {
        loadMonthData(entry.year, entry.month)
      }
      const cached = dataCache.get(key)
      if (cached) {
        onMonthChange?.(entry.year, entry.month + 1, cached.income, cached.expense)
      }
    }
  }, [focusedMonthIndex, months, dataCache, loadMonthData, onMonthChange])

  const handleDayClick = useCallback((year: number, month: number, day: number) => {
    setSelectedDay(prev => {
      if (prev?.year === year && prev?.month === month && prev?.day === day) return null
      return { year, month, day }
    })
  }, [])

  // Selected day detail data
  const selectedDayData = useMemo(() => {
    if (!selectedDay) return null
    const key = monthKey(selectedDay.year, selectedDay.month)
    const cached = dataCache.get(key)
    if (!cached) return null
    return {
      data: cached.daily[selectedDay.day] as DayData | undefined,
      transactions: cached.transactions,
      income: cached.income,
      expense: cached.expense,
    }
  }, [selectedDay, dataCache])

  const handleItemClick = useCallback((day: number, itemIndex: number) => {
    if (!selectedDay || !onTransactionClick) return
    const key = monthKey(selectedDay.year, selectedDay.month)
    const cached = dataCache.get(key)
    if (!cached) return
    const dayTxs = cached.transactions.filter(t => new Date(t.date).getDate() === day)
    if (dayTxs[itemIndex]) onTransactionClick(dayTxs[itemIndex])
  }, [selectedDay, dataCache, onTransactionClick])

  return (
    <div>
      {/* Header: current visible month */}
      <div className="flex items-center justify-center w-full py-3">
        <h1 className="text-base font-semibold text-foreground">
          {headerLabel}
        </h1>
      </div>

      {/* Fixed weekday row */}
      <div className="grid grid-cols-7 pb-2 mb-1 border-b border-border px-2">
        {WEEKDAYS.map(day => (
          <div key={day} className="text-center text-[11px] font-medium text-muted-foreground">
            {day}
          </div>
        ))}
      </div>

      {/* Single month grid with horizontal swipe */}
      <div
        onTouchStart={(e) => { touchStartYRef.current = e.touches[0].clientX }}
        onTouchEnd={(e) => {
          if (touchStartYRef.current === null) return
          const diff = e.changedTouches[0].clientX - touchStartYRef.current
          touchStartYRef.current = null
          if (Math.abs(diff) > 50) {
            const dir = diff > 0 ? -1 : 1
            setFocusedMonthIndex(prev => {
              const next = prev + dir
              if (next < 0 || next >= months.length) return prev
              const entry = months[next]
              setHeaderLabel(`${entry.year}년 ${entry.month + 1}월`)
              const cached = dataCache.get(monthKey(entry.year, entry.month))
              onMonthChange?.(entry.year, entry.month + 1, cached?.income ?? 0, cached?.expense ?? 0)
              return next
            })
          }
        }}
      >
        {(() => {
          const entry = months[focusedMonthIndex]
          const cached = dataCache.get(monthKey(entry.year, entry.month))
          return (
            <MonthGrid
              year={entry.year}
              month={entry.month}
              data={cached?.daily ?? {}}
              selectedDay={selectedDay}
              onDayClick={handleDayClick}
            />
          )
        })()}
      </div>

      {/* Selected day detail */}
      {selectedDay && (() => {
        const dayOfWeek = ['일요일','월요일','화요일','수요일','목요일','금요일','토요일'][
          new Date(selectedDay.year, selectedDay.month, selectedDay.day).getDay()
        ]
        const sd = selectedDayData?.data
        const totalExpense = sd?.expense ?? 0
        const totalIncome = sd?.income ?? 0
        const totalSavings = sd?.savings ?? 0
        const totalDay = totalExpense + totalIncome + totalSavings

        return (
          <div className="mt-4">
            {/* Date + total header */}
            <div className="bg-surface flex items-center justify-between px-5 py-3">
              <span className="text-sm font-semibold">
                {selectedDay.month + 1}월 {selectedDay.day}일 {dayOfWeek}
              </span>
              {totalDay > 0 && (
                <span className={`text-sm font-semibold tabular-nums ${
                  totalExpense > 0 ? 'text-accent-coral' : totalIncome > 0 ? 'text-accent-blue' : 'text-accent-mint'
                }`}>
                  ₩{totalDay.toLocaleString()}
                </span>
              )}
            </div>

            {/* Items list */}
            {sd?.items && sd.items.length > 0 ? (
              <div className="flex flex-col">
                {sd.items.map((item, i) => {
                  const colorClass = item.type === 'savings'
                    ? 'text-accent-mint'
                    : item.type === 'expense'
                      ? 'text-accent-coral'
                      : 'text-accent-blue'
                  return (
                    <div
                      key={i}
                      onClick={() => handleItemClick(selectedDay.day, i)}
                      className="flex items-center justify-between py-2 px-5 cursor-pointer active:bg-surface"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xs bg-muted px-3 py-1.5 rounded-full">
                          {item.parentCategory ? (
                            <><span className="text-foreground">{item.parentCategory}</span><span className="text-muted-foreground"> · {item.category}</span></>
                          ) : (
                            <span className="text-foreground">{item.category}</span>
                          )}
                        </span>
                        {item.description && (
                          <span className="text-[10px] text-muted-foreground line-clamp-2">{item.description}</span>
                        )}
                      </div>
                      <span className={`text-[15px] font-semibold tabular-nums ${colorClass}`}>
                        ₩{item.amount.toLocaleString()}
                      </span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">내역이 없어요</p>
            )}
          </div>
        )
      })()}
    </div>
  )
}
