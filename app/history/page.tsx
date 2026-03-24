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
  const [viewMode, setViewMode] = useState<ViewMode>('weekly')
  const [activeFilters, setActiveFilters] = useState<Set<TabType>>(new Set(['지출', '수입', '저축']))
  const [weekOffset, setWeekOffset] = useState(0)
  const [monthOffset, setMonthOffset] = useState(0)
  const [cameFromMonthly, setCameFromMonthly] = useState(false)
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
          className="flex items-center gap-3 px-5 py-2 cursor-pointer active:bg-muted/30"
        >
          {/* 날짜/요일 — 같은 날은 빈칸 */}
          <div className="w-14 flex-shrink-0">
            {showDate ? (
              <div className="flex items-baseline gap-1.5">
                <span className="text-sm font-medium">{weekday}</span>
                <span className="text-xs text-muted-foreground tabular-nums">{dayNum}</span>
              </div>
            ) : null}
          </div>

          {/* 카테고리 + 메모 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs bg-muted px-3 py-1.5 rounded-full">
                {!cat ? <span className="text-muted-foreground">미분류</span> : cat.parent_id ? (() => {
                  const parent = categories.find((c: any) => c.id === cat.parent_id)
                  return parent ? <><span className="text-foreground">{parent.name}</span><span className="text-muted-foreground"> · {catName}</span></> : <span className="text-foreground">{catName}</span>
                })() : <span className="text-foreground">{catName}</span>}
              </span>
              {desc && <span className="text-[10px] text-muted-foreground truncate">{desc}</span>}
            </div>
          </div>

          {/* 금액 */}
          <span className={`text-sm font-semibold tabular-nums flex-shrink-0 ${
            tx.type === 'expense' ? 'text-accent-coral' : tx.type === 'income' ? 'text-accent-blue' : 'text-accent-mint'
          }`}>
            ₩{tx.amount.toLocaleString()}
          </span>
        </div>
      </SwipeToDelete>
    )
  }

  return (
    <div className="min-h-dvh bg-background pb-32">
      <div className="px-5">
        <TopHeader title="상세 내역" />

        {/* View mode tabs: 주간 / 월간 / 연간 */}
        <div className="flex border-b border-border">
          {(['weekly', 'monthly', 'yearly'] as ViewMode[]).map((mode) => {
            const label = mode === 'weekly' ? '주간' : mode === 'monthly' ? '월간' : '연간'
            return (
              <button
                key={mode}
                onClick={() => { setViewMode(mode); setWeekOffset(0); setMonthOffset(0); setCameFromMonthly(false) }}
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

        {/* Filter chips: 지출 / 수입 / 저축 */}
        <div className="flex items-center justify-end gap-2 py-3">
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
                  if (next.has(tab)) {
                    if (next.size > 1) next.delete(tab) // 최소 1개 유지
                  } else {
                    next.add(tab)
                  }
                  setActiveFilters(next)
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${chipColors[tab]}`}
              >
                {tab}
              </button>
            )
          })}
        </div>

        {/* Grouped list */}
        {viewMode === 'weekly' ? (() => {
          const { start } = getWeekRange(weekOffset)
          const weekMonth = start.getMonth() + 1
          const weekNum = Math.ceil(start.getDate() / 7)
          const weekLabel = `${weekMonth}월 ${weekNum}주 차`
          const weekTotal = filteredTransactions.reduce((sum, t) => t.type === 'expense' ? sum - t.amount : sum + t.amount, 0)

          return (
            <div className="flex flex-col gap-3">
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
              {cameFromMonthly && (
                <button
                  onClick={() => {
                    setViewMode('monthly')
                    setCameFromMonthly(false)
                  }}
                  className="text-xs text-accent-blue flex items-center gap-1 px-5 py-1"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                  월간 전체 보기
                </button>
              )}
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
          const monthLabel = `${targetYear}년 ${actualMonth}월`

          // 해당 월 트랜잭션
          const monthTxs = transactions.filter(t => {
            const d = new Date(t.date)
            return d.getFullYear() === targetYear && d.getMonth() + 1 === actualMonth
          })
          const monthTotal = monthTxs.reduce((sum, t) => t.type === 'expense' ? sum - t.amount : sum + t.amount, 0)

          // 주차별 요약
          const daysInMonth = new Date(targetYear, actualMonth, 0).getDate()
          const totalWeeks = Math.ceil(daysInMonth / 7)
          const weekSummaries = Array.from({ length: totalWeeks }, (_, i) => {
            const weekNum = i + 1
            const weekTxs = monthTxs.filter(t => Math.ceil(new Date(t.date).getDate() / 7) === weekNum)
            const income = weekTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
            const expense = weekTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
            const savings = weekTxs.filter(t => t.type === 'savings').reduce((s, t) => s + t.amount, 0)
            return { weekNum, income, expense, savings }
          })

          return (
            <div className="flex flex-col gap-3">
              {/* 헤더 */}
              <div className="flex items-center px-2 py-4 bg-surface rounded-[18px]">
                <button onClick={() => setMonthOffset(m => m - 1)} className="text-muted-foreground p-1 flex-shrink-0">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                </button>
                <div className="flex-1 flex items-center justify-between px-2">
                  <span className="text-sm font-semibold text-foreground">{monthLabel}</span>
                  <span className="text-sm font-medium tabular-nums text-foreground">
                    {monthTotal < 0 ? "-" : ""}₩{Math.abs(monthTotal).toLocaleString()}
                  </span>
                </div>
                <button onClick={() => setMonthOffset(m => m + 1)} className="text-muted-foreground p-1 flex-shrink-0">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
                </button>
              </div>

              {/* 주차별 요약 */}
              {weekSummaries.map(({ weekNum, income, expense, savings }) => (
                <div
                  key={weekNum}
                  onClick={() => {
                    // 해당 주의 월요일 기준으로 weekOffset 계산
                    const targetDate = new Date(targetYear, actualMonth - 1, (weekNum - 1) * 7 + 1)
                    const now = new Date()
                    const nowStart = new Date(now)
                    nowStart.setDate(now.getDate() - now.getDay())
                    nowStart.setHours(0, 0, 0, 0)
                    const targetStart = new Date(targetDate)
                    targetStart.setDate(targetDate.getDate() - targetDate.getDay())
                    targetStart.setHours(0, 0, 0, 0)
                    const diffWeeks = Math.round((targetStart.getTime() - nowStart.getTime()) / (7 * 24 * 60 * 60 * 1000))
                    setWeekOffset(diffWeeks)
                    setCameFromMonthly(true)
                    setViewMode('weekly')
                  }}
                  className="bg-surface rounded-[18px] px-5 py-4 cursor-pointer active:bg-muted/30"
                >
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold text-foreground">{actualMonth}월 {weekNum}주 차</p>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><path d="m9 18 6-6-6-6" /></svg>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">수입</p>
                      <p className="text-sm font-medium tabular-nums text-accent-blue">₩{income.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">지출</p>
                      <p className="text-sm font-medium tabular-nums text-accent-coral">₩{expense.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">저축</p>
                      <p className="text-sm font-medium tabular-nums text-accent-mint">₩{savings.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        })() : Object.keys(grouped).length === 0 ? (
          <p className="text-sm text-muted-foreground text-center mt-20">내역이 없어요</p>
        ) : (
          <div className="flex flex-col gap-3">
            {Object.entries(grouped).map(([label, items]) => {
              const groupTotal = items.reduce((sum, t) => {
                if (t.type === 'expense') return sum - t.amount
                return sum + t.amount
              }, 0)

              // 연간 뷰: 그룹 내에서 월별 서브그룹
              if (viewMode === 'yearly') {
                const byMonth: Record<string, Transaction[]> = {}
                for (const item of items) {
                  const mk = `${new Date(item.date).getMonth() + 1}월`
                  if (!byMonth[mk]) byMonth[mk] = []
                  byMonth[mk].push(item)
                }

                return (
                  <div key={label} className="">
                    <div className="flex items-center justify-between px-5 py-4 bg-surface rounded-[18px]">
                      <span className="text-sm font-semibold text-foreground">{label}</span>
                      <span className={`text-sm font-medium tabular-nums ${'text-foreground'}`}>
                        {groupTotal < 0 ? "-" : ""}₩{Math.abs(groupTotal).toLocaleString()}
                      </span>
                    </div>
                    {Object.entries(byMonth).map(([mk, mItems]) => {
                      const mTotal = mItems.reduce((s, t) => t.type === "expense" ? s - t.amount : s + t.amount, 0)
                      return (
                        <div key={mk}>
                          <div className="flex items-center justify-between px-5 py-2">
                            <span className="text-[10px] text-muted-foreground">{mk}</span>
                            <span className={`text-[10px] tabular-nums ${'text-foreground'}`}>
                              {mTotal < 0 ? "-" : ""}₩{Math.abs(mTotal).toLocaleString()}
                            </span>
                          </div>
                          {mItems.map((tx, i) => { if (i === 0) lastRenderedDate.current = null; return renderRow(tx) })}
                        </div>
                      )
                    })}
                  </div>
                )
              }

              // 주간은 위에서 처리됨
              return null
            })}
          </div>
        )}
      </div>

      <AddTransactionModal
        open={modalOpen}
        editTransaction={editTx}
        onClose={() => {
          setModalOpen(false)
          setEditTx(null)
          loadData()
        }}
        onSave={() => {}}
      />

      <BottomNav onAdd={() => { setEditTx(null); setModalOpen(true) }} hideAdd={modalOpen} />
    </div>
  )
}
