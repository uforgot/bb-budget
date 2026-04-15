'use client'

import { useState, useEffect, useCallback } from 'react'
import { ChevronDown, Search, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { PullToRefresh } from '@/components/pull-to-refresh'
import { BottomNav } from '@/components/bottom-nav'
import { TopToolbar } from '@/components/top-toolbar'
import { AddTransactionModal } from '@/components/add-transaction-modal'
import { getTransactions, type Transaction, type Category } from '@/lib/api'
import { SummaryCardSlider } from '@/components/summary-card-slider'
import { MonthlyBarChart } from '@/components/monthly-bar-chart'

export default function Yearly() {
  const router = useRouter()
  const today = new Date()
  const [yearOffset, setYearOffset] = useState(0)
  const [modalOpen, setModalOpen] = useState(false)
  const [editTx, setEditTx] = useState<Transaction | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [searchMode, setSearchMode] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [yearlyChartMode, setYearlyChartMode] = useState<'expense' | 'income' | 'savings'>('expense')

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

  // 평균 계산: 말일이 지난 월까지만 (= 현재월 미포함)
  const completedMonths = (() => {
    const now = new Date()
    return monthSummaries.filter(m => {
      if (targetYear < now.getFullYear()) return true
      if (targetYear > now.getFullYear()) return false
      return m.month < now.getMonth() + 1
    })
  })()
  const avgExpense = completedMonths.length > 0
    ? Math.round(completedMonths.reduce((s, m) => s + m.expense, 0) / completedMonths.length)
    : 0
  const avgIncome = completedMonths.length > 0
    ? Math.round(completedMonths.reduce((s, m) => s + m.income, 0) / completedMonths.length)
    : 0
  const avgSavings = completedMonths.length > 0
    ? Math.round(completedMonths.reduce((s, m) => s + m.savings, 0) / completedMonths.length)
    : 0
  const startSavings = monthSummaries[0]?.savings || 0

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
    <PullToRefresh className="min-h-dvh bg-background pb-32" onRefresh={loadData}>
      <>
      <TopToolbar
        onSearch={() => { setSearchMode(v => !v); setSearchQuery('') }}
        onSettings={() => router.push('/settings')}
      />

      {/* 타이틀 */}
      <div className="px-5">
        <div className="flex items-center justify-between mt-1 mb-4">
          <label className="flex items-center gap-1 cursor-pointer">
            <select
              value={targetYear}
              onChange={e => setYearOffset(Number(e.target.value) - today.getFullYear())}
              className="appearance-none bg-transparent text-foreground text-[28px] font-bold outline-none cursor-pointer"
              style={{ letterSpacing: '-1px' }}
            >
              {Array.from({ length: 20 }, (_, i) => today.getFullYear() - 5 + i).map(y => (
                <option key={y} value={y}>{y}년</option>
              ))}
            </select>
            <ChevronDown size={16} strokeWidth={2.5} className="text-foreground/60 flex-shrink-0" />
          </label>
          <button onClick={() => setYearOffset(0)} className="px-4 py-2 rounded-full bg-accent-blue text-white text-[14px] font-semibold">오늘</button>
        </div>
      </div>

      {/* 콘텐츠 */}
      <div className="px-5">
        {/* 검색 */}
        {searchMode && (
          <div className="mb-4">
            <div className="flex items-center gap-2">
              <div className="flex flex-1 items-center gap-2 bg-surface rounded-[22px] px-4 py-4">
                <Search size={16} strokeWidth={2} className="text-muted-foreground flex-shrink-0" />
                <input
                  type="text" placeholder="검색어 입력..." value={searchQuery} autoFocus
                  onChange={e => setSearchQuery(e.target.value)}
                  className="flex-1 min-w-0 bg-transparent outline-none text-sm" style={{ fontSize: '16px' }}
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="text-muted-foreground flex-shrink-0" aria-label="검색어 지우기">
                    <X size={16} strokeWidth={2} />
                  </button>
                )}
              </div>
              <button
                onClick={() => { setSearchMode(false); setSearchQuery('') }}
                className="flex items-center justify-center w-10 h-10 rounded-full text-muted-foreground flex-shrink-0"
                aria-label="검색 닫기"
              >
                <X size={18} strokeWidth={2} />
              </button>
            </div>
            <div className="mt-3">
              {searchQuery && searchResults.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">검색 결과가 없어요</p>
              )}
              {searchResults.map(tx => {
                const cat = tx.category as Category | undefined
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
                    <span className={`text-sm font-semibold tabular-nums ml-3 ${tx.type === 'expense' ? 'text-accent-coral' : tx.type === 'income' ? 'text-accent-blue' : 'text-accent-purple'}`}>
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
            {/* 연간 요약 카드 슬라이더 — 자체 px-5 시작점 맞추기 위해 wrapper 밖으로 */}
          </>
        )}
      </div>
      {!searchMode && (
        <>
          <SummaryCardSlider
            month={targetYear}
            income={yearIncome}
            expense={yearExpense}
            savings={yearSavings}
            balance={yearBalance}
            prevMonth={targetYear - 1}
            prevIncome={0}
            prevExpense={0}
            prevSavings={0}
            prevBalance={0}
            hasPrev={false}
            yearMode
          />
          <div className="px-5 mt-5">
            <div className="mb-0">
              <div className="flex gap-0 overflow-visible">
                {([
                  ['expense', '지출'],
                  ['income', '수입'],
                  ['savings', '저축'],
                ] as const).map(([key, label], index, array) => {
                  const active = yearlyChartMode === key
                  const isFirst = index === 0
                  const isLast = index === array.length - 1
                  const activeFill = 'var(--surface)'
                  const inactiveFill = 'rgb(39 39 42)'
                  return (
                    <button
                      key={key}
                      onClick={() => setYearlyChartMode(key)}
                      className={`relative flex-1 h-10 rounded-t-[22px] rounded-b-none text-[13px] font-semibold transition-colors ${active ? 'z-20 bg-surface text-foreground' : 'z-10 text-muted-foreground'}`}
                      style={active ? undefined : { backgroundColor: 'rgb(39 39 42)' }}
                    >
                      {active ? null : null}
                      {!isFirst ? (
                        <span className="pointer-events-none absolute -left-[20px] bottom-0 h-[24px] w-[24px] overflow-hidden">
                          <svg viewBox="0 0 24 24" className="h-full w-full" aria-hidden="true">
                            <path
                              d="M24 0V24H0C13.5 24 24 13.5 24 0Z"
                              fill={active ? activeFill : inactiveFill}
                            />
                          </svg>
                        </span>
                      ) : null}
                      {!isLast ? (
                        <span className="pointer-events-none absolute -right-[20px] bottom-0 h-[24px] w-[24px] overflow-hidden">
                          <svg viewBox="0 0 24 24" className="h-full w-full" aria-hidden="true">
                            <path
                              d="M0 0V24H24C10.5 24 0 13.5 0 0Z"
                              fill={active ? activeFill : inactiveFill}
                            />
                          </svg>
                        </span>
                      ) : null}
                      <span className="relative z-10">{label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
            <MonthlyBarChart
              flatTop
              className="mb-4 mt-0"
              label={yearlyChartMode === 'expense' ? '쓴 지출' : yearlyChartMode === 'income' ? '번 수입' : '모은 저축'}
              color={yearlyChartMode === 'expense' ? '#5865F2' : yearlyChartMode === 'income' ? '#14b8a6' : '#A855F7'}
              avgValue={yearlyChartMode === 'expense' ? avgExpense : yearlyChartMode === 'income' ? avgIncome : avgSavings}
              comparisonText={yearlyChartMode === 'savings' ? ((selectedValue) => {
                const diff = selectedValue - startSavings
                const toMan = (v: number) => `${Math.round(v / 10000).toLocaleString()}만 원`
                if (diff === 0) return `연초 ${toMan(startSavings)} 대비 동일`
                return `연초 ${toMan(startSavings)} 대비 ${diff > 0 ? '↑' : '↓'}${toMan(Math.abs(diff))}`
              }) : undefined}
              maxHeight={148}
              data={Array.from({ length: 12 }, (_, i) => {
                const m = i + 1
                const ms = monthSummaries[i]
                const isFuture = targetYear > today.getFullYear() ||
                  (targetYear === today.getFullYear() && m > today.getMonth() + 1)
                return {
                  month: m,
                  value: yearlyChartMode === 'expense' ? ms.expense : yearlyChartMode === 'income' ? ms.income : ms.savings,
                  isFuture,
                }
              })}
            />
          </div>
        </>
      )}

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
