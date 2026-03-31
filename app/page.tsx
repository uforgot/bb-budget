'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PullToRefresh } from '@/components/pull-to-refresh'
import { BottomNav } from '@/components/bottom-nav'
import { MonthlyCalendar } from '@/components/monthly-calendar'
import { AddTransactionModal } from '@/components/add-transaction-modal'
import { type Transaction } from '@/lib/api'
import { LayoutGrid } from 'lucide-react'

function toDateStr(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export default function Home() {
  const router = useRouter()
  const today = new Date()
  const [selectedDay, setSelectedDay] = useState(today.getDate())
  const [calYear, setCalYear] = useState(today.getFullYear())
  const [calMonth, setCalMonth] = useState(today.getMonth() + 1)
  const [modalOpen, setModalOpen] = useState(false)
  const [editTx, setEditTx] = useState<Transaction | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const selectedDate = toDateStr(calYear, calMonth, selectedDay)

  // 반복 지출 자동 확정 (1회)
  useEffect(() => {
    ;(async () => {
      try {
        const { confirmRecurringTransactions } = await import('@/lib/api')
        await confirmRecurringTransactions(today.getFullYear(), today.getMonth() + 1)
      } catch {}
    })()
  }, [])

  return (
    <PullToRefresh className="min-h-dvh bg-background pb-32" onRefresh={async () => setRefreshKey(k => k + 1)}>
      {/* 상단 바 — 좌측 대시보드 아이콘 */}
      <div className="sticky top-0 z-30 bg-background px-5">
        <div className="flex items-center justify-between h-14 pt-[env(safe-area-inset-top,0px)]">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center justify-center w-8 h-8 rounded-lg"
            aria-label="대시보드"
          >
            <LayoutGrid className="w-5 h-5 text-foreground" />
          </button>
          <div className="w-8" />
        </div>
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
