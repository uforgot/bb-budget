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
  monthlyIncome?: number
  monthlyExpense?: number
  onDaySelect?: (day: number) => void
  onMonthChange?: (year: number, month: number) => void
  onItemClick?: (day: number, itemIndex: number) => void
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

export function MonthlyCalendar({ year: initYear, month: initMonth, data = {}, monthlyIncome = 0, monthlyExpense = 0, onDaySelect, onMonthChange, onItemClick }: MonthlyCalendarProps) {
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

        {/* 금월 수입/지출 */}
        {(monthlyIncome > 0 || monthlyExpense > 0) && (
          <div className="bg-surface rounded-[18px] mb-4">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <span className="text-sm text-muted-foreground">금월 수입</span>
              <span className="text-sm font-semibold tabular-nums text-accent-blue">₩{monthlyIncome.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-sm text-muted-foreground">금월 지출</span>
              <span className="text-sm font-semibold tabular-nums text-accent-coral">₩{monthlyExpense.toLocaleString()}</span>
            </div>
          </div>
        )}

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
                className={`relative flex flex-col items-center ${
                  day ? 'cursor-pointer py-2 min-h-[64px] rounded-lg transition-colors' : ''
                } ${day && isSelected ? 'bg-accent' : ''}`}
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
        {selectedDay !== null && (() => {
          const dayOfWeek = ['일요일','월요일','화요일','수요일','목요일','금요일','토요일'][new Date(year, month - 1, selectedDay).getDay()]
          const totalExpense = selectedData?.expense ?? 0
          const totalIncome = selectedData?.income ?? 0
          const totalSavings = (selectedData as any)?.savings ?? 0
          const totalDay = totalExpense + totalIncome + totalSavings

          return (
            <div className="mt-4">
              {/* 날짜 + 총액 헤더 */}
              <div className="bg-surface rounded-[18px] flex items-center justify-between px-5 py-4 mb-3">
                <span className="text-sm font-semibold">{month}월 {selectedDay}일 {dayOfWeek}</span>
                {totalDay > 0 && (
                  <span className={`text-sm font-semibold tabular-nums ${
                    totalExpense > 0 ? 'text-accent-coral' : totalIncome > 0 ? 'text-accent-blue' : 'text-accent-mint'
                  }`}>
                    ₩{totalDay.toLocaleString()}
                  </span>
                )}
              </div>

              {/* 내역 리스트 */}
              {selectedData?.items && selectedData.items.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {selectedData.items.map((item, i) => {
                    const colorClass = item.type === 'savings'
                      ? 'text-accent-mint'
                      : item.type === 'expense'
                        ? 'text-accent-coral'
                        : 'text-accent-blue'
                    const catLabel = item.parentCategory
                      ? `${item.parentCategory} · ${item.category}`
                      : item.category
                    return (
                      <div key={i} onClick={() => onItemClick?.(selectedDay, i)} className="flex items-center justify-between py-2 px-5 cursor-pointer active:bg-surface rounded-lg">
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
    </div>
  )
}
