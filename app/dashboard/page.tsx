'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { PullToRefresh } from '@/components/pull-to-refresh'
import { BottomNav } from '@/components/bottom-nav'
import { BudgetCard } from '@/components/budget-card'
import { CategoryExpenseCard } from '@/components/category-expense-card'
import { AddTransactionModal } from '@/components/add-transaction-modal'
import { type Transaction, type Category } from '@/lib/api'

export default function Dashboard() {
  const router = useRouter()
  const today = new Date()
  const calYear = today.getFullYear()
  const calMonth = today.getMonth() + 1

  const [modalOpen, setModalOpen] = useState(false)
  const [editTx, setEditTx] = useState<Transaction | null>(null)
  const [monthIncome, setMonthIncome] = useState(0)
  const [monthExpense, setMonthExpense] = useState(0)
  const [categoryTop5, setCategoryTop5] = useState<Array<{ name: string; amount: number; prevAmount: number }>>([])
  const [budgetEditing, setBudgetEditing] = useState(false)
  const [budgetInput, setBudgetInput] = useState('')

  const loadData = useCallback(async () => {
    try {
      const { getTransactions, getCategories } = await import('@/lib/api')
      const prevMonthDate = new Date(calYear, calMonth - 2, 1)
      const prevYear = prevMonthDate.getFullYear()
      const prevMonth = prevMonthDate.getMonth() + 1

      const [txs, prevTxs, categories] = await Promise.all([
        getTransactions({ year: calYear, month: calMonth }),
        getTransactions({ year: prevYear, month: prevMonth }),
        getCategories('expense'),
      ])

      setMonthIncome(txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0))
      setMonthExpense(txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0))

      const parentMap = new Map<string, Category>()
      const categoryMap = new Map<string, Category>()
      categories.forEach(category => {
        categoryMap.set(category.id, category)
        if (!category.parent_id) parentMap.set(category.id, category)
      })

      const summarizeByParent = (list: Transaction[]) => {
        const totals = new Map<string, number>()
        list
          .filter(tx => tx.type === 'expense')
          .forEach(tx => {
            const category = tx.category ?? categoryMap.get(tx.category_id)
            if (!category) return
            const parentId = category.parent_id ?? category.id
            totals.set(parentId, (totals.get(parentId) ?? 0) + tx.amount)
          })
        return totals
      }

      const currentTotals = summarizeByParent(txs)
      const prevTotals = summarizeByParent(prevTxs)

      const top5 = Array.from(currentTotals.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([parentId, amount]) => ({
          name: parentMap.get(parentId)?.name ?? categoryMap.get(parentId)?.name ?? '미분류',
          amount,
          prevAmount: prevTotals.get(parentId) ?? 0,
        }))

      setCategoryTop5(top5)
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

  const budgetStorageKey = `${calYear}-${String(calMonth).padStart(2, '0')}`
  const monthlyBudget = typeof window !== 'undefined'
    ? Number(localStorage.getItem(`budget:${budgetStorageKey}`) || 0)
    : 0
  const daysInMonth = new Date(calYear, calMonth, 0).getDate()
  const daysLeft = Math.max(daysInMonth - today.getDate() + 1, 0)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const saved = localStorage.getItem(`budget:${budgetStorageKey}`) || ''
    setBudgetInput(saved)
  }, [budgetStorageKey])

  const handleSaveBudget = () => {
    if (typeof window === 'undefined') return
    localStorage.setItem(`budget:${budgetStorageKey}`, budgetInput || '0')
    setBudgetEditing(false)
    window.dispatchEvent(new Event('focus'))
  }

  return (
    <PullToRefresh className="min-h-dvh bg-background pb-32" onRefresh={loadData}>
      <div className="sticky top-0 z-30 bg-background px-4">
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

      <div className="px-4">
        <h1 className="text-[28px] font-bold mt-1 mb-4">요약</h1>
        <BudgetCard
          budget={monthlyBudget}
          spent={monthExpense}
          daysLeft={daysLeft}
          isEditing={budgetEditing}
          editValue={budgetInput}
          onEditChange={setBudgetInput}
          onStartEdit={() => {
            setBudgetInput(monthlyBudget > 0 ? String(monthlyBudget) : '')
            setBudgetEditing(true)
          }}
          onCancelEdit={() => {
            setBudgetInput(monthlyBudget > 0 ? String(monthlyBudget) : '')
            setBudgetEditing(false)
          }}
          onSaveEdit={handleSaveBudget}
        />
        <CategoryExpenseCard items={categoryTop5} />
      </div>

      <AddTransactionModal
        open={modalOpen}
        initialDate={`${calYear}-${String(calMonth).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`}
        editTransaction={editTx}
        onClose={() => { setModalOpen(false); setEditTx(null); loadData() }}
        onSave={() => {}}
      />


      {/* 리포트 임시 진입 버튼 */}
      <div className="px-4 pb-8">
        <button
          onClick={() => router.push('/report')}
          className="w-full py-3 rounded-[22px] bg-surface text-muted-foreground text-[14px] font-medium"
        >
          리포트 (임시)
        </button>
      </div>

      {!modalOpen && <BottomNav onAdd={() => { setEditTx(null); setModalOpen(true) }} />}
    </PullToRefresh>
  )
}
