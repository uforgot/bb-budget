'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { PullToRefresh } from '@/components/pull-to-refresh'
import { BottomNav } from '@/components/bottom-nav'
import { AddTransactionModal } from '@/components/add-transaction-modal'
import { getTransactions, getCategories, type Transaction, type Category } from '@/lib/api'
import { AnalysisEmptyState, AnalysisFilters, AnalysisRow, AnalysisYearPills } from '@/components/analysis-sections'
import { AnalysisLoadingSkeleton } from '@/components/page-loading-skeletons'
import { getAnalysisRows, getAvailableTransactionYears, getChildCategoriesForParent, getParentCategoriesByType } from '@/lib/analysis'

export default function AnalysisPage() {
  const router = useRouter()
  const today = new Date()
  const [modalOpen, setModalOpen] = useState(false)
  const [editTx, setEditTx] = useState<Transaction | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [initialLoading, setInitialLoading] = useState(true)
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
    finally { setInitialLoading(false) }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const parentCategories = useMemo(() => getParentCategoriesByType(categories, typeFilter), [categories, typeFilter])

  useEffect(() => {
    if (parentCategories.length === 0) return
    if (parentCategories.some(cat => cat.id === parentCategoryId)) return
    setParentCategoryId(parentCategories[0].id)
  }, [parentCategories, parentCategoryId])

  const childCategories = useMemo(() => getChildCategoriesForParent(categories, transactions, parentCategoryId), [categories, parentCategoryId, transactions])

  const availableYears = useMemo(() => getAvailableTransactionYears(transactions), [transactions])

  useEffect(() => {
    if (availableYears.length === 0) return
    if (availableYears.includes(selectedYear)) return
    setSelectedYear(availableYears[0])
  }, [availableYears, selectedYear])

  const rows = useMemo(() => getAnalysisRows(childCategories, transactions, selectedYear), [childCategories, transactions, selectedYear])

  const maxTotal = rows[0]?.total ?? 0

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
          <AnalysisFilters
            typeFilter={typeFilter}
            parentCategoryId={parentCategoryId}
            parentCategories={parentCategories}
            onChangeType={setTypeFilter}
            onChangeParent={setParentCategoryId}
          />

          <AnalysisYearPills
            years={availableYears}
            selectedYear={selectedYear}
            onSelect={setSelectedYear}
          />

          <div className="space-y-3 pb-4">
            {initialLoading ? (
              <AnalysisLoadingSkeleton />
            ) : rows.length === 0 ? (
              <AnalysisEmptyState />
            ) : (
              rows.map(row => (
                <AnalysisRow
                  key={row.id}
                  label={row.label}
                  total={row.total}
                  months={row.months}
                  maxTotal={maxTotal}
                  color={row.type === 'income' ? '#2dd4bf' : row.type === 'savings' ? '#A855F7' : '#5865F2'}
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
