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

  // TODO: Supabase에서 실제 데이터 가져오기
  const totalIncome = 0
  const totalExpense = 0
  const totalSavings = 0
  const totalAssets = totalIncome - totalExpense + totalSavings

  const summary = [
    { label: '수입', value: `₩${totalIncome.toLocaleString()}`, color: 'text-blue-400' },
    { label: '지출', value: `₩${totalExpense.toLocaleString()}`, color: 'text-red-400' },
    { label: '저축', value: `₩${totalSavings.toLocaleString()}`, color: 'text-green-400' },
  ]

  return (
    <div className="min-h-dvh bg-background pb-20">
      <div className="max-w-md mx-auto px-4">
        <TopHeader title="요약" />

        {/* 총 자산 */}
        <div className="mb-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">총 자산</p>
          <p className={`text-3xl font-bold tabular-nums ${totalAssets >= 0 ? 'text-foreground' : 'text-red-400'}`}>
            ₩{totalAssets.toLocaleString()}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          {summary.map(({ label, value, color }) => (
            <div key={label} className="bg-card rounded-xl p-4">
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
