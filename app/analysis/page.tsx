'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { PullToRefresh } from '@/components/pull-to-refresh'
import { BottomNav } from '@/components/bottom-nav'
import { TopToolbar } from '@/components/top-toolbar'
import { AddTransactionModal } from '@/components/add-transaction-modal'
import { getTransactions, getCategories, type Transaction, type Category } from '@/lib/api'
import { AnalysisEmptyState, AnalysisFilters, AnalysisRow, AnalysisYearPills } from '@/components/analysis-sections'
import { HistorySearchPanel } from '@/components/history-sections'
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
  const [searchMode, setSearchMode] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

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

  const searchResults = searchQuery.trim()
    ? transactions.filter(t => {
        const cat = t.category as Category | undefined
        const q = searchQuery.toLowerCase()
        return (cat?.name || '').toLowerCase().includes(q) ||
          (t.description || '').toLowerCase().includes(q) ||
          t.amount.toString().includes(q)
      })
    : []

  return (
    <PullToRefresh className="min-h-dvh bg-background pb-32" onRefresh={loadData} disabled>
      <>
        <TopToolbar
          onSearch={() => { setSearchMode(v => !v); setSearchQuery('') }}
          onSettings={() => router.push('/settings')}
        />

        {searchMode ? (
          <HistorySearchPanel
            searchQuery={searchQuery}
            searchResults={searchResults}
            categories={categories}
            onChangeQuery={setSearchQuery}
            onClearQuery={() => setSearchQuery('')}
            onClose={() => { setSearchMode(false); setSearchQuery('') }}
            onSelectTransaction={(tx) => { setEditTx(tx); setModalOpen(true) }}
          />
        ) : (
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
        )}

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
