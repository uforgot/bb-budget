'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { PullToRefresh } from '@/components/pull-to-refresh'
import { BottomNav } from '@/components/bottom-nav'
import { AddTransactionModal } from '@/components/add-transaction-modal'
import { getTransactions, getCategories, type Transaction, type Category } from '@/lib/api'

function fmt(n: number) {
  return `₩${n.toLocaleString()}`
}

function AnalysisRow({
  label,
  total,
  months,
  maxTotal,
  color,
}: {
  label: string
  total: number
  months: { month: number; amount: number }[]
  maxTotal: number
  color: string
}) {
  const [open, setOpen] = useState(false)
  const width = maxTotal > 0 ? Math.max((total / maxTotal) * 100, total > 0 ? 8 : 0) : 0

  return (
    <div className="bg-surface rounded-[22px] px-4 py-4">
      <button type="button" onClick={() => setOpen(v => !v)} className="w-full text-left">
        <div className="mb-3 h-2 rounded-full bg-background overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{ width: `${width}%`, backgroundColor: color }} />
        </div>
        <div className="flex items-center justify-between gap-3">
          <p className="min-w-0 truncate text-[14px] font-medium text-foreground">{label}</p>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-[15px] font-semibold tracking-[-0.02em] tabular-nums text-foreground">{fmt(total)}</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`}><path d="m6 9 6 6 6-6"/></svg>
          </div>
        </div>
      </button>

      {open && (
        <div className="mt-4 border-t border-border pt-3 space-y-2">
          {months.map(({ month, amount }) => (
            <div key={month} className="flex items-center justify-between gap-3 text-[14px]">
              <span className="text-muted-foreground">{month}월</span>
              <span className="font-semibold tracking-[-0.02em] tabular-nums text-foreground">{fmt(amount)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function AnalysisPage() {
  const router = useRouter()
  const today = new Date()
  const [modalOpen, setModalOpen] = useState(false)
  const [editTx, setEditTx] = useState<Transaction | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [typeFilter, setTypeFilter] = useState<'expense' | 'income' | 'savings'>('expense')
  const [parentCategoryId, setParentCategoryId] = useState('')
  const [selectedYear, setSelectedYear] = useState(today.getFullYear())

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
    if (parentCategories.length === 0) return
    if (parentCategories.some(cat => cat.id === parentCategoryId)) return
    setParentCategoryId(parentCategories[0].id)
  }, [parentCategories, parentCategoryId])

  const childCategories = useMemo(() => categories.filter(cat => cat.parent_id === parentCategoryId), [categories, parentCategoryId])

  const availableYears = useMemo(() => {
    const years = Array.from(new Set(transactions.map(tx => new Date(tx.date).getFullYear()))).sort((a, b) => b - a)
    return years
  }, [transactions])

  useEffect(() => {
    if (availableYears.length === 0) return
    if (availableYears.includes(selectedYear)) return
    setSelectedYear(availableYears[0])
  }, [availableYears, selectedYear])

  const rows = useMemo(() => childCategories.map(category => {
    const categoryTxs = transactions.filter(tx => {
      const txYear = new Date(tx.date).getFullYear()
      const txCategory = tx.category as Category | undefined
      return txYear === selectedYear && txCategory?.id === category.id
    })

    const months = Array.from({ length: 12 }, (_, i) => {
      const month = i + 1
      const amount = categoryTxs
        .filter(tx => new Date(tx.date).getMonth() + 1 === month)
        .reduce((sum, tx) => sum + tx.amount, 0)
      return { month, amount }
    })

    const total = months.reduce((sum, item) => sum + item.amount, 0)

    return {
      id: category.id,
      label: category.name,
      total,
      months,
      type: category.type,
    }
  }).filter(row => row.total > 0).sort((a, b) => b.total - a.total), [childCategories, transactions, selectedYear])

  const maxTotal = rows[0]?.total ?? 0
  const parentCategory = categories.find(cat => cat.id === parentCategoryId)
  const accentColor = parentCategory?.type === 'income'
    ? '#5865F2'
    : parentCategory?.type === 'savings'
      ? '#A855F7'
      : '#CF6679'

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
                className="appearance-none bg-transparent text-foreground text-[28px] font-bold outline-none cursor-pointer max-w-[240px] truncate"
                style={{ letterSpacing: '-1px' }}
              >
                {parentCategories.map(category => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-foreground/60 flex-shrink-0"><path d="m6 9 6 6 6-6"/></svg>
            </label>
          </div>

          {availableYears.length > 0 && (
            <div className="overflow-x-auto scrollbar-hide -mx-1 px-1 mb-4">
              <div className="flex gap-2" style={{ width: 'max-content' }}>
                {availableYears.map(year => (
                  <button
                    key={year}
                    type="button"
                    onClick={() => setSelectedYear(year)}
                    className={`px-6 py-2 rounded-full text-[14px] font-semibold whitespace-nowrap transition-colors ${selectedYear === year ? 'bg-accent-blue text-white' : 'bg-surface text-muted-foreground opacity-70'}`}
                  >
                    {year}년
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3 pb-4">
            {rows.length === 0 ? (
              <div className="bg-surface rounded-[22px] px-4 py-8 text-center text-[14px] text-muted-foreground">
                아직 표시할 내역이 없어요
              </div>
            ) : (
              rows.map(row => (
                <AnalysisRow
                  key={row.id}
                  label={row.label}
                  total={row.total}
                  months={row.months}
                  maxTotal={maxTotal}
                  color={accentColor}
                />
              ))
            )}
          </div>
        </div>

        {!modalOpen && <BottomNav onAdd={() => { setEditTx(null); setModalOpen(true) }} />}

        <AddTransactionModal
          open={modalOpen}
          onClose={() => { setModalOpen(false); setEditTx(null) }}
          onSave={() => {
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
