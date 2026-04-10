'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { PullToRefresh } from '@/components/pull-to-refresh'
import { BottomNav } from '@/components/bottom-nav'
import { AddTransactionModal } from '@/components/add-transaction-modal'
import { MonthlyView } from '@/components/monthly-view'
import { getTransactions, getCategories, getRecurringPreview, type Transaction, type Category } from '@/lib/api'
import { HistoryMonthSelector, HistorySearchPanel, HistoryTopBar } from '@/components/history-sections'

export default function History() {
  const router = useRouter()
  const [monthOffset, setMonthOffset] = useState(0)
  const [searchMode, setSearchMode] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Transaction[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editTx, setEditTx] = useState<Transaction | null>(null)
  const [forceCalendarView, setForceCalendarView] = useState(false)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [recurringItems, setRecurringItems] = useState<{ day: number; type: string; amount: number; category_id: string; description: string; categoryName?: string }[]>([])
  const [todayResetToken, setTodayResetToken] = useState(0)

  // 현재 연월 (select 기준)
  const now = new Date()
  const tm = now.getMonth() + 1 + monthOffset
  const currentYear = now.getFullYear() + Math.floor((tm - 1) / 12)
  const currentMonth = ((tm - 1) % 12 + 12) % 12 + 1

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

  // 미래 달 반복 지출 예정
  useEffect(() => {
    const isFuture = currentYear > now.getFullYear() || (currentYear === now.getFullYear() && currentMonth > now.getMonth() + 1)
    if (!isFuture) { setRecurringItems([]); return }
    getRecurringPreview(currentYear, currentMonth).then(setRecurringItems).catch(() => setRecurringItems([]))
  }, [currentYear, currentMonth])

  // 검색
  useEffect(() => {
    if (!searchMode || !searchQuery.trim()) { setSearchResults([]); return }
    const q = searchQuery.toLowerCase()
    setSearchResults(transactions.filter(tx => {
      const cat = tx.category as any
      const catName = cat?.name?.toLowerCase() || ''
      const parentName = cat?.parent_id ? categories.find((c: any) => c.id === cat.parent_id)?.name?.toLowerCase() || '' : ''
      return catName.includes(q) || parentName.includes(q) || (tx.description || '').toLowerCase().includes(q) || tx.amount.toString().includes(q)
    }))
  }, [searchMode, searchQuery, transactions, categories])

  const toggleCalendarView = () => {
    setForceCalendarView(v => !v)
  }

  return (
    <PullToRefresh className="min-h-dvh bg-background pb-32" onRefresh={loadData} disabled>
      <>
      <HistoryTopBar
        forceCalendarView={forceCalendarView}
        onToggleCalendarView={toggleCalendarView}
        onToggleSearch={() => { setSearchMode(v => !v); setSearchQuery('') }}
        onOpenSettings={() => router.push('/settings')}
      />

      <HistoryMonthSelector
        currentYear={currentYear}
        currentMonth={currentMonth}
        years={Array.from({ length: 20 }, (_, i) => now.getFullYear() - 5 + i)}
        months={Array.from({ length: 12 }, (_, i) => i + 1)}
        onChangeYear={(year) => setMonthOffset((year - now.getFullYear()) * 12 + (currentMonth - (now.getMonth() + 1)))}
        onChangeMonth={(month) => setMonthOffset((currentYear - now.getFullYear()) * 12 + (month - (now.getMonth() + 1)))}
        onResetToday={() => {
          setMonthOffset(0)
          setForceCalendarView(false)
          setTodayResetToken(v => v + 1)
        }}
      />

      {/* 검색 */}
      {searchMode && (
        <HistorySearchPanel
          searchQuery={searchQuery}
          searchResults={searchResults}
          categories={categories}
          onChangeQuery={setSearchQuery}
          onClearQuery={() => setSearchQuery('')}
          onClose={() => { setSearchMode(false); setSearchQuery('') }}
          onSelectTransaction={(tx) => { setEditTx(tx); setModalOpen(true) }}
        />
      )}

      {/* 월간 뷰 */}
      {!searchMode && (
        <MonthlyView
          monthOffset={monthOffset}
          transactions={transactions}
          categories={categories}
          recurringItems={recurringItems}
          forceCalendarView={forceCalendarView}
          todayResetToken={todayResetToken}
          onEdit={tx => { setEditTx(tx); setModalOpen(true) }}
          onDeleted={loadData}
        />
      )}

      <AddTransactionModal
        open={modalOpen}
        editTransaction={editTx}
        onClose={() => {
          const scrollY = window.scrollY
          setModalOpen(false)
          setEditTx(null)
          loadData().then(() => requestAnimationFrame(() => window.scrollTo(0, scrollY)))
        }}
        onSave={() => {}}
      />

      {!modalOpen && <BottomNav onAdd={() => { setEditTx(null); setModalOpen(true) }} />}
      </>
    </PullToRefresh>
  )
}
