'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { PullToRefresh } from '@/components/pull-to-refresh'
import { BottomNav } from '@/components/bottom-nav'
import { AddTransactionModal } from '@/components/add-transaction-modal'
import { getTransactions, getCategories, type Transaction, type Category } from '@/lib/api'

export default function AnalysisPage() {
  const router = useRouter()
  const [modalOpen, setModalOpen] = useState(false)
  const [editTx, setEditTx] = useState<Transaction | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [typeFilter, setTypeFilter] = useState<'expense' | 'income' | 'savings'>('expense')
  const [parentCategoryId, setParentCategoryId] = useState('all')

  const loadData = useCallback(async () => {
    try {
      const [cats, all] = await Promise.all([getCategories(), getTransactions({})])
      setCategories(cats)
      setTransactions(all.sort((a, b) => {
        const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime()
        return dateDiff !== 0 ? dateDiff : new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }))
    } catch {}
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const parentCategories = useMemo(() => categories.filter(cat => cat.type === typeFilter && !cat.parent_id), [categories, typeFilter])

  useEffect(() => {
    if (parentCategories.some(cat => cat.id === parentCategoryId)) return
    setParentCategoryId('all')
  }, [parentCategories, parentCategoryId])

  const filteredTransactions = useMemo(() => transactions.filter(tx => {
    if (tx.type !== typeFilter) return false
    if (parentCategoryId === 'all') return true
    const category = tx.category as Category | undefined
    if (!category) return false
    return category.id === parentCategoryId || category.parent_id === parentCategoryId
  }), [transactions, typeFilter, parentCategoryId])

  const getCategoryLabel = (tx: Transaction) => {
    const category = tx.category as Category | undefined
    if (!category) return '미분류'
    if (!category.parent_id) return category.name
    const parent = categories.find(cat => cat.id === category.parent_id)
    return parent ? `${parent.name} · ${category.name}` : category.name
  }

  const amountColor = typeFilter === 'expense'
    ? 'text-accent-coral'
    : typeFilter === 'income'
      ? 'text-accent-blue'
      : 'text-accent-purple'

  return (
    <PullToRefresh className="min-h-dvh bg-background pb-32" onRefresh={loadData} disabled>
      <>
        <div className="sticky top-0 z-30 bg-background px-5">
          <div className="flex items-center justify-between h-14" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
            <div className="w-8" />
            <div className="flex items-center gap-1">
              <button onClick={() => router.push('/settings')} className="flex items-center justify-center w-8 h-8 rounded-lg text-foreground" aria-label="설정">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></svg>
              </button>
            </div>
          </div>
        </div>

        <div className="px-5">
          <div className="flex items-center gap-3 mt-1 mb-4 overflow-x-auto scrollbar-hide">
            <label className="flex items-center gap-1 cursor-pointer shrink-0">
              <select
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value as 'expense' | 'income' | 'savings')}
                className="appearance-none bg-transparent text-foreground text-[28px] font-bold outline-none cursor-pointer"
                style={{ letterSpacing: '-1px' }}
              >
                <option value="expense">지출</option>
                <option value="income">수입</option>
                <option value="savings">저축</option>
              </select>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-foreground/60 flex-shrink-0"><path d="m6 9 6 6 6-6"/></svg>
            </label>

            <label className="flex items-center gap-1 cursor-pointer min-w-0">
              <select
                value={parentCategoryId}
                onChange={e => setParentCategoryId(e.target.value)}
                className="appearance-none bg-transparent text-foreground text-[28px] font-bold outline-none cursor-pointer max-w-[220px] truncate"
                style={{ letterSpacing: '-1px' }}
              >
                <option value="all">전체</option>
                {parentCategories.map(category => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-foreground/60 flex-shrink-0"><path d="m6 9 6 6 6-6"/></svg>
            </label>
          </div>
        </div>

        <div className="px-5">
          <div className="bg-surface rounded-[22px] px-4 py-4 mb-4">
            <p className="text-[14px] font-semibold text-foreground mb-1">분석</p>
            <p className="text-[13px] text-muted-foreground">선택한 타입과 부모 카테고리 기준으로 내역이 여기에 뜨게 할 예정이에요.</p>
          </div>

          <div className="space-y-3 pb-4">
            {filteredTransactions.length === 0 ? (
              <div className="bg-surface rounded-[22px] px-4 py-8 text-center text-[14px] text-muted-foreground">
                아직 표시할 내역이 없어요
              </div>
            ) : (
              filteredTransactions.map(tx => (
                <button
                  key={tx.id}
                  type="button"
                  onClick={() => { setEditTx(tx); setModalOpen(true) }}
                  className="w-full flex items-center justify-between gap-3 rounded-[22px] bg-surface px-4 py-4 text-left"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-medium text-foreground truncate">{getCategoryLabel(tx)}</p>
                    <p className="mt-1 text-[12px] text-muted-foreground truncate">{tx.description?.trim() || tx.date}</p>
                  </div>
                  <span className={`flex-shrink-0 text-[15px] font-semibold tracking-[-0.02em] tabular-nums ${amountColor}`}>
                    ₩{tx.amount.toLocaleString()}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>

        {!modalOpen && <BottomNav onAdd={() => { setEditTx(null); setModalOpen(true) }} />}

        <AddTransactionModal
          open={modalOpen}
          onClose={() => { setModalOpen(false); setEditTx(null) }}
          onAdded={() => {
            loadData()
            setModalOpen(false)
            setEditTx(null)
          }}
          editTransaction={editTx}
        />
      </>
    </PullToRefresh>
  )
}
