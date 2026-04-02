'use client'

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { getMonthlySummary, getRecurringPreview, type Transaction } from '@/lib/api'

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
  isRecurring?: boolean
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

const WEEKDAYS = ['월', '화', '수', '목', '금', '토', '일']


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

const ROW_H = 52
const SEP_H = 8

function getWeeksInMonth(year: number, month: number): number {
  const firstDay = (new Date(year, month, 1).getDay() + 6) % 7 // 월=0, 일=6
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  return Math.ceil((firstDay + daysInMonth) / 7)
}

function getMonthHeight(year: number, month: number): number {
  return getWeeksInMonth(year, month) * ROW_H + SEP_H
}

function monthKey(year: number, month: number): string {
  return `${year}-${month}`
}

function formatAmount(amount: number): string {
  if (amount >= 10000) {
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
  isFutureMonth,
  selectedDay,
  onDayClick,
}: {
  year: number
  month: number // 0-indexed
  data: Record<number, DayData>
  isFutureMonth?: boolean
  selectedDay: SelectedDay | null
  onDayClick: (year: number, month: number, day: number) => void
}) {
  const today = new Date()
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month
  const todayDate = today.getDate()

  const firstDayWeekday = (new Date(year, month, 1).getDay() + 6) % 7 // 월=0, 일=6
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
              className={`relative flex flex-col items-center justify-start cursor-pointer pt-1 h-[52px] rounded-lg transition-colors ${selected ? 'bg-accent' : ''}`}
            >
              <span className="relative flex items-center justify-center size-6 flex-shrink-0">
                {isToday && <span className="absolute inset-0 rounded-full bg-accent-blue shadow-[0_0_8px_rgba(59,130,246,0.5)]" />}
                <span
                  className={`relative text-sm tabular-nums leading-none ${
                    isToday ? 'text-white font-bold' : 'text-foreground'
                  }`}
                >
                  {day}
                </span>
              </span>
              <div className="flex flex-col items-center gap-0 mt-0.5">
                {(dayData?.expense ?? 0) > 0 && (
                  <span className={`text-[8px] tabular-nums font-semibold dark:font-normal text-accent-coral leading-tight ${isFutureMonth ? 'opacity-40' : ''}`}>
                    {formatAmount(dayData!.expense!)}
                  </span>
                )}
                {(dayData?.income ?? 0) > 0 && (
                  <span className={`text-[8px] tabular-nums font-semibold dark:font-normal text-accent-blue leading-tight ${isFutureMonth ? 'opacity-40' : ''}`}>
                    {formatAmount(dayData!.income!)}
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
  onDaySelect?: (year: number, month: number, day: number) => void
  onTransactionClick?: (transaction: Transaction) => void
  refreshKey?: number
  showHeader?: boolean
  showDayDetail?: boolean
  targetYear?: number  // 마운트 시 초기 연월 (key 리마운트 연동, 이후 스와이프 방해 안 함)
  targetMonth?: number // 1-indexed (key 변경 시만 적용)
}

export function MonthlyCalendar({ onMonthChange, onDaySelect, onTransactionClick, refreshKey = 0, showHeader = true, showDayDetail = true, targetYear, targetMonth }: MonthlyCalendarProps) {
  const anchor = targetYear && targetMonth ? new Date(targetYear, targetMonth - 1, 1) : new Date()
  const [months, setMonths] = useState<MonthEntry[]>(() => buildInitialMonths(anchor))
  const [focusedMonthIndex, setFocusedMonthIndex] = useState(INITIAL_RANGE)
  const [headerLabel, setHeaderLabel] = useState(() => {
    return `${anchor.getFullYear()}년 ${anchor.getMonth() + 1}월`
  })
  const [selectedDay, setSelectedDay] = useState<SelectedDay | null>(() => {
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth(), day: now.getDate() }
  })
  const [dataCache, setDataCache] = useState<Map<string, CachedMonth>>(new Map())


  const loadingMonthsRef = useRef<Set<string>>(new Set())

  // targetYear/targetMonth: key prop 리마운트 방식 사용 (이 effect는 비움)

  // Touch slider state
  const sliderRef = useRef<HTMLDivElement>(null)
  const startXRef = useRef(0)
  const moveXRef = useRef(0)
  const isDraggingRef = useRef(false)
  const [dragOffset, setDragOffset] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)

  const goMonth = useCallback((dir: -1 | 1) => {
    setFocusedMonthIndex(prev => {
      const next = prev + dir
      if (next < 0 || next >= months.length) return prev
      const entry = months[next]
      setHeaderLabel(`${entry.year}년 ${entry.month + 1}월`)
      // 현재 달로 돌아오면 오늘 날짜 자동 선택
      const now = new Date()
      if (entry.year === now.getFullYear() && entry.month === now.getMonth()) {
        setSelectedDay({ year: now.getFullYear(), month: now.getMonth(), day: now.getDate() })
        onDaySelect?.(now.getFullYear(), now.getMonth() + 1, now.getDate())
      } else {
        setSelectedDay(null)
      }
      return next
    })
  }, [months, onDaySelect])

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (isAnimating) return
    isDraggingRef.current = true
    startXRef.current = e.touches[0].clientY
    moveXRef.current = e.touches[0].clientY
  }, [isAnimating])

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDraggingRef.current) return
    const y = e.touches[0].clientY
    const diff = y - startXRef.current
    if (Math.abs(diff) > 5) {
      e.preventDefault()
      e.stopPropagation()
    }
    setDragOffset(diff * 0.4)
    moveXRef.current = y
  }, [])

  const onTouchEnd = useCallback(() => {
    if (!isDraggingRef.current) return
    isDraggingRef.current = false
    const diff = moveXRef.current - startXRef.current

    if (Math.abs(diff) > 40) {
      const dir = diff > 0 ? -1 : 1
      setIsAnimating(true)
      const entry = months[focusedMonthIndex]
      const currH = getMonthHeight(entry.year, entry.month)
      const prevEntry = focusedMonthIndex > 0 ? months[focusedMonthIndex - 1] : null
      const prevH = prevEntry ? getMonthHeight(prevEntry.year, prevEntry.month) : currH
      setDragOffset(diff > 0 ? prevH : -currH)
      setTimeout(() => {
        goMonth(dir)
        setDragOffset(0)
        setIsAnimating(false)
      }, 250)
    } else {
      setIsAnimating(true)
      setDragOffset(0)
      setTimeout(() => setIsAnimating(false), 250)
    }
  }, [goMonth])

  // Load data for a specific month
  const loadMonthData = useCallback(async (year: number, month: number) => {
    const key = monthKey(year, month)
    if (loadingMonthsRef.current.has(key)) return
    loadingMonthsRef.current.add(key)
    try {
      const summary = await getMonthlySummary(year, month + 1)
      const daily = { ...summary.daily }

      // 반복 지출 예정 데이터 합산 (현재 달 포함 — 확정 안 된 것만)
      {
        const preview = await getRecurringPreview(year, month + 1)
        for (const p of preview) {
          if (!daily[p.day]) daily[p.day] = { income: 0, expense: 0, savings: 0, items: [] }
          if (p.type === 'expense') daily[p.day].expense = (daily[p.day].expense || 0) + p.amount
          else if (p.type === 'income') daily[p.day].income = (daily[p.day].income || 0) + p.amount
          daily[p.day].items = daily[p.day].items || []
          daily[p.day].items!.push({
            type: p.type as 'income' | 'expense' | 'savings',
            category: p.categoryName || '',
            description: p.description,
            amount: p.amount,
            isRecurring: true,
          } as any)
        }
      }

      setDataCache(prev => {
        const next = new Map(prev)
        next.set(key, {
          income: summary.income,
          expense: summary.expense,
          savings: summary.savings,
          daily,
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
  const prevRefreshKey = useRef(refreshKey)
  useEffect(() => {
    if (refreshKey !== prevRefreshKey.current) {
      setDataCache(new Map())
      loadingMonthsRef.current.clear()
      prevRefreshKey.current = refreshKey
    }
  }, [refreshKey])

  // Load focused month + adjacent months data, notify parent
  useEffect(() => {
    const indices = [focusedMonthIndex - 1, focusedMonthIndex, focusedMonthIndex + 1]
    indices.forEach(idx => {
      if (idx >= 0 && idx < months.length) {
        const entry = months[idx]
        const key = monthKey(entry.year, entry.month)
        if (!dataCache.has(key)) loadMonthData(entry.year, entry.month)
      }
    })
    const entry = months[focusedMonthIndex]
    if (entry) {
      const cached = dataCache.get(monthKey(entry.year, entry.month))
      if (cached) onMonthChange?.(entry.year, entry.month + 1, cached.income, cached.expense)
    }
  }, [focusedMonthIndex, months, dataCache, loadMonthData, onMonthChange])

  const handleDayClick = useCallback((year: number, month: number, day: number) => {
    setSelectedDay(prev => {
      if (prev?.year === year && prev?.month === month && prev?.day === day) return null
      return { year, month, day }
    })
    onDaySelect?.(year, month + 1, day) // month is 0-indexed internally, 1-indexed for parent
  }, [onDaySelect])

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
      {/* 연월 헤더 */}
      {showHeader && (
        <div className="px-4 pt-4 pb-2">
          <span className="text-[18px] font-bold">{headerLabel}</span>
        </div>
      )}
      {/* Fixed weekday row */}
      <div className="grid grid-cols-7 pt-3 pb-2 mb-1 border-b border-border px-2">
        {WEEKDAYS.map(day => (
          <div key={day} className="text-center text-[11px] font-medium text-muted-foreground">
            {day}
          </div>
        ))}
      </div>

      {/* Touch slider calendar — 연결된 월, 고정 컨테이너 */}
      {(() => {
        const CONTAINER_H = 6 * ROW_H + SEP_H // 320px 고정

        const entry = months[focusedMonthIndex]
        const prevEntry = focusedMonthIndex > 0 ? months[focusedMonthIndex - 1] : null
        const nextEntry = focusedMonthIndex < months.length - 1 ? months[focusedMonthIndex + 1] : null
        const prevH = prevEntry ? getMonthHeight(prevEntry.year, prevEntry.month) : 0

        const cachedCurr = dataCache.get(monthKey(entry.year, entry.month))
        const cachedPrev = prevEntry ? dataCache.get(monthKey(prevEntry.year, prevEntry.month)) : null
        const cachedNext = nextEntry ? dataCache.get(monthKey(nextEntry.year, nextEntry.month)) : null

        const now = new Date()
        const isFuture = (y: number, m: number) => y > now.getFullYear() || (y === now.getFullYear() && m > now.getMonth())

        return (
          <div
            ref={sliderRef}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            style={{ height: CONTAINER_H, overflow: 'hidden', touchAction: 'none' }}
          >
            <div
              style={{
                transform: `translate3d(0, ${dragOffset - prevH}px, 0)`,
                transition: isAnimating ? 'transform 0.25s ease-out' : 'none',
                willChange: 'transform',
              }}
            >
              {/* 이전 달 — 자연 높이 */}
              {prevEntry && (
                <div className="opacity-10">
                  <MonthGrid year={prevEntry.year} month={prevEntry.month} data={cachedPrev?.daily ?? {}} selectedDay={null} onDayClick={handleDayClick} />
                </div>
              )}

              {/* 현재 달 — 자연 높이 */}
              <MonthGrid year={entry.year} month={entry.month} data={cachedCurr?.daily ?? {}} isFutureMonth={isFuture(entry.year, entry.month)} selectedDay={selectedDay} onDayClick={handleDayClick} />

              {/* 다음 달 — 자연 높이 */}
              {nextEntry && (
                <div className="opacity-10">
                  <MonthGrid year={nextEntry.year} month={nextEntry.month} data={cachedNext?.daily ?? {}} selectedDay={null} onDayClick={handleDayClick} />
                </div>
              )}
            </div>
          </div>
        )
      })()}

      {/* Selected day detail */}
      {showDayDetail && selectedDay && (() => {
        const dayOfWeek = ['일요일','월요일','화요일','수요일','목요일','금요일','토요일'][
          new Date(selectedDay.year, selectedDay.month, selectedDay.day).getDay()
        ]
        const sd = selectedDayData?.data
        const totalExpense = sd?.expense ?? 0
        const totalIncome = sd?.income ?? 0
        const totalSavings = sd?.savings ?? 0
        const totalDay = totalIncome - totalExpense

        return (
          <div className="mt-1">
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
                      onClick={() => !item.isRecurring && handleItemClick(selectedDay.day, i)}
                      className={`flex items-center justify-between py-2 px-5 ${item.isRecurring ? 'opacity-40 italic border-dashed border-b border-border' : 'cursor-pointer active:bg-surface'}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xs px-3 py-1.5 rounded-full" style={{ backgroundColor: 'rgba(207,102,121,0.15)', color: '#CF6679' }}>
                          {item.parentCategory ? (
                            <>{item.parentCategory}<span style={{ opacity: 0.6 }}> · {item.category}</span></>
                          ) : (
                            item.category
                          )}
                        </span>
                        {item.isRecurring && (
                          <span className="text-[9px] bg-accent-coral/20 text-accent-coral px-1.5 py-0.5 rounded">예정</span>
                        )}
                        {i === 0 && item.description && (
                          <span className="text-[10px] text-muted-foreground line-clamp-1">{item.description}</span>
                        )}
                      </div>
                      <span className={`text-sm font-semibold tabular-nums ${colorClass}`}>
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
