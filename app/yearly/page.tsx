'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
// router already imported
import { PullToRefresh } from '@/components/pull-to-refresh'
import { BottomNav } from '@/components/bottom-nav'
import { AddTransactionModal } from '@/components/add-transaction-modal'
import { getTransactions, getCategories, type Transaction } from '@/lib/api'
import { DatePickerModal } from '@/components/date-picker-modal'

export default function Yearly() {
  const router = useRouter()
  const today = new Date()
  const [yearOffset, setYearOffset] = useState(0)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editTx, setEditTx] = useState<Transaction | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [searchMode, setSearchMode] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const loadData = useCallback(async () => {
    try {
      const all = await getTransactions({})
      setTransactions(all.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()))
    } catch {}
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const targetYear = today.getFullYear() + yearOffset
  const yearTxs = transactions.filter(t => new Date(t.date).getFullYear() === targetYear)

  const monthSummaries = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1
    const mTxs = yearTxs.filter(t => new Date(t.date).getMonth() + 1 === month)
    const income = mTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
    const expense = mTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
    const mEnd = `${targetYear}-${String(month).padStart(2,'0')}-${String(new Date(targetYear, month, 0).getDate()).padStart(2,'0')}`
    const savings = transactions.filter(t => t.type === 'savings' && t.date <= mEnd && (!t.end_date || t.end_date > mEnd)).reduce((s, t) => s + t.amount, 0)
    const cumInc = transactions.filter(t => t.type === 'income' && t.date <= mEnd).reduce((s, t) => s + t.amount, 0)
    const cumExp = transactions.filter(t => t.type === 'expense' && t.date <= mEnd).reduce((s, t) => s + t.amount, 0)
    const balance = cumInc - cumExp - savings
    return { month, income, expense, savings, balance, hasData: mTxs.length > 0 }
  })

  const yearIncome = yearTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const yearExpense = yearTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const yearSavings = yearTxs.filter(t => t.type === 'savings').reduce((s, t) => s + t.amount, 0)
  const yearBalance = yearIncome - yearExpense - yearSavings
  const activeMonths = monthSummaries.filter(m => m.hasData).reverse()

  const searchResults = searchQuery.trim()
    ? transactions.filter(t => {
        const cat = t.category as any
        const q = searchQuery.toLowerCase()
        return (cat?.name || '').toLowerCase().includes(q) ||
          (t.description || '').toLowerCase().includes(q) ||
          t.amount.toString().includes(q)
      })
    : []

  return (
    <PullToRefresh className="min-h-dvh bg-background pb-32" onRefresh={loadData}>
      <>
      {/* 상단 바 */}
      <div className="sticky top-0 z-30 bg-background px-5">
        <div className="flex items-center justify-between h-14" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
          <button onClick={() => router.push('/dashboard')} className="flex items-center justify-center w-8 h-8 rounded-lg" aria-label="대시보드">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>
          </button>
          <div className="flex items-center gap-1">
            <button onClick={() => { setSearchMode(v => !v); setSearchQuery('') }} className={`flex items-center justify-center w-8 h-8 rounded-lg ${searchMode ? 'text-foreground' : 'text-muted-foreground'}`} aria-label="검색">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
            </button>
            <button onClick={() => router.push('/settings')} className="flex items-center justify-center w-8 h-8 rounded-lg text-muted-foreground" aria-label="설정">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></svg>
            </button>
          </div>
        </div>
      </div>

      <div className="px-5">
        {/* 큰 타이틀 */}
        <div className="flex items-center justify-between mt-1 mb-4">
          <label className="flex items-center gap-1 cursor-pointer">
            <select value={targetYear} onChange={e => setYearOffset(Number(e.target.value)-today.getFullYear())} className="appearance-none bg-transparent text-foreground text-[28px] font-bold outline-none cursor-pointer" style={{ letterSpacing: '-2px' }}>
              {Array.from({length:20},(_,i)=>today.getFullYear()-5+i).map(y=><option key={y} value={y}>{y}년</option>)}
            </select>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-foreground/60 flex-shrink-0"><path d="m6 9 6 6 6-6"/></svg>
          </label>
          <button onClick={() => setYearOffset(0)} className="px-4 py-2 rounded-full bg-accent-blue text-white text-[14px] font-semibold">금년</button>
        </div>
      </div>

      <div className="px-5">
        {/* 검색 */}
        {searchMode && (
          <div className="mb-4">
            <div className="flex items-center gap-2 bg-surface rounded-2xl px-5 py-4">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground flex-shrink-0">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
              </svg>
              <input
                type="text" placeholder="검색어 입력..." value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)} autoFocus
                className="flex-1 bg-transparent outline-none text-sm" style={{ fontSize: '16px' }}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-muted-foreground">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                </button>
              )}
            </div>
            <div className="mt-3">
              {searchQuery && searchResults.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">검색 결과가 없어요</p>}
              {searchResults.map(tx => {
                const cat = tx.category as any
                const catName = cat?.name || ''
                const d = new Date(tx.date)
                return (
                  <div key={tx.id} onClick={() => { setEditTx(tx); setModalOpen(true) }}
                    className="flex items-center justify-between px-2 py-2.5 cursor-pointer active:bg-muted/30 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-muted px-2.5 py-0.5 rounded-full text-foreground">{catName || '미분류'}</span>
                        {tx.description && <span className="text-[10px] text-muted-foreground truncate">{tx.description}</span>}
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{d.getFullYear()}년 {d.getMonth()+1}월 {d.getDate()}일</p>
                    </div>
                    <span className={`text-sm font-semibold tabular-nums ml-3 ${tx.type === 'expense' ? 'text-accent-coral' : tx.type === 'income' ? 'text-accent-blue' : 'text-accent-mint'}`}>
                      ₩{tx.amount.toLocaleString()}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {!searchMode && (
          <>
            {/* 연간 요약 카드 */}
            <div className="bg-surface rounded-2xl px-5 py-4 mb-4">
              <div className="flex items-center justify-between py-1.5">
                <span className="text-[13px] text-muted-foreground">수입</span>
                <span className="text-[14px] font-semibold tabular-nums text-accent-blue">₩{yearIncome.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-[13px] text-muted-foreground">지출</span>
                <span className="text-[14px] font-semibold tabular-nums text-accent-coral">₩{yearExpense.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-[13px] text-muted-foreground">저축</span>
                <span className="text-[14px] font-semibold tabular-nums text-accent-mint">₩{yearSavings.toLocaleString()}</span>
              </div>
              <div className="border-t border-border mt-2 mb-1" />
              <div className="flex items-center justify-between py-1.5">
                <span className="text-[13px] text-muted-foreground">잔액</span>
                <span className={`text-[14px] font-bold tabular-nums ${yearBalance >= 0 ? 'text-foreground' : 'text-accent-coral'}`}>₩{yearBalance.toLocaleString()}</span>
              </div>
            </div>

            {/* 월별 카드 */}
            <div className="flex flex-col gap-3">
              {activeMonths.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">아직 내역이 없어요</p>}
              {activeMonths.map(({ month, income, expense, savings, balance }) => (
                <div key={month}
                  onClick={() => router.push(`/history?month=${month}&year=${targetYear}`)}
                  className="bg-surface rounded-2xl px-5 py-4 cursor-pointer active:bg-muted/30"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[16px] font-semibold">{targetYear}년 {month}월</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><path d="m9 18 6-6-6-6" /></svg>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">수입</span>
                      <span className="text-sm font-semibold tabular-nums text-accent-blue">₩{income.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">지출</span>
                      <span className="text-sm font-semibold tabular-nums text-accent-coral">₩{expense.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">저축</span>
                      <span className="text-sm font-semibold tabular-nums text-accent-mint">₩{savings.toLocaleString()}</span>
                    </div>
                    <div className="border-t border-border my-1" />
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">잔액</span>
                      <span className={`text-sm font-semibold tabular-nums ${balance >= 0 ? 'text-foreground' : 'text-accent-coral'}`}>₩{balance.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <DatePickerModal
        open={pickerOpen}
        mode="year"
        year={targetYear}
        onClose={() => setPickerOpen(false)}
        onSelect={(y) => { setYearOffset(y - today.getFullYear()) }}
      />

      <AddTransactionModal
        open={modalOpen}
        editTransaction={editTx}
        onClose={() => { setModalOpen(false); setEditTx(null); loadData() }}
        onSave={() => {}}
      />
      {!modalOpen && <BottomNav onAdd={() => { setEditTx(null); setModalOpen(true) }} />}
      </>
    </PullToRefresh>
  )
}
