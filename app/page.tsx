'use client'

import { useState } from 'react'
import { BottomNav } from '@/components/bottom-nav'
import { MonthlyCalendar } from '@/components/monthly-calendar'
import { TopHeader } from '@/components/top-header'
import { AddTransactionFab } from '@/components/add-transaction-fab'

function toDateStr(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export default function Home() {
  const today = new Date()
  const [selectedDay, setSelectedDay] = useState(today.getDate())
  const selectedDate = toDateStr(2026, 3, selectedDay)

  const summary = [
    { label: '수입', value: '₩0', color: 'text-blue-400' },
    { label: '지출', value: '₩0', color: 'text-red-400' },
    { label: '잔액', value: '₩0', color: 'text-green-400' },
  ]

  return (
    <div className="min-h-dvh bg-background pb-20">
      <div className="max-w-md mx-auto px-4">
        <TopHeader title="요약" />

        <div className="grid grid-cols-3 gap-3 mb-6">
          {summary.map(({ label, value, color }) => (
            <div key={label} className="bg-card border border-border rounded-xl p-4">
              <p className="text-xs text-muted-foreground mb-1">{label}</p>
              <p className={`text-base font-bold tabular-nums ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        <p className="text-lg font-bold text-pretty mb-3">월간 내역</p>

        <MonthlyCalendar
          year={2026}
          month={3}
          onDaySelect={(day) => setSelectedDay(day)}
        />
      </div>

      <AddTransactionFab selectedDate={selectedDate} />
      <BottomNav />
    </div>
  )
}
