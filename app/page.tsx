'use client'

import { useState, useEffect, useCallback } from 'react'
import { BottomNav } from '@/components/bottom-nav'
import { MonthlyCalendar } from '@/components/monthly-calendar'
import { PullToRefresh } from '@/components/pull-to-refresh'
import { TopHeader } from '@/components/top-header'
import { AddTransactionModal } from '@/components/add-transaction-modal'
import { type Transaction } from '@/lib/api'

function toDateStr(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export default function Home() {
  const today = new Date()
  const [selectedDay, setSelectedDay] = useState(today.getDate())
  const [modalOpen, setModalOpen] = useState(false)
  const [editTx, setEditTx] = useState<Transaction | null>(null)
  const [calYear, setCalYear] = useState(today.getFullYear())
  const [calMonth, setCalMonth] = useState(today.getMonth() + 1)
  const [refreshKey, setRefreshKey] = useState(0)
  const [monthIncome, setMonthIncome] = useState(0)
  const [monthExpense, setMonthExpense] = useState(0)

  const [allTimeIncome, setAllTimeIncome] = useState(0)
  const [allTimeExpense, setAllTimeExpense] = useState(0)
  const [allTimeSavings, setAllTimeSavings] = useState(0)

  const selectedDate = toDateStr(calYear, calMonth, selectedDay)

  // 반복 지출 자동 확정 (1회)
  useEffect(() => {
    (async () => {
      try {
        const { confirmRecurringTransactions } = await import('@/lib/api')
        const now = new Date()
        await confirmRecurringTransactions(now.getFullYear(), now.getMonth() + 1)
      } catch (e) {
        console.error('반복 지출 확정 실패:', e)
      }
    })()
  }, [])

  // 전체 기간 자산 총합 (1회 로드)
  const loadAllTime = useCallback(async () => {
    try {
      const { getTransactions } = await import('@/lib/api')
      const all = await getTransactions({})
      setAllTimeIncome(all.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0))
      setAllTimeExpense(all.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0))
      setAllTimeSavings(all.filter(t => t.type === 'savings' && !t.end_date).reduce((s, t) => s + t.amount, 0))
    } catch (e) {
      console.error('전체 자산 로드 실패:', e)
    }
  }, [])

  useEffect(() => {
    loadAllTime()
  }, [loadAllTime])

  // 탭 전환 시 자동 새로고침
  useEffect(() => {
    const refresh = () => setRefreshKey(k => k + 1)
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') refresh()
    }
    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', handleVisibility)
    return () => {
      window.removeEventListener('focus', refresh)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [])

  const totalAssets = allTimeIncome - allTimeExpense
  const cashBalance = totalAssets - allTimeSavings

  return (
    <PullToRefresh
      className="min-h-dvh bg-background pb-32"
      onRefresh={async () => {
        setRefreshKey(k => k + 1)
        await loadAllTime()
      }}
    >

      <div className="sticky top-0 z-30 bg-background px-5">
        <TopHeader title={`₩${cashBalance.toLocaleString()}`} subtitle="잔액" />
      </div>

      <div className="px-5">

        {/* N월 수입/지출 — 2열 박스 */}
        <div className="flex gap-4 mb-5 mt-3">
          <div className="flex-1 bg-surface rounded-[18px] px-5 py-4">
            <div className="flex items-center gap-1.5 mb-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent-blue"><path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/></svg>
              <p className="text-xs text-muted-foreground">{calMonth}월 수입</p>
            </div>
            <p className="text-[16px] font-semibold tabular-nums text-accent-blue">₩{monthIncome.toLocaleString()}</p>
          </div>
          <div className="flex-1 bg-surface rounded-[18px] px-5 py-4">
            <div className="flex items-center gap-1.5 mb-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent-coral"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
              <p className="text-xs text-muted-foreground">{calMonth}월 지출</p>
            </div>
            <p className="text-[16px] font-semibold tabular-nums text-accent-coral">₩{monthExpense.toLocaleString()}</p>
          </div>
        </div>

        <MonthlyCalendar
          onMonthChange={(y, m, inc, exp) => { setCalYear(y); setCalMonth(m); setMonthIncome(inc); setMonthExpense(exp) }}
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
          loadAllTime()
        }}
        onSave={() => {}}
      />

      {!modalOpen && <BottomNav onAdd={() => { setEditTx(null); setModalOpen(true) }} />}
    </PullToRefresh>
  )
}
