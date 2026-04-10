'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarDays, List } from 'lucide-react'
import { PullToRefresh } from '@/components/pull-to-refresh'
import { BottomNav } from '@/components/bottom-nav'
import { AddTransactionModal } from '@/components/add-transaction-modal'
import { MonthlyView } from '@/components/monthly-view'
import { getTransactions, getCategories, getRecurringPreview, type Transaction, type Category } from '@/lib/api'

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
      {/* 상단 바 */}
      <div className="sticky top-0 z-30 bg-background px-5">
        <div className="flex items-center justify-between h-14" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
          <button onClick={toggleCalendarView} className="relative flex items-center justify-center w-8 h-8" aria-label={forceCalendarView ? '내역 보기' : '달력 보기'}>
            {forceCalendarView && <span className="absolute inset-0 rounded-full bg-accent-blue" />}
            <CalendarDays size={18} className={`relative ${forceCalendarView ? 'text-white' : 'text-foreground'}`} />
          </button>
          <div className="flex items-center gap-1">
            <button onClick={() => { setSearchMode(v => !v); setSearchQuery('') }} className="flex items-center justify-center w-8 h-8 rounded-lg text-foreground">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
            </button>
            <button onClick={() => router.push('/settings')} className="flex items-center justify-center w-8 h-8 rounded-lg text-foreground">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></svg>
            </button>
          </div>
        </div>
      </div>

      {/* 타이틀 */}
      <div className="px-5">
        <div className="flex items-center justify-between mt-1 mb-4">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1 cursor-pointer">
              <select
                value={currentYear}
                onChange={e => { const y = Number(e.target.value); setMonthOffset((y - now.getFullYear()) * 12 + (currentMonth - (now.getMonth() + 1))) }}
                className="appearance-none bg-transparent text-foreground text-[28px] font-bold outline-none cursor-pointer"
                style={{ letterSpacing: '-1px' }}
              >
                {Array.from({ length: 20 }, (_, i) => now.getFullYear() - 5 + i).map(y => <option key={y} value={y}>{y}년</option>)}
              </select>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-foreground/60 flex-shrink-0"><path d="m6 9 6 6 6-6"/></svg>
            </label>
            <label className="flex items-center cursor-pointer">
              <select
                value={currentMonth}
                onChange={e => { const m = Number(e.target.value); setMonthOffset((currentYear - now.getFullYear()) * 12 + (m - (now.getMonth() + 1))) }}
                className="appearance-none bg-transparent text-foreground text-[28px] font-bold outline-none cursor-pointer"
                style={{ letterSpacing: '-1px' }}
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => <option key={m} value={m}>{m}월</option>)}
              </select>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-foreground/60 flex-shrink-0 -ml-1.5"><path d="m6 9 6 6 6-6"/></svg>
            </label>
          </div>
          <button onClick={() => {
            setMonthOffset(0)
            setForceCalendarView(false)
          }} className="px-4 py-2 rounded-full bg-accent-blue text-white text-[14px] font-semibold" aria-label="오늘">
            오늘
          </button>
        </div>
      </div>

      {/* 검색 */}
      {searchMode && (
        <div className="px-4 py-3">
          <div className="flex items-center gap-2 bg-surface rounded-[22px] px-4 py-4">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground flex-shrink-0">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="text" placeholder="검색어 입력..." value={searchQuery} autoFocus
              onChange={e => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent outline-none text-sm" style={{ fontSize: '16px' }}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-muted-foreground">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
              </button>
            )}
          </div>
          <div className="mt-3">
            {searchQuery && searchResults.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">검색 결과가 없어요</p>
            )}
            {searchResults.map(tx => {
              const cat = tx.category as any
              const catName = cat?.name || ''
              const parentCat = cat?.parent_id ? categories.find((c: any) => c.id === cat.parent_id) : null
              const d = new Date(tx.date)
              return (
                <div key={tx.id} onClick={() => { setEditTx(tx); setModalOpen(true) }}
                  className="flex items-center justify-between px-2 py-2.5 cursor-pointer active:bg-muted/30 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-muted px-2.5 py-0.5 rounded-full">
                        {parentCat ? <><span className="text-foreground">{parentCat.name}</span><span className="text-muted-foreground"> · {catName}</span></> : <span className="text-foreground">{catName || '미분류'}</span>}
                      </span>
                      {tx.description && <span className="text-[10px] text-muted-foreground truncate">{tx.description}</span>}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{d.getFullYear()}년 {d.getMonth()+1}월 {d.getDate()}일</p>
                  </div>
                  <span className={`text-sm font-semibold tabular-nums flex-shrink-0 ml-3 ${tx.type === 'expense' ? 'text-accent-coral' : tx.type === 'income' ? 'text-accent-blue' : 'text-accent-purple'}`}>
                    ₩{tx.amount.toLocaleString()}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 월간 뷰 */}
      {!searchMode && (
        <MonthlyView
          monthOffset={monthOffset}
          transactions={transactions}
          categories={categories}
          recurringItems={recurringItems}
          forceCalendarView={forceCalendarView}
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
