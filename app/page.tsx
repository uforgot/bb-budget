'use client'

import { useState, useEffect, useCallback } from 'react'
import { PullToRefresh } from '@/components/pull-to-refresh'
import { BottomNav } from '@/components/bottom-nav'
import { BalanceCard, MonthlySummaryCard } from '@/components/balance-summary-card'
import { TopExpenseCard } from '@/components/top-expense-card'
import { TopHeader } from '@/components/top-header'
import { AddTransactionModal } from '@/components/add-transaction-modal'
import { type Transaction } from '@/lib/api'

export default function Home() {
  const today = new Date()
  const calYear = today.getFullYear()
  const calMonth = today.getMonth() + 1

  const [modalOpen, setModalOpen] = useState(false)
  const [editTx, setEditTx] = useState<Transaction | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [monthIncome, setMonthIncome] = useState(0)
  const [monthExpense, setMonthExpense] = useState(0)
  const [topExpenses, setTopExpenses] = useState<{ name: string; amount: number }[]>([])
  const [topIncomes, setTopIncomes] = useState<{ name: string; amount: number }[]>([])
  const [allTimeIncome, setAllTimeIncome] = useState(0)
  const [allTimeExpense, setAllTimeExpense] = useState(0)
  const [allTimeSavings, setAllTimeSavings] = useState(0)
  const [prevSavings, setPrevSavings] = useState(0)
  const [prevBalance, setPrevBalance] = useState(0)

  const loadData = useCallback(async () => {
    try {
      const { getTransactions, getCategories } = await import('@/lib/api')
      const [all, txs, cats] = await Promise.all([
        getTransactions({}),
        getTransactions({ year: calYear, month: calMonth }),
        getCategories(),
      ])

      // 전체 자산
      setAllTimeIncome(all.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0))
      setAllTimeExpense(all.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0))
      setAllTimeSavings(all.filter(t => t.type === 'savings' && !t.end_date).reduce((s, t) => s + t.amount, 0))

      // 이번 달
      setMonthIncome(txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0))
      setMonthExpense(txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0))

      // TOP 3 지출 카테고리 (2depth)
      const catMap = Object.fromEntries(cats.map(c => [c.id, c]))
      const byCat: Record<string, number> = {}
      for (const tx of txs.filter(t => t.type === 'expense')) {
        const name = catMap[tx.category_id]?.name || '기타'
        byCat[name] = (byCat[name] || 0) + tx.amount
      }
      setTopExpenses(Object.entries(byCat).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, amount]) => ({ name, amount })))

      // TOP 5 수입 카테고리
      const byIncomeCat: Record<string, number> = {}
      for (const tx of txs.filter(t => t.type === 'income')) {
        const name = catMap[tx.category_id]?.name || '기타'
        byIncomeCat[name] = (byIncomeCat[name] || 0) + tx.amount
      }
      setTopIncomes(Object.entries(byIncomeCat).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, amount]) => ({ name, amount })))

      // 전월 누적
      const prevEnd = new Date(calYear, calMonth - 1, 0)
      const prevEndStr = `${prevEnd.getFullYear()}-${String(prevEnd.getMonth() + 1).padStart(2,'0')}-${String(prevEnd.getDate()).padStart(2,'0')}`
      const prevTxs = all.filter(t => t.date <= prevEndStr)
      const pInc = prevTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
      const pExp = prevTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
      const pSav = prevTxs.filter(t => t.type === 'savings' && !t.end_date).reduce((s, t) => s + t.amount, 0)
      setPrevSavings(pSav)
      setPrevBalance(pInc - pExp - pSav)
    } catch (e) {
      console.error('홈 데이터 로드 실패:', e)
    }
  }, [calYear, calMonth])

  useEffect(() => {
    loadData()
    // 반복 지출 자동 확정
    ;(async () => {
      try {
        const { confirmRecurringTransactions } = await import('@/lib/api')
        await confirmRecurringTransactions(calYear, calMonth)
      } catch {}
    })()
  }, [loadData])

  useEffect(() => {
    const refresh = () => { setRefreshKey(k => k + 1); loadData() }
    const handleVisibility = () => { if (document.visibilityState === 'visible') loadData() }
    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', handleVisibility)
    return () => {
      window.removeEventListener('focus', refresh)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [loadData])

  const totalAssets = allTimeIncome - allTimeExpense
  const cashBalance = totalAssets - allTimeSavings

  return (
    <PullToRefresh className="min-h-dvh bg-background pb-32" onRefresh={loadData}>
      <div className="sticky top-0 z-30 bg-background px-5">
        <TopHeader title="홈" />
      </div>

      <div className="px-5 mt-3">
        {/* 현재 잔액 카드 */}
        <BalanceCard
          prevBalance={prevBalance}
          thisMonthBalance={monthIncome - monthExpense}
          totalBalance={cashBalance}
          month={calMonth}
        />
        {/* 이번 달 요약 카드 */}
        <MonthlySummaryCard
          year={calYear}
          month={calMonth}
          income={monthIncome}
          savings={monthExpense}
          prevSavings={prevSavings}
        />
        {/* 수입 / 지출 2열 */}
        <div className="flex gap-3 items-stretch">
          <div className="flex-1 min-w-0 flex flex-col">
            <TopExpenseCard
              year={calYear}
              month={calMonth}
              items={topIncomes}
              total={monthIncome}
              type="income"
            />
          </div>
          <div className="flex-1 min-w-0 flex flex-col">
            <TopExpenseCard
              year={calYear}
              month={calMonth}
              items={topExpenses}
              total={monthExpense}
              type="expense"
            />
          </div>
        </div>
      </div>

      <AddTransactionModal
        open={modalOpen}
        initialDate={`${calYear}-${String(calMonth).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`}
        editTransaction={editTx}
        onClose={() => {
          setModalOpen(false)
          setEditTx(null)
          loadData()
        }}
        onSave={() => {}}
      />

      {!modalOpen && <BottomNav onAdd={() => { setEditTx(null); setModalOpen(true) }} />}
    </PullToRefresh>
  )
}
