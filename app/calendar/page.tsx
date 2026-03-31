'use client'

import { useState } from 'react'
import { PullToRefresh } from '@/components/pull-to-refresh'
import { BottomNav } from '@/components/bottom-nav'
import { MonthlyCalendar } from '@/components/monthly-calendar'
import { TopHeader } from '@/components/top-header'
import { AddTransactionModal } from '@/components/add-transaction-modal'
import { type Transaction } from '@/lib/api'

function toDateStr(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export default function CalendarPage() {
  const today = new Date()
  const [selectedDay, setSelectedDay] = useState(today.getDate())
  const [calYear, setCalYear] = useState(today.getFullYear())
  const [calMonth, setCalMonth] = useState(today.getMonth() + 1)
  const [modalOpen, setModalOpen] = useState(false)
  const [editTx, setEditTx] = useState<Transaction | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const selectedDate = toDateStr(calYear, calMonth, selectedDay)

  return (
    <PullToRefresh className="min-h-dvh bg-background pb-32" onRefresh={async () => setRefreshKey(k => k + 1)}>
      <div className="sticky top-0 z-30 bg-background px-5">
        <TopHeader title="달력" />
      </div>

      <div className="px-5">
        <MonthlyCalendar
          onMonthChange={(y, m, _inc, _exp) => { setCalYear(y); setCalMonth(m) }}
          onDaySelect={(y, m, d) => { setCalYear(y); setCalMonth(m); setSelectedDay(d) }}
          onTransactionClick={(tx) => {
            setEditTx(tx)
            setModalOpen(true)
          }}
          refreshKey={refreshKey}
        />
      </div>

      <AddTransactionModal
        open={modalOpen}
        initialDate={selectedDate}
        editTransaction={editTx}
        onClose={() => {
          setModalOpen(false)
          setEditTx(null)
          setRefreshKey(k => k + 1)
        }}
        onSave={() => {}}
      />

      {!modalOpen && <BottomNav onAdd={() => { setEditTx(null); setModalOpen(true) }} />}
    </PullToRefresh>
  )
}
