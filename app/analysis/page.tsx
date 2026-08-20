'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { PullToRefresh } from '@/components/pull-to-refresh'
import { BottomNav } from '@/components/bottom-nav'
import { TopToolbar } from '@/components/top-toolbar'
import { AddTransactionModal } from '@/components/add-transaction-modal'
import { getTransactions, getCategories, type Transaction, type Category } from '@/lib/api'
import { AnalysisEmptyState, AnalysisFilters, AnalysisMonthlyGroupCard } from '@/components/analysis-sections'
import { AnalysisDetailSheet } from '@/components/analysis-detail-sheet'
import { HistorySearchPanel } from '@/components/history-sections'
import { AnalysisLoadingSkeleton } from '@/components/page-loading-skeletons'
import { getMonthlyGroupedRows, getParentCategoriesByType } from '@/lib/analysis'

export default function AnalysisPage() {
  const router = useRouter()
  const today = new Date()
  const [modalOpen, setModalOpen] = useState(false)
  const [editTx, setEditTx] = useState<Transaction | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [initialLoading, setInitialLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState<'expense' | 'income' | 'savings'>('expense')
  const [detailParent, setDetailParent] = useState<Category | null>(null)
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
  const currentYear = today.getFullYear()
  const currentMonth = today.getMonth() + 1

  const monthlyGroups = useMemo(() => (
    getMonthlyGroupedRows(parentCategories, categories, transactions, currentYear, currentMonth)
  ), [parentCategories, categories, transactions, currentYear, currentMonth])

  const monthlyTotalSum = monthlyGroups.reduce((sum, group) => sum + group.total, 0)

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
              month={currentMonth}
              typeFilter={typeFilter}
              onChangeType={(value) => { setTypeFilter(value); setDetailParent(null) }}
            />

            <div className="space-y-3 pb-4">
              {initialLoading ? (
                <AnalysisLoadingSkeleton />
              ) : monthlyGroups.length === 0 ? (
                <AnalysisEmptyState />
              ) : (
                monthlyGroups.map(group => (
                  <AnalysisMonthlyGroupCard
                    key={group.parent.id}
                    label={group.parent.name}
                    total={group.total}
                    rows={group.rows.map(row => ({ id: row.id, label: row.label, total: row.total }))}
                    maxTotal={monthlyTotalSum}
                    color={typeFilter === 'income' ? '#2dd4bf' : typeFilter === 'savings' ? '#A855F7' : '#5865F2'}
                    onClick={() => setDetailParent(group.parent)}
                  />
                ))
              )}
            </div>
          </div>
        )}

        {!modalOpen && !detailParent && <BottomNav onAdd={() => { setEditTx(null); setModalOpen(true) }} />}

        <AnalysisDetailSheet
          key={detailParent?.id ?? 'closed'}
          open={detailParent !== null}
          parent={detailParent}
          categories={categories}
          transactions={transactions}
          initialYear={currentYear}
          initialMonth={currentMonth}
          onClose={() => setDetailParent(null)}
          onSelectTransaction={(transaction) => {
            setDetailParent(null)
            setEditTx(transaction)
            setModalOpen(true)
          }}
        />

        <AddTransactionModal
          open={modalOpen}
          onClose={() => {
            loadData()
            setModalOpen(false)
            setEditTx(null)
          }}
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
