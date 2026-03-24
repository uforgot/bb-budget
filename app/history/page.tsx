'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { BottomNav } from '@/components/bottom-nav'
import { TopHeader } from '@/components/top-header'
import { AddTransactionModal } from '@/components/add-transaction-modal'
import { getTransactions, deleteTransaction, getCategories, type Transaction, type Category } from '@/lib/api'
import { SwipeToDelete } from '@/components/swipe-to-delete'

type TabType = '지출' | '수입' | '저축'
type ViewMode = 'weekly' | 'monthly' | 'yearly'

const TAB_DB_MAP: Record<TabType, string> = { '지출': 'expense', '수입': 'income', '저축': 'savings' }
const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토']

function getWeekday(dateStr: string) {
  return DAY_NAMES[new Date(dateStr).getDay()]
}

function getWeekLabel(dateStr: string) {
  const d = new Date(dateStr)
  const weekNum = Math.ceil(d.getDate() / 7)
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
  const [expandedWeeks, setExpandedWeeks] = useState<Set<number>>(new Set())
  const [modalOpen, setModalOpen] = useState(false)
  const [editTx, setEditTx] = useState<Transaction | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<Category[]>([])

  const loadData = useCallback(async () => {
    try {
      const [cats, ...results] = await Promise.all([
        getCategories(),
        ...Array.from(activeFilters).map(t => getTransactions({ type: TAB_DB_MAP[t] })),
      ])
      setCategories(cats)
      setTransactions(results.flat().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()))
    } catch (e) {
      console.error('내역 로드 실패:', e)
    }
  }, [activeFilters])

  useEffect(() => {
    loadData()
  }, [loadData])

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
    <div className="min-h-dvh bg-background pb-32">
      <div className="px-5">
        <TopHeader title="상세 내역" />

        {/* View mode tabs: 월간 / 연간 */}
        <div className="flex border-b border-border">
          {(['monthly', 'yearly'] as ViewMode[]).map((mode) => {
            const label = mode === 'monthly' ? '월간' : '연간'
            return (
              <button
                key={mode}
                onClick={() => { setViewMode(mode); setWeekOffset(0); setMonthOffset(0); setYearOffset(0); setCameFromMonthly(false); setCameFromYearly(false) }}
                className={`flex-1 pb-2.5 text-sm font-medium text-center transition-colors ${
                  viewMode === mode
                    ? 'text-foreground border-b-2 border-foreground'
                    : 'text-muted-foreground'
                }`}
              >
                {label}
              </button>
            )
          })}
        </div>



        {/* 뷰별 상단 버튼 */}
        {viewMode === 'weekly' && (
          <div className="flex items-center justify-between py-3">
            <button
              onClick={() => {
                // 현재 주간에서 보고 있는 주의 월로 이동
                const { start } = getWeekRange(weekOffset)
                const now2 = new Date()
                const diff = (start.getFullYear() - now2.getFullYear()) * 12 + (start.getMonth() - now2.getMonth())
                setMonthOffset(diff)
                setViewMode('monthly')
                setCameFromMonthly(false)
              }}
              className="text-xs text-accent-blue flex items-center gap-1"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
              월간 전체 보기
            </button>
            <div className="flex items-center gap-2">
              {(['수입', '지출', '저축'] as TabType[]).map((tab) => {
                const isActive = activeFilters.has(tab)
                const chipColors: Record<TabType, string> = {
                  '지출': isActive ? 'bg-accent-coral/20 text-accent-coral border-accent-coral/40' : 'bg-muted text-muted-foreground border-transparent',
                  '수입': isActive ? 'bg-accent-blue/20 text-accent-blue border-accent-blue/40' : 'bg-muted text-muted-foreground border-transparent',
                  '저축': isActive ? 'bg-accent-mint/20 text-accent-mint border-accent-mint/40' : 'bg-muted text-muted-foreground border-transparent',
                }
                return (
                  <button
                    key={tab}
                    onClick={() => {
                      const next = new Set(activeFilters)
                      if (next.has(tab)) { if (next.size > 1) next.delete(tab) } else { next.add(tab) }
                      setActiveFilters(next)
                    }}
                    className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${chipColors[tab]}`}
                  >
                    {tab}
                  </button>
                )
              })}
            </div>
          </div>
        )}
        {viewMode === 'monthly' && (
          <div className="h-[10px]" />
        )}
        {viewMode === 'yearly' && (
          <div className="h-[10px]" />
        )}

        {/* Grouped list */}
        {viewMode === 'weekly' ? (() => {
          const { start } = getWeekRange(weekOffset)
          const weekMonth = start.getMonth() + 1
          const weekNum = Math.ceil(start.getDate() / 7)
          const weekLabel = `${weekMonth}월 ${weekNum}주 차`
          const weekTotal = filteredTransactions.reduce((sum, t) => t.type === 'expense' ? sum - t.amount : sum + t.amount, 0)

          return (
            <div className="flex flex-col gap-3 mt-2">
              <div className="flex items-center px-2 py-4 bg-surface rounded-[18px]">
                <button onClick={() => setWeekOffset(w => w - 1)} className="text-muted-foreground p-1 flex-shrink-0">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                </button>
                <div className="flex-1 flex items-center justify-between px-2">
                  <span className="text-sm font-semibold text-foreground">{weekLabel}</span>
                  <span className="text-sm font-medium tabular-nums text-foreground">
                    {weekTotal < 0 ? "-" : ""}₩{Math.abs(weekTotal).toLocaleString()}
                  </span>
                </div>
                <button onClick={() => setWeekOffset(w => w + 1)} className="text-muted-foreground p-1 flex-shrink-0">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
                </button>
              </div>

              {/* 활성 저축 표시 */}
              {(() => {
                const savingsTxs = transactions.filter(t => t.type === 'savings')
                if (savingsTxs.length === 0) return null
                return (
                  <div className="mt-2">
                    <p className="text-xs text-muted-foreground px-5 mb-2">활성 저축</p>
                    {savingsTxs.map(tx => {
                      const cat = tx.category as any
                      const catName = cat?.name || '미분류'
                      return (
                        <div
                          key={tx.id}
                          onClick={() => { setEditTx(tx); setModalOpen(true) }}
                          className="flex items-center justify-between px-5 py-2 cursor-pointer active:bg-muted/30"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-xs bg-accent-mint/20 text-accent-mint px-3 py-1 rounded-full">{catName}</span>
                            {tx.description && <span className="text-[10px] text-muted-foreground">{tx.description}</span>}
                          </div>
                          <span className="text-sm font-semibold tabular-nums text-accent-mint">₩{tx.amount.toLocaleString()}</span>
                        </div>
                      )
                    })}
                    <div className="border-t border-border mx-5 my-2" />
                  </div>
                )
              })()}

              {filteredTransactions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">내역이 없어요</p>
              ) : (
                filteredTransactions.map((tx, i) => {
                  if (i === 0) lastRenderedDate.current = null
                  const prevDate = lastRenderedDate.current
                  const showDivider = i > 0 && prevDate !== tx.date
                  return (
                    <div key={tx.id}>
                      {showDivider && <div className="border-t border-border mx-5 my-1" />}
                      {renderRow(tx)}
                    </div>
                  )
                })
              )}
            </div>
          )
        })() : viewMode === 'monthly' ? (() => {
          // 월간 뷰: offset 기반
          const now = new Date()
          const targetMonth = now.getMonth() + 1 + monthOffset
          const targetYear = now.getFullYear() + Math.floor((targetMonth - 1) / 12)
          const actualMonth = ((targetMonth - 1) % 12 + 12) % 12 + 1

          // 해당 월 트랜잭션
          const monthTxs = transactions.filter(t => {
            const d = new Date(t.date)
            return d.getFullYear() === targetYear && d.getMonth() + 1 === actualMonth
          })
          const monthIncome = monthTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
          const monthExpense = monthTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)

          // 주차별 요약 (최신 주차 먼저)
          const daysInMonth = new Date(targetYear, actualMonth, 0).getDate()

          // 저축: 해당 월 말까지 기록된 전체 활성 저축 누적
          const monthEndDate = `${targetYear}-${String(actualMonth).padStart(2,'0')}-${String(daysInMonth).padStart(2,'0')}`
          const savingsTxs = transactions.filter(t => t.type === 'savings')
          const monthSavings = savingsTxs.filter(t => t.date <= monthEndDate).reduce((s, t) => s + t.amount, 0)
          const totalWeeks = Math.ceil(daysInMonth / 7)
          const today = new Date()
          const currentWeekNum = (targetYear === today.getFullYear() && actualMonth === today.getMonth() + 1)
            ? Math.ceil(today.getDate() / 7)
            : (targetYear < today.getFullYear() || (targetYear === today.getFullYear() && actualMonth < today.getMonth() + 1))
              ? totalWeeks  // 과거 월은 전부 표시
              : 0           // 미래 월은 표시 안 함

          const weekSummaries = Array.from({ length: totalWeeks }, (_, i) => {
            const weekNum = i + 1
            const weekTxs = monthTxs.filter(t => Math.ceil(new Date(t.date).getDate() / 7) === weekNum)
            const weekTotal = weekTxs.reduce((sum, t) => {
              if (t.type === 'expense') return sum + t.amount
              if (t.type === 'income') return sum + t.amount
              if (t.type === 'savings') return sum + t.amount
              return sum
            }, 0)
            return { weekNum, weekTotal }
          }).filter(w => w.weekNum <= currentWeekNum).reverse()

          return (
            <div className="flex flex-col mt-2">
              {/* 월 헤더 + 좌우 화살표 */}
              <div className="flex items-center justify-between px-5 py-3">
                <button onClick={() => { setMonthOffset(m => m - 1); setExpandedWeeks(new Set()) }} className="text-muted-foreground p-1">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                </button>
                <span className="text-lg font-bold">{targetYear}년 {actualMonth}월</span>
                <button onClick={() => { setMonthOffset(m => m + 1); setExpandedWeeks(new Set()) }} className="text-muted-foreground p-1">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
                </button>
              </div>

              {/* 이번 달 요약 */}
              {(() => {
                const cumulativeIncome = transactions.filter(t => t.type === 'income' && t.date <= monthEndDate).reduce((s, t) => s + t.amount, 0)
                const cumulativeExpense = transactions.filter(t => t.type === 'expense' && t.date <= monthEndDate).reduce((s, t) => s + t.amount, 0)
                const totalAssets = cumulativeIncome - cumulativeExpense
                const monthEnd = `${targetYear}-${String(actualMonth).padStart(2,'0')}-${String(daysInMonth).padStart(2,'0')}`
                const activeSavings = savingsTxs.filter(t => t.date <= monthEnd)
                const totalSavingsAmt = activeSavings.reduce((s, t) => s + t.amount, 0)
                const cashBalance = totalAssets - totalSavingsAmt

                return (
                  <div className="mb-2">

                    <div className="flex items-center justify-between px-5 py-2">
                      <span className="text-xs bg-accent-blue/20 text-accent-blue px-3 py-1 rounded-full">금월 수입</span>
                      <span className="text-sm font-semibold tabular-nums text-accent-blue">₩{monthIncome.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between px-5 py-2">
                      <span className="text-xs bg-accent-coral/20 text-accent-coral px-3 py-1 rounded-full">금월 지출</span>
                      <span className="text-sm font-semibold tabular-nums text-accent-coral">₩{monthExpense.toLocaleString()}</span>
                    </div>
                    <div className="border-t border-border mx-5 my-2" />
                    <div className="flex items-center justify-between px-5 py-2">
                      <span className="text-xs bg-muted text-foreground px-3 py-1 rounded-full">자산</span>
                      <span className="text-sm font-bold tabular-nums">₩{totalAssets.toLocaleString()}</span>
                    </div>
                    {/* 자산 하위: 저축 + 현금 */}
                    <div className="flex items-center justify-between px-5 py-1.5 pl-8">
                      <span className="text-xs text-accent-mint">운용 자산</span>
                      <span className="text-xs font-medium tabular-nums text-accent-mint">₩{totalSavingsAmt.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between px-5 py-1.5 pl-8">
                      <span className="text-xs text-muted-foreground">가용 현금</span>
                      <span className={`text-xs font-medium tabular-nums ${cashBalance >= 0 ? 'text-foreground' : 'text-accent-coral'}`}>₩{cashBalance.toLocaleString()}</span>
                    </div>
                    <div className="border-t border-border mx-5 my-2" />
                  </div>
                )
              })()}

              {/* 주차별 아코디언 */}
              {weekSummaries.map(({ weekNum, weekTotal }) => {
                const isExpanded = expandedWeeks.has(weekNum)
                const weekTxs = monthTxs.filter(t => Math.ceil(new Date(t.date).getDate() / 7) === weekNum)
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                const weekNonSavingsTxs = weekTxs.filter(t => t.type !== 'savings')

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
                      <span className="text-sm font-medium tabular-nums">₩{weekTotal.toLocaleString()}</span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`}><path d="m6 9 6 6 6-6" /></svg>
                    </div>
                  </div>

                  {/* 펼친 내역 */}
                  {isExpanded && (
                    <div className="pb-2">
                      {/* 일별 내역 */}
                      {weekNonSavingsTxs.length === 0 ? (
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
                                <div onClick={() => { setEditTx(tx); setModalOpen(true) }} className="px-5 py-2 cursor-pointer active:bg-muted/30">
                                  <div className="flex items-center gap-3">
                                    <div className="w-14 flex-shrink-0">
                                      {showDate && (
                                        <div className="flex items-baseline gap-1.5">
                                          <span className="text-sm font-medium">{DAY_NAMES[d.getDay()]}</span>
                                          <span className="text-xs text-muted-foreground tabular-nums">{d.getDate()}일</span>
                                        </div>
                                      )}
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
                                  {tx.description && <p className="text-[10px] text-muted-foreground truncate mt-1 pl-[68px]">{tx.description}</p>}
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
        })() : viewMode === 'yearly' ? (() => {
          // 연간 뷰: 월별 카드 그리드
          const now = new Date()
          const targetYear = now.getFullYear() + yearOffset
          const yearLabel = `${targetYear}년`

          // 해당 연도 트랜잭션
          const yearTxs = transactions.filter(t => new Date(t.date).getFullYear() === targetYear)
          const yearTotal = yearTxs.reduce((sum, t) => t.type === 'expense' ? sum - t.amount : sum + t.amount, 0)

          // 월별 요약 — 자산 변동 포함
          const monthSummaries = Array.from({ length: 12 }, (_, i) => {
            const month = i + 1
            const monthEnd = `${targetYear}-${String(month).padStart(2,'0')}-${String(new Date(targetYear, month, 0).getDate()).padStart(2,'0')}`
            // 해당 월 말까지 누적 자산
            const cumIncome = transactions.filter(t => t.type === 'income' && t.date <= monthEnd).reduce((s, t) => s + t.amount, 0)
            const cumExpense = transactions.filter(t => t.type === 'expense' && t.date <= monthEnd).reduce((s, t) => s + t.amount, 0)
            const assets = cumIncome - cumExpense
            return { month, assets }
          })

          // 변동 계산 (전월 대비)
          const withDelta = monthSummaries.map((m, i) => {
            const prevAssets = i > 0 ? monthSummaries[i - 1].assets : null
            const delta = prevAssets !== null ? m.assets - prevAssets : null
            return { ...m, delta }
          })

          // 데이터 있는 월만 (수입 또는 지출이 있는)
          const activeMonths = withDelta.filter(m => {
            const monthTxs = yearTxs.filter(t => new Date(t.date).getMonth() + 1 === m.month)
            return monthTxs.length > 0
          })

          const formatCompactAmt = (v: number) => {
            const abs = Math.abs(v)
            if (abs >= 100000000) return `${(v / 100000000).toFixed(1)}억`
            if (abs >= 10000) return `${Math.round(v / 10000).toLocaleString()}만`
            return v.toLocaleString()
          }

          return (
            <div className="flex flex-col mt-2">
              {/* 헤더 */}
              <div className="flex items-center justify-between px-5 py-3">
                <button onClick={() => setYearOffset(y => y - 1)} className="text-muted-foreground p-1">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                </button>
                <span className="text-lg font-bold">{yearLabel}</span>
                <button onClick={() => setYearOffset(y => y + 1)} className="text-muted-foreground p-1">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
                </button>
              </div>

              {/* 월별 리스트 */}
              {activeMonths.map(({ month, assets, delta }, idx) => (
                <div key={month}>
                  {idx > 0 && <div className="border-t border-border mx-5 my-1" />}
                  <div
                    onClick={() => {
                      const now2 = new Date()
                      const diff = (targetYear - now2.getFullYear()) * 12 + (month - (now2.getMonth() + 1))
                      setMonthOffset(diff)
                      setCameFromYearly(true)
                      setViewMode('monthly')
                    }}
                    className="flex items-center justify-between px-5 py-3 cursor-pointer active:bg-muted/30"
                  >
                    <span className="text-sm font-semibold w-10">{month}월</span>
                    <span className={`text-sm font-medium tabular-nums ${delta !== null ? (delta >= 0 ? 'text-accent-blue' : 'text-accent-coral') : 'text-muted-foreground'}`}>
                      {delta !== null ? `${delta >= 0 ? '+' : ''}₩${formatCompactAmt(delta)}` : '—'}
                    </span>
                    <span className="text-sm tabular-nums text-muted-foreground">₩{formatCompactAmt(assets)}</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><path d="m9 18 6-6-6-6" /></svg>
                  </div>
                </div>
              ))}
            </div>
          )
        })() : null}
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
    </div>
  )
}
