'use client'

import { useState, useEffect, useCallback } from 'react'
import { BottomNav } from '@/components/bottom-nav'
import { MonthlyCalendar } from '@/components/monthly-calendar'
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

  // 전체 기간 자산 총합 (1회 로드)
  const loadAllTime = useCallback(async () => {
    try {
      const { getTransactions } = await import('@/lib/api')
      const all = await getTransactions({})
      setAllTimeIncome(all.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0))
      setAllTimeExpense(all.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0))
      setAllTimeSavings(all.filter(t => t.type === 'savings').reduce((s, t) => s + t.amount, 0))
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
    <div className="min-h-dvh bg-background pb-32">
      <div className="sticky top-0 z-30 bg-background px-5 border-b border-border">
        <TopHeader title={`₩${cashBalance.toLocaleString()}`} subtitle="잔액" />
      </div>

      <div className="px-5">

        {/* 금월 수입/지출 */}
        <div className="bg-surface rounded-[18px] mb-4">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <span className="text-sm text-muted-foreground">금월 수입</span>
            <span className="text-sm font-semibold tabular-nums text-accent-blue">₩{monthIncome.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-muted-foreground">금월 지출</span>
            <span className="text-sm font-semibold tabular-nums text-accent-coral">₩{monthExpense.toLocaleString()}</span>
          </div>
        </div>

        <MonthlyCalendar
          onMonthChange={(y, m, inc, exp) => { setCalYear(y); setCalMonth(m); setSelectedDay(1); setMonthIncome(inc); setMonthExpense(exp) }}
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
    </div>
  )
}
