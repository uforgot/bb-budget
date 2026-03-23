'use client'

import { useState } from 'react'
import { BottomNav } from '@/components/bottom-nav'
import { MonthlyCalendar } from '@/components/monthly-calendar'
import { TopHeader } from '@/components/top-header'
import { AddTransactionModal } from '@/components/add-transaction-modal'

function formatCompact(amount: number): string {
  if (amount >= 100000000) {
    const eok = Math.floor(amount / 100000000)
    const man = Math.floor((amount % 100000000) / 10000)
    return man > 0 ? `${eok}억 ${man.toLocaleString()}만` : `${eok}억`
  }
  return amount.toLocaleString()
}

function toDateStr(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export default function Home() {
  const today = new Date()
  const [selectedDay, setSelectedDay] = useState(today.getDate())
  const [modalOpen, setModalOpen] = useState(false)
  const selectedDate = toDateStr(2026, 3, selectedDay)

  const totalIncome = 0
  const totalExpense = 0
  const totalSavings = 0
  const totalAssets = 0

  const summary = [
    { label: '수입', value: `₩${formatCompact(totalIncome)}`, color: 'text-accent-blue' },
    { label: '지출', value: `₩${formatCompact(totalExpense)}`, color: 'text-accent-coral' },
    { label: '저축', value: `₩${formatCompact(totalSavings)}`, color: 'text-accent-mint' },
  ]

  return (
    <div className="min-h-dvh bg-background pb-20">
      <div className="px-5">
        <TopHeader title={`₩${totalAssets.toLocaleString()}`} subtitle="자산 보유 중" />

        <div className="bg-card rounded-[18px] mb-6">
          {summary.map(({ label, value, color }, i) => (
            <div key={label} className={`flex items-center justify-between px-4 py-3 ${
              i < summary.length - 1 ? 'border-b border-border' : ''
            }`}>
              <span className="text-[15px] text-muted-foreground">{label}</span>
              <span className={`text-[15px] font-semibold tabular-nums ${color}`}>{value}</span>
            </div>
          ))}
        </div>

        <MonthlyCalendar
          year={2026}
          month={3}
          onDaySelect={(day) => setSelectedDay(day)}
        />
      </div>

      <AddTransactionModal
        open={modalOpen}
        initialDate={selectedDate}
        onClose={() => setModalOpen(false)}
        onSave={(data) => {
          console.log('저장:', data)
        }}
      />

      <BottomNav onAdd={() => setModalOpen(true)} hideAdd={modalOpen} />
    </div>
  )
}
