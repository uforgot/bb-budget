'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { PullToRefresh } from '@/components/pull-to-refresh'
import { BottomNav } from '@/components/bottom-nav'
import { BalanceCard, MonthlySummaryCard } from '@/components/balance-summary-card'
import { AddTransactionModal } from '@/components/add-transaction-modal'
import { type Transaction } from '@/lib/api'

export default function Dashboard() {
  const router = useRouter()
  const today = new Date()
  const calYear = today.getFullYear()
  const calMonth = today.getMonth() + 1

  const [modalOpen, setModalOpen] = useState(false)
  const [editTx, setEditTx] = useState<Transaction | null>(null)
  const [monthIncome, setMonthIncome] = useState(0)
  const [monthExpense, setMonthExpense] = useState(0)
  const [allTimeIncome, setAllTimeIncome] = useState(0)
  const [allTimeExpense, setAllTimeExpense] = useState(0)
  const [allTimeSavings, setAllTimeSavings] = useState(0)
  const [prevSavings, setPrevSavings] = useState(0)
  const [prevBalance, setPrevBalance] = useState(0)

  const loadData = useCallback(async () => {
    try {
      const { getTransactions } = await import('@/lib/api')
      const [all, txs] = await Promise.all([
        getTransactions({}),
        getTransactions({ year: calYear, month: calMonth }),
      ])

      setAllTimeIncome(all.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0))
      setAllTimeExpense(all.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0))
      setAllTimeSavings(all.filter(t => t.type === 'savings' && !t.end_date).reduce((s, t) => s + t.amount, 0))

      setMonthIncome(txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0))
      setMonthExpense(txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0))

      const prevEnd = new Date(calYear, calMonth - 1, 0)
      const prevEndStr = `${prevEnd.getFullYear()}-${String(prevEnd.getMonth() + 1).padStart(2,'0')}-${String(prevEnd.getDate()).padStart(2,'0')}`
      const prevTxs = all.filter(t => t.date <= prevEndStr)
      const pInc = prevTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
      const pExp = prevTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
      const pSav = prevTxs.filter(t => t.type === 'savings' && !t.end_date).reduce((s, t) => s + t.amount, 0)
      setPrevSavings(pSav)
      setPrevBalance(pInc - pExp - pSav)
    } catch (e) {
      console.error('대시보드 데이터 로드 실패:', e)
    }
  }, [calYear, calMonth])

  useEffect(() => { loadData() }, [loadData])

  useEffect(() => {
    const handleVisibility = () => { if (document.visibilityState === 'visible') loadData() }
    window.addEventListener('focus', loadData)
    document.addEventListener('visibilitychange', handleVisibility)
    return () => {
      window.removeEventListener('focus', loadData)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [loadData])

  const totalAssets = allTimeIncome - allTimeExpense
  const cashBalance = totalAssets - allTimeSavings

  return (
    <PullToRefresh className="min-h-dvh bg-background pb-32" onRefresh={loadData}>
      <div className="sticky top-0 z-30 bg-background px-5">
        <div className="flex items-center justify-between h-14" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
          <button
            onClick={() => router.push('/')}
            className="flex items-center justify-center w-8 h-8 rounded-lg"
            aria-label="닫기"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
            </svg>
          </button>
          <div className="w-8" />
        </div>
      </div>

      <div className="px-5">
        <h1 className="text-[28px] font-bold mt-1 mb-4">요약</h1>
        <BalanceCard
          prevBalance={prevBalance}
          thisMonthBalance={monthIncome - monthExpense}
          totalBalance={cashBalance}
          month={calMonth}
          monthIncome={monthIncome}
          monthExpense={monthExpense}
          monthSavings={prevSavings}
        />
        <MonthlySummaryCard
          year={calYear}
          month={calMonth}
          income={monthIncome}
          savings={monthExpense}
          prevSavings={prevSavings}
        />
      </div>

      <AddTransactionModal
        open={modalOpen}
        initialDate={`${calYear}-${String(calMonth).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`}
        editTransaction={editTx}
        onClose={() => { setModalOpen(false); setEditTx(null); loadData() }}
        onSave={() => {}}
      />

      {/* 리포트 임시 진입 버튼 */}
      <div className="px-5 pb-8">
        <button
          onClick={() => router.push('/report')}
          className="w-full py-3 rounded-2xl bg-surface text-muted-foreground text-[14px] font-medium"
        >
          리포트 (임시)
        </button>
      </div>

      {!modalOpen && <BottomNav onAdd={() => { setEditTx(null); setModalOpen(true) }} />}
    </PullToRefresh>
  )
}
