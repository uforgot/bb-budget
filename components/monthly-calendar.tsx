'use client'

import { useState, useRef } from 'react'

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

interface MonthlyCalendarProps {
  year: number
  month: number // 1-indexed
  data?: Record<number, DayData>
  onDaySelect?: (day: number) => void
  onMonthChange?: (year: number, month: number) => void
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']
const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토']

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

export function MonthlyCalendar({ year: initYear, month: initMonth, data = {}, onDaySelect, onMonthChange }: MonthlyCalendarProps) {
  const today = new Date()
  const [year, setYear] = useState(initYear)
  const [month, setMonth] = useState(initMonth)
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() + 1 === month
  const todayDate = today.getDate()
  const [selectedDay, setSelectedDay] = useState<number | null>(isCurrentMonth ? todayDate : 1)
  const firstDay = new Date(year, month - 1, 1).getDay()
  const daysInMonth = new Date(year, month, 0).getDate()

  const cells: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  const selectedData = selectedDay ? data[selectedDay] : undefined
  const touchStartX = useRef<number | null>(null)
  const touchStartY = useRef<number | null>(null)

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return
    const dx = Math.abs(e.touches[0].clientX - touchStartX.current)
    const dy = Math.abs(e.touches[0].clientY - touchStartY.current)
    // 수평 스와이프가 수직보다 크면 스크롤 방지
    if (dx > dy && dx > 10) {
      e.preventDefault()
    }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return
    const diff = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(diff) > 50) {
      goMonth(diff > 0 ? -1 : 1)
    }
    touchStartX.current = null
    touchStartY.current = null
  }

  const goMonth = (dir: -1 | 1) => {
    let newMonth = month + dir
    let newYear = year
    if (newMonth < 1) { newMonth = 12; newYear-- }
    if (newMonth > 12) { newMonth = 1; newYear++ }
    setYear(newYear)
    setMonth(newMonth)
    setSelectedDay(null)
    onMonthChange?.(newYear, newMonth)
  }

  return (
    <div>
      <div>
        {/* Month nav */}
        <div className="flex items-center justify-center gap-2 mb-3">
          <button
            onClick={() => goMonth(-1)}
            className="p-1 text-muted-foreground"
            aria-label="이전 달"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
          <h1 className="text-base font-semibold text-foreground">
            {year}년 {month}월
          </h1>
          <button
            onClick={() => goMonth(1)}
            className="p-1 text-muted-foreground"
            aria-label="다음 달"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        </div>

        {/* Weekday header */}
        <div className="grid grid-cols-7 pb-2 mb-2 border-b border-border">
          {WEEKDAYS.map((day, i) => (
            <div
              key={day}
              className={`text-center text-[11px] font-medium ${
                i === 0 ? 'text-accent-coral' : i === 6 ? 'text-accent-blue' : 'text-muted-foreground'
              }`}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div
          className="grid grid-cols-7"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {cells.map((day, i) => {
            const dayOfWeek = i % 7
            const dayData = day ? data[day] : undefined
            const isToday = isCurrentMonth && day === todayDate
            const isSelected = day === selectedDay

            return (
              <div
                key={i}
                onClick={() => {
                  if (!day) return
                  const newDay = day === selectedDay ? null : day
                  setSelectedDay(newDay)
                  if (newDay && onDaySelect) onDaySelect(newDay)
                }}
                className={`relative flex flex-col items-center rounded-lg transition-colors ${
                  day ? 'cursor-pointer py-2 min-h-[64px]' : ''
                } ${isSelected ? 'bg-accent' : ''}`}
              >
                {day && (
                  <>
                    <span className="relative flex items-center justify-center size-7">
                      {isToday && (
                        <span className="absolute inset-0 rounded-full bg-primary" />
                      )}
                      <span
                        className={`relative text-sm tabular-nums leading-none ${
                          isToday
                            ? 'text-primary-foreground font-semibold'
                            : dayOfWeek === 0
                              ? 'text-accent-coral'
                              : dayOfWeek === 6
                                ? 'text-accent-blue'
                                : 'text-foreground'
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
                  </>
                )}
              </div>
            )
          })}
        </div>

        {/* Selected day detail */}
        {selectedDay !== null && (
          <div className="border-t border-border mt-2 pt-3">
            {/* 일간 요약 */}
            {selectedData && (
              <div className="flex items-center justify-center gap-4 mb-3 text-xs">
                {(selectedData.income ?? 0) > 0 && (
                  <span className="text-accent-blue">수입 ₩{(selectedData.income ?? 0).toLocaleString()}</span>
                )}
                {(selectedData.expense ?? 0) > 0 && (
                  <span className="text-accent-coral">지출 ₩{(selectedData.expense ?? 0).toLocaleString()}</span>
                )}
                {((selectedData as any).savings ?? 0) > 0 && (
                  <span className="text-accent-mint">저축 ₩{((selectedData as any).savings ?? 0).toLocaleString()}</span>
                )}
              </div>
            )}

            {/* 내역 */}
            {selectedData?.items && selectedData.items.length > 0 ? (
              <div className="flex flex-col gap-1">
                {selectedData.items.map((item, i) => {
                  const colorClass = (item as any).type === 'savings'
                    ? 'text-accent-mint'
                    : item.type === 'expense'
                      ? 'text-accent-coral'
                      : 'text-accent-blue'
                  const catDisplay = (item as any).parentCategory
                    ? `${(item as any).parentCategory} > ${item.category}`
                    : item.category
                  return (
                    <div key={i} className="flex items-center justify-between py-1">
                      <div className="flex flex-col flex-1 min-w-0">
                        <span className="text-sm truncate">{catDisplay}</span>
                        {item.description && (
                          <span className="text-[11px] text-muted-foreground truncate">{item.description}</span>
                        )}
                      </div>
                      <span className={`text-sm font-medium tabular-nums flex-shrink-0 ml-3 ${colorClass}`}>
                        ₩{item.amount.toLocaleString()}
                      </span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-3">내역이 없어요</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
