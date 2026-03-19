'use client'

import { useState } from 'react'

interface DayData {
  income?: number
  expense?: number
  items?: DayItem[]
}

interface DayItem {
  type: 'income' | 'expense'
  category: string
  description: string
  amount: number
}

interface MonthlyCalendarProps {
  year: number
  month: number // 1-indexed
  data?: Record<number, DayData> // day -> { income, expense, items }
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']
const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토']

function formatAmount(amount: number): string {
  if (amount >= 10000) {
    const man = Math.floor(amount / 10000)
    const rest = amount % 10000
    return rest > 0 ? `${man}.${Math.floor(rest / 1000)}만` : `${man}만`
  }
  return amount.toLocaleString()
}

export function MonthlyCalendar({ year, month, data = {} }: MonthlyCalendarProps) {
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const firstDay = new Date(year, month - 1, 1).getDay()
  const daysInMonth = new Date(year, month, 0).getDate()
  const today = new Date()
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() + 1 === month
  const todayDate = today.getDate()

  const cells: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)

  const selectedDayOfWeek = selectedDay
    ? DAY_NAMES[new Date(year, month - 1, selectedDay).getDay()]
    : null
  const selectedData = selectedDay ? data[selectedDay] : undefined

  return (
    <div>
      <div className="bg-card border border-border rounded-xl p-4">
        {/* Month title */}
        <h1 className="text-sm font-semibold text-muted-foreground mb-3 text-center">
          {year}년 {month}월
        </h1>

        {/* Weekday header */}
        <div className="grid grid-cols-7 pb-2 mb-2 border-b border-border">
          {WEEKDAYS.map((day, i) => (
            <div
              key={day}
              className={`text-center text-[11px] font-medium ${
                i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-muted-foreground'
              }`}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7">
          {cells.map((day, i) => {
            const dayOfWeek = i % 7
            const dayData = day ? data[day] : undefined
            const isToday = isCurrentMonth && day === todayDate
            const isSelected = day === selectedDay

            return (
              <div
                key={i}
                onClick={() => day && setSelectedDay(day === selectedDay ? null : day)}
                className={`relative flex flex-col items-center py-1.5 min-h-[56px] rounded-lg transition-colors ${
                  day ? 'cursor-pointer' : ''
                } ${isSelected ? 'bg-accent' : ''}`}
              >
                {day && (
                  <>
                    <span className="relative flex items-center justify-center size-5">
                      {isToday && (
                        <span className="absolute inset-0 rounded-full bg-primary" />
                      )}
                      <span
                        className={`relative text-xs tabular-nums leading-none ${
                          isToday
                            ? 'text-primary-foreground font-semibold'
                            : dayOfWeek === 0
                              ? 'text-red-400'
                              : dayOfWeek === 6
                                ? 'text-blue-400'
                                : 'text-foreground'
                        }`}
                      >
                        {day}
                      </span>
                    </span>
                    <div className="mt-0.5 flex flex-col items-center gap-0">
                      <span className="text-[9px] tabular-nums text-blue-400 leading-tight">
                        +{formatAmount(dayData?.income ?? 0)}
                      </span>
                      <span className="text-[9px] tabular-nums text-red-400 leading-tight">
                        -{formatAmount(dayData?.expense ?? 0)}
                      </span>
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Selected day detail */}
      {selectedDay !== null && (
        <div className="mt-3 bg-card border border-border rounded-xl p-4">
          <p className="text-sm font-semibold mb-3 border-b border-border pb-2">
            {selectedDay}일 ({selectedDayOfWeek})
          </p>

          {selectedData?.items && selectedData.items.length > 0 ? (
            <div className="flex flex-col gap-3">
              {selectedData.items.map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-sm">{item.description}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[11px] text-muted-foreground">{item.category}</span>
                    <span className={`text-sm font-medium tabular-nums ${
                      item.type === 'expense' ? 'text-red-400' : 'text-blue-400'
                    }`}>
                      {item.type === 'expense' ? '⊖' : '⊕'} {item.amount.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">내역이 없어요</p>
          )}
        </div>
      )}
    </div>
  )
}
