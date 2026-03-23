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

  // 더미 달력 데이터
  const marchData: Record<number, { income?: number; expense?: number }> = {
    1: { expense: 866630 },
    2: { expense: 226500 },
    3: { income: 95634, expense: 121634 },
    4: { expense: 33000 },
    5: { expense: 42700 },
    6: { income: 30000, expense: 70720 },
    7: { expense: 157030 },
    8: { income: 70066, expense: 151377 },
    9: { expense: 112500 },
    10: { income: 9673032, expense: 1838490 },
    11: { income: 10000, expense: 29000 },
    12: { expense: 87700 },
    13: { expense: 60600 },
    14: { expense: 175850 },
    15: { expense: 258000 },
    16: { expense: 45750 },
    17: { expense: 163000 },
    18: { expense: 52890 },
    19: { expense: 7270 },
    20: { expense: 35400 },
    21: { expense: 28900 },
    22: { expense: 45000 },
    23: { income: 5000, expense: 67800 },
    24: { expense: 31200 },
    25: { expense: 89000 },
    26: { income: 15000, expense: 42300 },
    27: { expense: 55600 },
    28: { expense: 38700 },
    29: { expense: 22100 },
    30: { expense: 71500 },
    31: { expense: 19800 },
  }

  const totalIncome = 123456678
  const totalExpense = 123456678
  const totalSavings = 123456678
  const totalAssets = 123456678

  const summary = [
    { label: '수입', value: `₩${totalIncome.toLocaleString()}`, color: 'text-blue-400' },
    { label: '지출', value: `₩${totalExpense.toLocaleString()}`, color: 'text-red-400' },
    { label: '저축', value: `₩${totalSavings.toLocaleString()}`, color: 'text-green-400' },
  ]

  return (
    <div className="min-h-dvh bg-background pb-20">
      <div className="px-5">
        <TopHeader title={`₩${totalAssets.toLocaleString()}`} />

        <div className="grid grid-cols-3 gap-3 mb-6">
          {summary.map(({ label, value, color }) => (
            <div key={label} className="bg-card rounded-xl p-3">
              <p className="text-xs text-muted-foreground mb-1">{label}</p>
              <p className={`text-sm font-bold tabular-nums ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        <MonthlyCalendar
          year={2026}
          month={3}
          data={marchData}
          onDaySelect={(day) => setSelectedDay(day)}
        />
      </div>

      <AddTransactionFab selectedDate={selectedDate} />
      <BottomNav />
    </div>
  )
}
