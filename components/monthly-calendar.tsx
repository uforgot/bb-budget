'use client'

import { useState, useRef, useEffect, useCallback, useLayoutEffect, useMemo, CSSProperties, ReactElement } from 'react'
import { List, useListRef } from 'react-window'
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
const EXTEND_COUNT = 12
const EDGE_THRESHOLD = 3
const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']
const WEEK_ROW_H = 52
const MONTH_HEADER_H = 8
const MONTH_PAD = 8

// ─── Helpers ──────────────────────────────────────────────────

function getWeeksInMonth(year: number, month: number): number {
  const firstDay = new Date(year, month, 1)
  const startWeekday = firstDay.getDay()
  const totalDays = new Date(year, month + 1, 0).getDate()
  return Math.ceil((startWeekday + totalDays) / 7)
}

function monthRowHeight(entry: MonthEntry): number {
  return getWeeksInMonth(entry.year, entry.month) * WEEK_ROW_H + MONTH_HEADER_H + MONTH_PAD
}

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

// ─── MonthRow (for react-window) ──────────────────────────────

interface RowExtraProps {
  months: MonthEntry[]
  focusedMonthIndex: number
  dataCache: Map<string, CachedMonth>
  selectedDay: SelectedDay | null
  onDayClick: (year: number, month: number, day: number) => void
}

function MonthRow({
  index,
  style,
  months,
  focusedMonthIndex,
  dataCache,
  selectedDay,
  onDayClick,
}: {
  index: number
  style: CSSProperties
  ariaAttributes: { 'aria-posinset': number; 'aria-setsize': number; role: 'listitem' }
} & RowExtraProps): ReactElement {
  const { year, month } = months[index]
  const isFocused = index === focusedMonthIndex
  const key = monthKey(year, month)
  const cached = dataCache.get(key)

  return (
    <div
      style={{ ...style, scrollSnapAlign: 'start' }}
      className={`${isFocused ? 'opacity-100' : 'opacity-30'} transition-opacity duration-100`}
    >
      <MonthGrid
        year={year}
        month={month}
        data={cached?.daily ?? {}}

        selectedDay={selectedDay}
        onDayClick={onDayClick}
      />
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
  const [centerIndex, setCenterIndex] = useState(INITIAL_RANGE)
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

  const listRef = useListRef(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerHeight, setContainerHeight] = useState(0)
  const [scrolledToCenter, setScrolledToCenter] = useState(false)
  const pendingPrependRef = useRef<number>(0)
  const extendingRef = useRef(false)
  const loadingMonthsRef = useRef<Set<string>>(new Set())

  // Measure container height
  useEffect(() => {
    if (!containerRef.current) return
    const ro = new ResizeObserver(([entry]) => {
      setContainerHeight(entry.contentRect.height)
    })
    ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  // Scroll to current month on mount
  useEffect(() => {
    if (scrolledToCenter) return
    let attempts = 0
    const tryScroll = () => {
      if (listRef.current) {
        listRef.current.scrollToRow({ index: centerIndex, align: 'start' })
        setScrolledToCenter(true)
      } else if (attempts < 10) {
        attempts++
        requestAnimationFrame(tryScroll)
      }
    }
    requestAnimationFrame(tryScroll)
  }, [listRef, scrolledToCenter, centerIndex])

  // After prepend: adjust scrollTop
  useLayoutEffect(() => {
    if (pendingPrependRef.current > 0) {
      const el = listRef.current?.element
      if (el) {
        el.scrollTop += pendingPrependRef.current
      }
      pendingPrependRef.current = 0
      extendingRef.current = false
    }
  }, [months, listRef])

  // Load data for a specific month
  const loadMonthData = useCallback(async (year: number, month: number) => {
    const key = monthKey(year, month)
    if (loadingMonthsRef.current.has(key)) return
    loadingMonthsRef.current.add(key)
    try {
      const summary = await getMonthlySummary(year, month + 1) // API uses 1-indexed month
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

  // Load visible months data
  const loadVisibleData = useCallback((startIdx: number, stopIdx: number) => {
    for (let i = Math.max(0, startIdx - 1); i <= Math.min(months.length - 1, stopIdx + 1); i++) {
      const entry = months[i]
      const key = monthKey(entry.year, entry.month)
      if (!dataCache.has(key)) {
        loadMonthData(entry.year, entry.month)
      }
    }
  }, [months, dataCache, loadMonthData])

  // Refresh data when refreshKey changes
  useEffect(() => {
    if (refreshKey === 0) return
    // Clear cache and reload visible months
    setDataCache(new Map())
    loadingMonthsRef.current.clear()
  }, [refreshKey])

  // Reload focused month when cache is cleared
  useEffect(() => {
    if (dataCache.size === 0 && months.length > 0) {
      const entry = months[focusedMonthIndex]
      if (entry) loadMonthData(entry.year, entry.month)
    }
  }, [dataCache.size, months, focusedMonthIndex, loadMonthData])

  const getRowHeight = useCallback(
    (index: number, _rowProps: RowExtraProps) => monthRowHeight(months[index]),
    [months]
  )

  const handleRowsRendered = useCallback(
    (visibleRows: { startIndex: number; stopIndex: number }) => {
      // Update header and focused month
      const entry = months[visibleRows.startIndex]
      if (entry) {
        setHeaderLabel(`${entry.year}년 ${entry.month + 1}월`)
        setFocusedMonthIndex(visibleRows.startIndex)
        const cached = dataCache.get(`${entry.year}-${entry.month}`)
        onMonthChange?.(entry.year, entry.month + 1, cached?.income ?? 0, cached?.expense ?? 0)
      }

      // Load data for visible months
      loadVisibleData(visibleRows.startIndex, visibleRows.stopIndex)

      if (extendingRef.current) return

      // Append: near bottom
      if (visibleRows.stopIndex >= months.length - EDGE_THRESHOLD) {
        extendingRef.current = true
        setMonths(prev => {
          const last = prev[prev.length - 1]
          const newMonths: MonthEntry[] = []
          for (let i = 1; i <= EXTEND_COUNT; i++) {
            const d = new Date(last.year, last.month + i, 1)
            newMonths.push({ year: d.getFullYear(), month: d.getMonth() })
          }
          extendingRef.current = false
          return [...prev, ...newMonths]
        })
      }

      // Prepend: near top
      if (visibleRows.startIndex <= EDGE_THRESHOLD) {
        extendingRef.current = true
        const first = months[0]
        const newMonths: MonthEntry[] = []
        let totalHeight = 0
        for (let i = EXTEND_COUNT; i >= 1; i--) {
          const d = new Date(first.year, first.month - i, 1)
          const entry = { year: d.getFullYear(), month: d.getMonth() }
          newMonths.push(entry)
          totalHeight += monthRowHeight(entry)
        }
        pendingPrependRef.current = totalHeight
        setCenterIndex(prev => prev + EXTEND_COUNT)
        setMonths(prev => [...newMonths, ...prev])
      }
    },
    [months, onMonthChange, loadVisibleData]
  )

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

  const rowProps: RowExtraProps = {
    months,
    focusedMonthIndex,
    dataCache,
    selectedDay,
    onDayClick: handleDayClick,
  }

  return (
    <div className="flex flex-col h-full">
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

      {/* Virtual scroll calendar */}
      <div ref={containerRef} className="flex-1 min-h-0">
        {containerHeight > 0 && (
          <List
            listRef={listRef}
            rowCount={months.length}
            rowHeight={getRowHeight}
            rowComponent={MonthRow}
            rowProps={rowProps}
            overscanCount={3}
            onRowsRendered={handleRowsRendered}
            className="scrollbar-hide"
            style={{ height: containerHeight }}
          />
        )}
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
          <div className="border-t border-border max-h-[40vh] overflow-y-auto">
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
