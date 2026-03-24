'use client'

import { useState, useEffect, useCallback } from 'react'
import { BottomNav } from '@/components/bottom-nav'
import { MonthlyCalendar } from '@/components/monthly-calendar'
import { TopHeader } from '@/components/top-header'
import { AddTransactionModal } from '@/components/add-transaction-modal'
import { getMonthlySummary, type Transaction } from '@/lib/api'

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
  const [editTx, setEditTx] = useState<Transaction | null>(null)
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([])
  const [calYear, setCalYear] = useState(today.getFullYear())
  const [calMonth, setCalMonth] = useState(today.getMonth() + 1)

  const [totalIncome, setTotalIncome] = useState(0)
  const [totalExpense, setTotalExpense] = useState(0)
  const [totalSavings, setTotalSavings] = useState(0)
  const [allTimeIncome, setAllTimeIncome] = useState(0)
  const [allTimeExpense, setAllTimeExpense] = useState(0)
  const [allTimeSavings, setAllTimeSavings] = useState(0)
  const [dailyData, setDailyData] = useState<Record<number, { income?: number; expense?: number; savings?: number; items?: { type: 'income' | 'expense' | 'savings'; category: string; parentCategory?: string; description: string; amount: number }[] }>>({})

  const selectedDate = toDateStr(calYear, calMonth, selectedDay)

  const loadData = useCallback(async () => {
    try {
      const summary = await getMonthlySummary(calYear, calMonth)
      setTotalIncome(summary.income)
      setTotalExpense(summary.expense)
      setTotalSavings(summary.savings)
      setDailyData(summary.daily)
      setAllTransactions(summary.transactions)
    } catch (e) {
      console.error('데이터 로드 실패:', e)
    }
  }, [calYear, calMonth])

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

  useEffect(() => {
    loadData()
    // 탭 전환 시 자동 새로고침
    const handleFocus = () => loadData()
    window.addEventListener('focus', handleFocus)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') loadData()
    })
    return () => {
      window.removeEventListener('focus', handleFocus)
    }
  }, [loadData])

  const totalAssets = allTimeIncome - allTimeExpense
  const cashBalance = totalAssets - allTimeSavings

  // Pull to refresh
  const [pulling, setPulling] = useState(false)
  const handleTouchRefresh = async () => {
    if (pulling) return
    setPulling(true)
    await loadData()
    setPulling(false)
  }

  return (
    <div className="min-h-dvh bg-background pb-32">
      <div className="px-5">
        <TopHeader title={`₩${totalAssets.toLocaleString()}`} subtitle="자산 보유 중" />

        <div className="bg-surface rounded-[18px] mb-6">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <span className="text-sm text-muted-foreground">수입</span>
            <span className="text-sm font-semibold tabular-nums text-accent-blue">₩{formatCompact(totalIncome)}</span>
          </div>
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <span className="text-sm text-muted-foreground">지출</span>
            <span className="text-sm font-semibold tabular-nums text-accent-coral">₩{formatCompact(totalExpense)}</span>
          </div>
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <span className="text-sm text-muted-foreground">잔고</span>
            <span className={`text-sm font-semibold tabular-nums ${cashBalance >= 0 ? 'text-foreground' : 'text-accent-coral'}`}>₩{formatCompact(cashBalance)}</span>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-accent-mint">저축</span>
            <span className="text-sm font-semibold tabular-nums text-accent-mint">₩{formatCompact(allTimeSavings)}</span>
          </div>
        </div>

        <MonthlyCalendar
          year={calYear}
          month={calMonth}
          data={dailyData}
          onDaySelect={(day) => setSelectedDay(day)}
          onMonthChange={(y, m) => { setCalYear(y); setCalMonth(m); setSelectedDay(1) }}
          onItemClick={(day, itemIndex) => {
            // 해당 날짜의 트랜잭션 찾기
            const dayTxs = allTransactions.filter(t => new Date(t.date).getDate() === day)
            if (dayTxs[itemIndex]) {
              setEditTx(dayTxs[itemIndex])
              setModalOpen(true)
            }
          }}
        />

        {pulling && (
          <p className="text-xs text-muted-foreground text-center py-2">새로고침 중...</p>
        )}
      </div>

      <AddTransactionModal
        open={modalOpen}
        initialDate={selectedDate}
        editTransaction={editTx}
        onClose={() => {
          setModalOpen(false)
          setEditTx(null)
          loadData()
          loadAllTime()
        }}
        onSave={() => {}}
      />

      {!modalOpen && <BottomNav onAdd={() => { setEditTx(null); setModalOpen(true) }} />}
    </div>
  )
}
