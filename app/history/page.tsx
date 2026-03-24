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
  return `${d.getMonth() + 1}월 ${weekNum}주차`
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

  const grouped = groupTransactions(transactions, viewMode)

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
        key={tx.id}
        onDelete={async () => {
          await deleteTransaction(tx.id)
          loadData()
        }}
      >
        <div
          onClick={() => { setEditTx(tx); setModalOpen(true) }}
          className="flex items-center gap-3 px-4 py-3 border-t border-border/50 cursor-pointer active:bg-muted/50"
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
                {cat?.parent_id ? (() => {
                  const allCats = categories
                  const parent = allCats.find((c: any) => c.id === cat.parent_id)
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
                onClick={() => setViewMode(mode)}
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
          {(['지출', '수입', '저축'] as TabType[]).map((tab) => {
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
        {Object.keys(grouped).length === 0 ? (
          <p className="text-sm text-muted-foreground text-center mt-20">내역이 없어요</p>
        ) : (
          <div className="flex flex-col gap-3">
            {Object.entries(grouped).map(([label, items]) => {
              const groupTotal = items.reduce((sum, t) => sum + t.amount, 0)

              // 월간 뷰: 그룹 내에서 주차별 서브그룹
              if (viewMode === 'monthly') {
                const byWeek: Record<string, Transaction[]> = {}
                for (const item of items) {
                  const weekNum = Math.ceil(new Date(item.date).getDate() / 7)
                  const wk = `${weekNum}주차`
                  if (!byWeek[wk]) byWeek[wk] = []
                  byWeek[wk].push(item)
                }

                return (
                  <div key={label} className="bg-surface rounded-xl overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-2.5 bg-muted/50">
                      <span className="text-xs font-medium text-muted-foreground">{label}</span>
                      <span className={`text-xs font-medium tabular-nums ${'text-foreground'}`}>
                        ₩{groupTotal.toLocaleString()}
                      </span>
                    </div>
                    {Object.entries(byWeek).map(([wk, wkItems]) => {
                      const wkTotal = wkItems.reduce((s, t) => s + t.amount, 0)
                      return (
                        <div key={wk}>
                          <div className="flex items-center justify-between px-4 py-1.5 bg-muted/20">
                            <span className="text-[10px] text-muted-foreground">{wk}</span>
                            <span className={`text-[10px] tabular-nums ${'text-foreground'}`}>
                              ₩{wkTotal.toLocaleString()}
                            </span>
                          </div>
                          {wkItems.map((tx, i) => { if (i === 0) lastRenderedDate.current = null; return renderRow(tx) })}
                        </div>
                      )
                    })}
                  </div>
                )
              }

              // 연간 뷰: 그룹 내에서 월별 서브그룹
              if (viewMode === 'yearly') {
                const byMonth: Record<string, Transaction[]> = {}
                for (const item of items) {
                  const mk = `${new Date(item.date).getMonth() + 1}월`
                  if (!byMonth[mk]) byMonth[mk] = []
                  byMonth[mk].push(item)
                }

                return (
                  <div key={label} className="bg-surface rounded-xl overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-2.5 bg-muted/50">
                      <span className="text-xs font-medium text-muted-foreground">{label}</span>
                      <span className={`text-xs font-medium tabular-nums ${'text-foreground'}`}>
                        ₩{groupTotal.toLocaleString()}
                      </span>
                    </div>
                    {Object.entries(byMonth).map(([mk, mItems]) => {
                      const mTotal = mItems.reduce((s, t) => s + t.amount, 0)
                      return (
                        <div key={mk}>
                          <div className="flex items-center justify-between px-4 py-1.5 bg-muted/20">
                            <span className="text-[10px] text-muted-foreground">{mk}</span>
                            <span className={`text-[10px] tabular-nums ${'text-foreground'}`}>
                              ₩{mTotal.toLocaleString()}
                            </span>
                          </div>
                          {mItems.map((tx, i) => { if (i === 0) lastRenderedDate.current = null; return renderRow(tx) })}
                        </div>
                      )
                    })}
                  </div>
                )
              }

              // 주간 뷰: 기본
              return (
                <div key={label} className="bg-surface rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2.5 bg-muted/50">
                    <span className="text-xs font-medium text-muted-foreground">{label}</span>
                    <span className={`text-xs font-medium tabular-nums ${'text-foreground'}`}>
                      ₩{groupTotal.toLocaleString()}
                    </span>
                  </div>
                  {items.map((tx, i) => {
                    if (i === 0) lastRenderedDate.current = null
                    return renderRow(tx)
                  })}
                </div>
              )
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
