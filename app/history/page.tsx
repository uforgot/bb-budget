'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { PullToRefresh } from '@/components/pull-to-refresh'
import { BottomNav } from '@/components/bottom-nav'

import { AddTransactionModal } from '@/components/add-transaction-modal'
import { getTransactions, deleteTransaction, getCategories, getRecurringPreview, type Transaction, type Category } from '@/lib/api'
import { SwipeToDelete } from '@/components/swipe-to-delete'


type TabType = '지출' | '수입' | '저축'
type ViewMode = 'weekly' | 'monthly' | 'yearly'

const TAB_DB_MAP: Record<TabType, string> = { '지출': 'expense', '수입': 'income', '저축': 'savings' }
const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토']

// 월요일 시작 기준 주차 계산
function getWeekNum(year: number, month: number, day: number): number {
  const firstDay = new Date(year, month - 1, 1)
  const firstMonday = (firstDay.getDay() + 6) % 7 // 월=0
  return Math.ceil((day + firstMonday) / 7)
}
function getWeekNumFromDate(dateStr: string): number {
  const d = new Date(dateStr)
  return getWeekNum(d.getFullYear(), d.getMonth() + 1, d.getDate())
}

function getWeekday(dateStr: string) {
  return DAY_NAMES[new Date(dateStr).getDay()]
}

function getWeekLabel(dateStr: string) {
  const d = new Date(dateStr)
  const weekNum = getWeekNum(d.getFullYear(), d.getMonth() + 1, d.getDate())
  return `${d.getMonth() + 1}월 ${weekNum}주 차`
}

function getMonthLabel(dateStr: string) {
  const d = new Date(dateStr)
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월`
}

function groupTransactions(items: Transaction[], mode: ViewMode): Record<string, Transaction[]> {
  const groups: Record<string, Transaction[]> = {}
  for (const item of items) {
    let key: string
    if (mode === 'weekly') {
      key = getWeekLabel(item.date)
    } else if (mode === 'monthly') {
      key = getMonthLabel(item.date)
    } else {
      key = `${new Date(item.date).getFullYear()}년`
    }
    if (!groups[key]) groups[key] = []
    groups[key].push(item)
  }
  return groups
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

function getCatDisplay(tx: Transaction) {
  const cat = tx.category as any
  if (!cat) return ''
  // parent가 있으면 2depth
  if (cat.parent_id) {
    return cat.name
  }
  return cat.name
}

function getFullCatDisplay(tx: Transaction) {
  const cat = tx.category as any
  if (!cat) return ''
  return cat.name
}

export default function History() {
  const [viewMode, setViewMode] = useState<ViewMode>('monthly')
  const [activeFilters, setActiveFilters] = useState<Set<TabType>>(new Set(['지출', '수입', '저축']))
  const [weekOffset, setWeekOffset] = useState(0)
  const [monthOffset, setMonthOffset] = useState(0)
  const [yearOffset, setYearOffset] = useState(0)
  const [cameFromMonthly, setCameFromMonthly] = useState(false)
  const [cameFromYearly, setCameFromYearly] = useState(false)
  const [searchMode, setSearchMode] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Transaction[]>([])
  const [expandedWeeks, setExpandedWeeks] = useState<Set<number>>(new Set())
  const [autoExpanded, setAutoExpanded] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editTx, setEditTx] = useState<Transaction | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [recurringItems, setRecurringItems] = useState<{ day: number; type: string; amount: number; category_id: string; description: string; categoryName?: string }[]>([])

  const loadData = useCallback(async () => {
    try {
      const [cats, ...results] = await Promise.all([
        getCategories(),
        ...Array.from(activeFilters).map(t => getTransactions({ type: TAB_DB_MAP[t] })),
      ])
      setCategories(cats)
      setTransactions(results.flat().sort((a, b) => {
        const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime()
        if (dateDiff !== 0) return dateDiff
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }))
    } catch (e) {
      console.error('내역 로드 실패:', e)
    }
  }, [activeFilters])

  useEffect(() => {
    loadData()
  }, [loadData])

  // 미래 달 반복 지출 예정 로드
  useEffect(() => {
    if (viewMode !== 'monthly') { setRecurringItems([]); return }
    const now = new Date()
    const targetMonth = now.getMonth() + 1 + monthOffset
    const targetYear = now.getFullYear() + Math.floor((targetMonth - 1) / 12)
    const actualMonth = ((targetMonth - 1) % 12 + 12) % 12 + 1
    const isFuture = targetYear > now.getFullYear() || (targetYear === now.getFullYear() && actualMonth > now.getMonth() + 1)
    if (!isFuture) { setRecurringItems([]); return }
    getRecurringPreview(targetYear, actualMonth).then(setRecurringItems).catch(() => setRecurringItems([]))
  }, [viewMode, monthOffset])

  // 검색 필터
  useEffect(() => {
    if (!searchMode || !searchQuery.trim()) {
      setSearchResults([])
      return
    }
    const q = searchQuery.toLowerCase()
    const results = transactions.filter(tx => {
      const cat = tx.category as any
      const catName = cat?.name?.toLowerCase() || ''
      const parentName = cat?.parent_id ? categories.find((c: any) => c.id === cat.parent_id)?.name?.toLowerCase() || '' : ''
      const desc = (tx.description || '').toLowerCase()
      const amount = tx.amount.toString()
      const isUncategorized = !cat || !catName
      return catName.includes(q) || parentName.includes(q) || desc.includes(q) || amount.includes(q) || (isUncategorized && '미분류'.includes(q))
    })
    setSearchResults(results)
  }, [searchMode, searchQuery, transactions, categories])

  // 주간 뷰: offset 기반 주 필터
  const getWeekRange = (offset: number) => {
    const now = new Date()
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay() + offset * 7)
    startOfWeek.setHours(0, 0, 0, 0)
    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 7)
    return { start: startOfWeek, end: endOfWeek }
  }

  const filteredTransactions = viewMode === 'weekly' ? (() => {
    const { start, end } = getWeekRange(weekOffset)
    return transactions.filter(t => {
      const d = new Date(t.date)
      return d >= start && d < end
    })
  })() : transactions

  const grouped = groupTransactions(filteredTransactions, viewMode)

  const tabColors: Record<TabType, { active: string; border: string; text: string }> = {
    '지출': { active: 'text-accent-coral', border: 'border-accent-coral', text: 'text-accent-coral' },
    '수입': { active: 'text-accent-blue', border: 'border-accent-blue', text: 'text-accent-blue' },
    '저축': { active: 'text-accent-mint', border: 'border-accent-mint', text: 'text-accent-mint' },
  }

  const lastRenderedDate = useRef<string | null>(null)

  const renderRow = (tx: Transaction, isFirstInGroup: boolean = false) => {
    const cat = tx.category as any
    const catName = cat?.name || ''
    const desc = tx.description || ''

    const d = new Date(tx.date)
    const dateKey = tx.date
    const showDate = lastRenderedDate.current !== dateKey
    if (showDate) lastRenderedDate.current = dateKey

    const weekday = getWeekday(tx.date)
    const dayNum = `${d.getDate()}일`

    return (
      <SwipeToDelete
        onDelete={async () => {
          await deleteTransaction(tx.id)
          loadData()
        }}
      >
        <div
          onClick={() => { setEditTx(tx); setModalOpen(true) }}
          className="px-5 py-2 cursor-pointer active:bg-muted/30"
        >
          <div className="flex items-center gap-3">
            <div className="w-14 flex-shrink-0">
              {showDate ? (
                <div className="flex items-baseline gap-1.5">
                  <span className="text-sm font-medium">{weekday}</span>
                  <span className="text-xs text-muted-foreground tabular-nums">{dayNum}</span>
                </div>
              ) : null}
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-xs bg-muted px-3 py-1 rounded-full inline-block">
                {!cat ? <span className="text-muted-foreground">미분류</span> : cat.parent_id ? (() => {
                  const parent = categories.find((c: any) => c.id === cat.parent_id)
                  return parent ? <><span className="text-foreground">{parent.name}</span><span className="text-muted-foreground"> · {catName}</span></> : <span className="text-foreground">{catName}</span>
                })() : <span className="text-foreground">{catName}</span>}
              </span>
            </div>
            <span className={`text-sm font-semibold tabular-nums flex-shrink-0 ${
              tx.type === 'expense' ? 'text-accent-coral' : tx.type === 'income' ? 'text-accent-blue' : 'text-accent-mint'
            }`}>
              ₩{tx.amount.toLocaleString()}
            </span>
          </div>
          {desc && <p className="text-[10px] text-muted-foreground truncate mt-1 pl-[68px]">{desc}</p>}
        </div>
      </SwipeToDelete>
    )
  }

  return (
    <PullToRefresh className="min-h-dvh bg-background pb-32" onRefresh={async () => { await loadData() }}>
      {/* 상단 바 */}
      <div className="sticky top-0 z-30 bg-background px-5">
        <div className="flex items-center justify-between h-14" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
          <button
            onClick={() => { setSearchMode(!searchMode); setSearchQuery('') }}
            className={`flex items-center justify-center w-8 h-8 rounded-lg ${searchMode ? 'text-foreground' : 'text-muted-foreground'}`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
            </svg>
          </button>
          <div className="w-8" />
        </div>
      </div>

      <div className="px-5">
        {/* 큰 타이틀 + 좌우 꺽쇠 (월간 고정) */}
        {(() => {
          const now = new Date()
          const tm = now.getMonth() + 1 + monthOffset
          const ty = now.getFullYear() + Math.floor((tm - 1) / 12)
          const am = ((tm - 1) % 12 + 12) % 12 + 1
          return (
            <div className="flex items-center justify-between mt-1 mb-4">
              <button onClick={() => { setMonthOffset(m => m - 1); setExpandedWeeks(new Set()); setAutoExpanded(false) }} className="w-8 h-8 flex items-center justify-center text-muted-foreground">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
              </button>
              <h1 className="text-[28px] font-bold">{ty}년 {am}월</h1>
              <button onClick={() => { setMonthOffset(m => m + 1); setExpandedWeeks(new Set()); setAutoExpanded(false) }} className="w-8 h-8 flex items-center justify-center text-muted-foreground">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
              </button>
            </div>
          )
        })()}



        {/* 검색 모드 */}
        {searchMode && (
          <div className="py-3">
            <div className="flex items-center gap-2 bg-surface rounded-[18px] px-5 py-4">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground flex-shrink-0">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
              </svg>
              <input
                type="text"
                placeholder="검색어 입력..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="flex-1 bg-transparent outline-none text-sm"
                style={{ fontSize: '16px' }}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-muted-foreground">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6 6 18" /><path d="m6 6 12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* 검색 결과 */}
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
                  <div
                    key={tx.id}
                    onClick={() => { setEditTx(tx); setModalOpen(true) }}
                    className="flex items-center justify-between px-2 py-2.5 cursor-pointer active:bg-muted/30 rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-muted px-2.5 py-0.5 rounded-full">
                          {parentCat ? <><span className="text-foreground">{parentCat.name}</span><span className="text-muted-foreground"> · {catName}</span></> : <span className="text-foreground">{catName || '미분류'}</span>}
                        </span>
                        {tx.description && <span className="text-[10px] text-muted-foreground truncate">{tx.description}</span>}
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5 pl-0.5">{d.getFullYear()}년 {d.getMonth() + 1}월 {d.getDate()}일</p>
                    </div>
                    <span className={`text-sm font-semibold tabular-nums flex-shrink-0 ml-3 ${
                      tx.type === 'expense' ? 'text-accent-coral' : tx.type === 'income' ? 'text-accent-blue' : 'text-accent-mint'
                    }`}>
                      ₩{tx.amount.toLocaleString()}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* 뷰별 상단 버튼 */}
        {!searchMode && <div className="h-[10px]" />}

        {/* 월간 내역 */}
        {searchMode ? null : (() => {
          // 월간 뷰: offset 기반
          const now = new Date()
          const targetMonth = now.getMonth() + 1 + monthOffset
          const targetYear = now.getFullYear() + Math.floor((targetMonth - 1) / 12)
          const actualMonth = ((targetMonth - 1) % 12 + 12) % 12 + 1

          const today = new Date()
          const isFutureMonth = targetYear > today.getFullYear() || (targetYear === today.getFullYear() && actualMonth > today.getMonth() + 1)

          // 해당 월 트랜잭션
          const monthTxs = transactions.filter(t => {
            const d = new Date(t.date)
            return d.getFullYear() === targetYear && d.getMonth() + 1 === actualMonth
          })
          let monthIncome = monthTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
          let monthExpense = monthTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
          // 미래 달이면 반복 지출 예정 합산
          if (isFutureMonth) {
            monthExpense += recurringItems.filter(r => r.type === 'expense').reduce((s, r) => s + r.amount, 0)
            monthIncome += recurringItems.filter(r => r.type === 'income').reduce((s, r) => s + r.amount, 0)
          }

          // 주차별 요약 (최신 주차 먼저)
          const daysInMonth = new Date(targetYear, actualMonth, 0).getDate()

          // 저축: 해당 월 말까지 기록된 전체 활성 저축 누적
          const monthEndDate = `${targetYear}-${String(actualMonth).padStart(2,'0')}-${String(daysInMonth).padStart(2,'0')}`
          const savingsTxs = transactions.filter(t => t.type === 'savings')
          const monthSavings = savingsTxs.filter(t => t.date <= monthEndDate).reduce((s, t) => s + t.amount, 0)
          const totalWeeks = getWeekNum(targetYear, actualMonth, daysInMonth)
          const currentWeekNum = (targetYear === today.getFullYear() && actualMonth === today.getMonth() + 1)
            ? getWeekNum(today.getFullYear(), today.getMonth() + 1, today.getDate())
            : isFutureMonth
              ? totalWeeks  // 미래 월도 반복 지출 예정 표시를 위해 전체 주차 보여줌
              : totalWeeks  // 과거 월은 전부 표시

          // 최신 주차 기본 펼침 (최초 1회만)
          if (!autoExpanded && expandedWeeks.size === 0 && currentWeekNum > 0) {
            setExpandedWeeks(new Set([currentWeekNum]))
            setAutoExpanded(true)
          }

          const weekSummaries = Array.from({ length: totalWeeks }, (_, i) => {
            const weekNum = i + 1
            const weekTxs = monthTxs.filter(t => getWeekNumFromDate(t.date) === weekNum)
            let weekTotal = weekTxs.reduce((sum, t) => {
              if (t.type === 'income') return sum + t.amount
              if (t.type === 'expense') return sum - t.amount
              return sum
            }, 0)
            // 미래 달이면 반복 지출 예정 금액 합산
            if (isFutureMonth) {
              const weekRecurring = recurringItems.filter(r => getWeekNum(targetYear, actualMonth, r.day) === weekNum)
              weekTotal += weekRecurring.reduce((s, r) => s + r.amount, 0)
            }
            const hasRecurring = isFutureMonth && recurringItems.some(r => getWeekNum(targetYear, actualMonth, r.day) === weekNum)
            return { weekNum, weekTotal, hasRecurring }
          }).filter(w => w.weekNum <= currentWeekNum && (w.weekTotal !== 0 || w.hasRecurring)).reverse()

          return (
            <div className="flex flex-col mt-2">


              {/* 이번 달 수입/지출/저축/잔액 */}
              {(() => {
                // 저축: 해당 월 말까지 누적 (1월에 넣은 것도 2,3월에 표시)
                const monthSavingsAmt = transactions.filter(t => t.type === 'savings' && t.date <= monthEndDate && (!t.end_date || t.end_date > monthEndDate)).reduce((s, t) => s + t.amount, 0)
                // 잔액 = 누적수입 - 누적지출 - 누적저축 (해당 월 말까지)
                const cumIncome = transactions.filter(t => t.type === 'income' && t.date <= monthEndDate).reduce((s, t) => s + t.amount, 0)
                const cumExpense = transactions.filter(t => t.type === 'expense' && t.date <= monthEndDate).reduce((s, t) => s + t.amount, 0)
                const cumSavings = transactions.filter(t => t.type === 'savings' && t.date <= monthEndDate && (!t.end_date || t.end_date > monthEndDate)).reduce((s, t) => s + t.amount, 0)
                const monthBalance = cumIncome - cumExpense - cumSavings
                return (
                  <div className="mb-4">
                    <div className="flex items-center justify-between px-5 py-2">
                      <span className="text-xs font-semibold dark:font-normal bg-accent-blue/20 text-accent-blue px-3 py-1 rounded-full">{actualMonth}월 수입</span>
                      <span className="text-sm font-semibold tabular-nums text-accent-blue">₩{monthIncome.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between px-5 py-2">
                      <span className="text-xs font-semibold dark:font-normal bg-accent-coral/20 text-accent-coral px-3 py-1 rounded-full">{actualMonth}월 지출</span>
                      <span className="text-sm font-semibold tabular-nums text-accent-coral">₩{monthExpense.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between px-5 py-2">
                      <span className="text-xs font-semibold dark:font-normal bg-accent-mint/20 text-accent-mint px-3 py-1 rounded-full">{actualMonth}월 저축</span>
                      <span className="text-sm font-semibold tabular-nums text-accent-mint">₩{monthSavingsAmt.toLocaleString()}</span>
                    </div>
                    <div className="border-t border-border mx-5 my-1" />
                    <div className="flex items-center justify-between px-5 py-2">
                      <span className="text-xs font-semibold dark:font-normal bg-muted text-foreground px-3 py-1 rounded-full">잔액</span>
                      <span className={`text-sm font-bold tabular-nums ${monthBalance >= 0 ? 'text-foreground' : 'text-accent-coral'}`}>₩{monthBalance.toLocaleString()}</span>
                    </div>
                  </div>
                )
              })()}

              {/* 주차별 아코디언 */}
              {weekSummaries.length === 0 && !isFutureMonth && (
                <p className="text-sm text-muted-foreground text-center py-8">아직 내역이 없어요</p>
              )}
              {weekSummaries.length === 0 && isFutureMonth && recurringItems.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">예정된 반복 지출이 없어요</p>
              )}
              {weekSummaries.map(({ weekNum, weekTotal }) => {
                const isExpanded = expandedWeeks.has(weekNum)
                const weekTxs = monthTxs.filter(t => getWeekNumFromDate(t.date) === weekNum)
                  .sort((a, b) => {
                    const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime()
                    if (dateDiff !== 0) return dateDiff
                    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                  })
                const weekNonSavingsTxs = weekTxs

                return (
                <div key={weekNum}>
                  {/* 주차 헤더 */}
                  <div
                    onClick={() => {
                      const next = new Set(expandedWeeks)
                      if (next.has(weekNum)) next.delete(weekNum)
                      else next.add(weekNum)
                      setExpandedWeeks(next)
                    }}
                    className="flex items-center justify-between px-5 py-4 cursor-pointer active:bg-muted/30 bg-surface rounded-[18px] mb-3"
                  >
                    <span className="text-sm font-semibold">{actualMonth}월 {weekNum}주 차</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-semibold tabular-nums ${weekTotal >= 0 ? 'text-accent-blue' : 'text-accent-coral'}`}>₩{Math.abs(weekTotal).toLocaleString()}</span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`}><path d="m6 9 6 6 6-6" /></svg>
                    </div>
                  </div>

                  {/* 펼친 내역 */}
                  {isExpanded && (
                    <div className="pb-2">
                      {/* 해당 주차의 반복 지출 예정 항목 */}
                      {(() => {
                        const weekRecurring = isFutureMonth ? recurringItems.filter(r => getWeekNum(targetYear, actualMonth, r.day) === weekNum) : []
                        return weekRecurring.map((r, ri) => {
                          const d = new Date(targetYear, actualMonth - 1, r.day)
                          return (
                            <div key={`recurring-${ri}`} className="opacity-40 italic border-dashed border-b border-border">
                              <div className="px-5 py-2">
                                <div className="flex items-center gap-3">
                                  <div className="w-14 flex-shrink-0">
                                    <div className="flex items-baseline gap-1.5">
                                      <span className="text-sm font-medium">{DAY_NAMES[d.getDay()]}</span>
                                      <span className="text-sm text-muted-foreground tabular-nums">{r.day}일</span>
                                    </div>
                                  </div>
                                  <div className="flex-1 min-w-0 flex items-center gap-2">
                                    <span className="text-xs bg-muted px-3 py-1 rounded-full inline-block">
                                      <span className="text-foreground">{r.categoryName || '미분류'}</span>
                                    </span>
                                    <span className="text-[9px] bg-accent-coral/20 text-accent-coral px-1.5 py-0.5 rounded">예정</span>
                                  </div>
                                  <span className={`text-sm font-semibold tabular-nums flex-shrink-0 ${
                                    r.type === 'expense' ? 'text-accent-coral' : r.type === 'income' ? 'text-accent-blue' : 'text-accent-mint'
                                  }`}>
                                    ₩{r.amount.toLocaleString()}
                                  </span>
                                </div>
                                {r.description && <p className="text-[10px] text-muted-foreground truncate mt-1 pl-[68px]">{r.description}</p>}
                              </div>
                            </div>
                          )
                        })
                      })()}
                      {/* 일별 내역 */}
                      {weekNonSavingsTxs.length === 0 && !(isFutureMonth && recurringItems.some(r => getWeekNum(targetYear, actualMonth, r.day) === weekNum)) ? (
                        <p className="text-sm text-muted-foreground text-center py-4">내역이 없어요</p>
                      ) : (() => {
                        let lastDate: string | null = null
                        return weekNonSavingsTxs.map((tx) => {
                          const showDivider = lastDate !== null && lastDate !== tx.date
                          const showDate = lastDate !== tx.date
                          lastDate = tx.date
                          const d = new Date(tx.date)
                          const cat = tx.category as any
                          const catName = cat?.name || ''
                          return (
                            <div key={tx.id}>
                              {showDivider && <div className="border-t border-border mx-5 my-1" />}
                              <SwipeToDelete onDelete={async () => { await deleteTransaction(tx.id); loadData() }}>
                                <div onClick={() => { setEditTx(tx); setModalOpen(true) }} className={`px-5 py-2 cursor-pointer active:bg-muted/30 ${tx.end_date ? 'opacity-40' : ''}`}>
                                  <div className="flex items-center gap-3">
                                    <div className="w-14 flex-shrink-0">
                                      {showDate && (
                                        <div className="flex items-baseline gap-1.5">
                                          <span className="text-sm font-medium">{DAY_NAMES[d.getDay()]}</span>
                                          <span className="text-sm text-muted-foreground tabular-nums">{d.getDate()}일</span>
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <span className={`text-xs bg-muted px-3 py-1 rounded-full inline-block ${tx.end_date ? 'line-through' : ''}`}>
                                        {!cat ? <span className="text-muted-foreground">미분류</span> : cat.parent_id ? (() => {
                                          const parent = categories.find((c: any) => c.id === cat.parent_id)
                                          return parent ? <><span className="text-foreground">{parent.name}</span><span className="text-muted-foreground"> · {catName}</span></> : <span className="text-foreground">{catName}</span>
                                        })() : <span className="text-foreground">{catName}</span>}
                                      </span>
                                    </div>
                                    <span className={`text-sm font-semibold tabular-nums flex-shrink-0 ${tx.end_date ? 'line-through ' : ''}${
                                      tx.type === 'expense' ? 'text-accent-coral' : tx.type === 'income' ? 'text-accent-blue' : 'text-accent-mint'
                                    }`}>
                                      ₩{tx.amount.toLocaleString()}
                                    </span>
                                  </div>
                                  {tx.description && <p className={`text-[10px] text-muted-foreground truncate mt-1 pl-[68px] ${tx.end_date ? 'line-through' : ''}`}>{tx.description}</p>}
                                </div>
                              </SwipeToDelete>
                            </div>
                          )
                        })
                      })()}
                    </div>
                  )}
                </div>
                )
              })}
            </div>
          )
        })()}
        {false && (() => {
          // 연간 뷰: 월별 카드 그리드
          const now = new Date()
          const targetYear = now.getFullYear() + yearOffset
          const yearLabel = `${targetYear}년`

          // 해당 연도 트랜잭션
          const yearTxs = transactions.filter(t => new Date(t.date).getFullYear() === targetYear)
          const yearTotal = yearTxs.reduce((sum, t) => t.type === 'expense' ? sum - t.amount : sum + t.amount, 0)

          // 월별 요약
          const monthSummaries = Array.from({ length: 12 }, (_, i) => {
            const month = i + 1
            const mTxs = yearTxs.filter(t => new Date(t.date).getMonth() + 1 === month)
            const income = mTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
            const expense = mTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
            // 저축: 해당 월 말까지 누적
            const mEnd = `${targetYear}-${String(month).padStart(2,'0')}-${String(new Date(targetYear, month, 0).getDate()).padStart(2,'0')}`
            const savings = transactions.filter(t => t.type === 'savings' && t.date <= mEnd && (!t.end_date || t.end_date > mEnd)).reduce((s, t) => s + t.amount, 0)
            // 잔액: 해당 월 말까지 누적
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

          return (
            <div className="flex flex-col mt-2">


              {/* 연간 수입/지출 */}
              <div className="mb-4">
                <div className="flex items-center justify-between px-5 py-2">
                  <span className="text-xs font-semibold dark:font-normal bg-accent-blue/20 text-accent-blue px-3 py-1 rounded-full">{targetYear}년 수입</span>
                  <span className="text-sm font-semibold tabular-nums text-accent-blue">₩{yearIncome.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between px-5 py-2">
                  <span className="text-xs font-semibold dark:font-normal bg-accent-coral/20 text-accent-coral px-3 py-1 rounded-full">{targetYear}년 지출</span>
                  <span className="text-sm font-semibold tabular-nums text-accent-coral">₩{yearExpense.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between px-5 py-2">
                  <span className="text-xs font-semibold dark:font-normal bg-accent-mint/20 text-accent-mint px-3 py-1 rounded-full">{targetYear}년 저축</span>
                  <span className="text-sm font-semibold tabular-nums text-accent-mint">₩{yearSavings.toLocaleString()}</span>
                </div>
                <div className="border-t border-border mx-5 my-1" />
                <div className="flex items-center justify-between px-5 py-2">
                  <span className="text-xs font-semibold dark:font-normal bg-muted text-foreground px-3 py-1 rounded-full">{targetYear}년 잔액</span>
                  <span className={`text-sm font-bold tabular-nums ${yearBalance >= 0 ? 'text-foreground' : 'text-accent-coral'}`}>₩{yearBalance.toLocaleString()}</span>
                </div>
              </div>

              {/* 월별 카드 */}
              <div className="flex flex-col gap-4">
                {activeMonths.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">아직 내역이 없어요</p>
                )}
                {activeMonths.map(({ month, income, expense, savings, balance }) => (
                  <div
                    key={month}
                    onClick={() => {
                      const now2 = new Date()
                      const diff = (targetYear - now2.getFullYear()) * 12 + (month - (now2.getMonth() + 1))
                      setMonthOffset(diff)
                      setExpandedWeeks(new Set())
                      setAutoExpanded(false)
                      setViewMode('monthly')
                    }}
                    className="bg-surface rounded-[18px] px-5 py-4 cursor-pointer active:bg-muted/30"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-base font-semibold">{targetYear}년 {month}월</span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground flex-shrink-0"><path d="m9 18 6-6-6-6" /></svg>
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
            </div>
          )
        })()}
      </div>

      <AddTransactionModal
        open={modalOpen}
        editTransaction={editTx}
        onClose={() => {
          const scrollY = window.scrollY
          setModalOpen(false)
          setEditTx(null)
          loadData().then(() => {
            requestAnimationFrame(() => window.scrollTo(0, scrollY))
          })
        }}
        onSave={() => {}}
      />

      {!modalOpen && <BottomNav onAdd={() => { setEditTx(null); setModalOpen(true) }} />}
    </PullToRefresh>
  )
}
