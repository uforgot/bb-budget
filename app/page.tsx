'use client'

import { useState, useEffect, useCallback } from 'react'
import { PullToRefresh } from '@/components/pull-to-refresh'
import { BottomNav } from '@/components/bottom-nav'
import { MonthlyCalendar } from '@/components/monthly-calendar'
import { BalanceCard, MonthlySummaryCard } from '@/components/balance-summary-card'
import { TopExpenseCard } from '@/components/top-expense-card'
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
  const [monthSavings, setMonthSavings] = useState(0)
  const [topExpenses, setTopExpenses] = useState<{ name: string; amount: number }[]>([])

  const [allTimeIncome, setAllTimeIncome] = useState(0)
  const [allTimeExpense, setAllTimeExpense] = useState(0)
  const [allTimeSavings, setAllTimeSavings] = useState(0)
  const [prevSavings, setPrevSavings] = useState(0)  // 전월까지 누적 저축
  const [prevBalance, setPrevBalance] = useState(0)  // 전월까지 잔고

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
    <PullToRefresh className="min-h-dvh bg-background pb-32" onRefresh={async () => { setRefreshKey(k => k + 1); await loadAllTime() }}>

      <div className="sticky top-0 z-30 bg-background px-5">
        <TopHeader title="홈" />
      </div>

      <div className="px-5">

        <div className="mt-3">
          <BalanceCard
            prevBalance={prevBalance}
            thisMonthBalance={monthIncome - monthExpense}
            totalBalance={cashBalance}
            month={calMonth}
          />
          <div className="flex gap-3 items-stretch">
            <div className="flex-1 min-w-0 flex flex-col">
              <MonthlySummaryCard
                year={calYear}
                month={calMonth}
                income={monthIncome}
                savings={monthExpense}
                prevSavings={prevSavings}
              />
            </div>
            <div className="flex-1 min-w-0 flex flex-col">
              <TopExpenseCard
                year={calYear}
                month={calMonth}
                items={topExpenses}
                total={monthExpense}
              />
            </div>
          </div>
        </div>

        <MonthlyCalendar
          onMonthChange={async (y, m, inc, exp) => {
          setCalYear(y); setCalMonth(m); setMonthIncome(inc); setMonthExpense(exp)
          try {
            const { getTransactions } = await import('@/lib/api')
            // 이번 달 데이터
            const txs = await getTransactions({ year: y, month: m })
            setMonthSavings(txs.filter(t => t.type === 'savings').reduce((s, t) => s + t.amount, 0))
            // 카테고리별 지출 TOP 4
            const { getCategories } = await import('@/lib/api')
            const cats = await getCategories()
            const catMap = Object.fromEntries(cats.map(c => [c.id, c]))
            const byCat: Record<string, number> = {}
            for (const tx of txs.filter(t => t.type === 'expense')) {
              const cat = catMap[tx.category_id]
              // 2depth: 자식이면 자식 이름, 1depth만 있으면 그 이름
              const name = cat?.name || '기타'
              byCat[name] = (byCat[name] || 0) + tx.amount
            }
            const sorted = Object.entries(byCat).sort((a, b) => b[1] - a[1]).slice(0, 3)
            setTopExpenses(sorted.map(([name, amount]) => ({ name, amount })))
            // 전월까지 누적 계산
            const all = await getTransactions({})
            const prevEnd = new Date(y, m - 1, 0) // 전달 마지막 날
            const prevEndStr = `${prevEnd.getFullYear()}-${String(prevEnd.getMonth() + 1).padStart(2,'0')}-${String(prevEnd.getDate()).padStart(2,'0')}`
            const prevTxs = all.filter(t => t.date <= prevEndStr)
            const pInc = prevTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
            const pExp = prevTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
            const pSav = prevTxs.filter(t => t.type === 'savings' && !t.end_date).reduce((s, t) => s + t.amount, 0)
            setPrevSavings(pSav)
            setPrevBalance(pInc - pExp - pSav) // 저축 제외한 순수 현금 잔고
          } catch {}
        }}
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
