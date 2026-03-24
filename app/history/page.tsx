'use client'

import { useState, useEffect, useCallback } from 'react'
import { BottomNav } from '@/components/bottom-nav'
import { TopHeader } from '@/components/top-header'
import { AddTransactionModal } from '@/components/add-transaction-modal'
import { getTransactions, deleteTransaction, type Transaction } from '@/lib/api'
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
  const [activeTab, setActiveTab] = useState<TabType>('지출')
  const [viewMode, setViewMode] = useState<ViewMode>('weekly')
  const [modalOpen, setModalOpen] = useState(false)
  const [editTx, setEditTx] = useState<Transaction | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])

  const loadData = useCallback(async () => {
    try {
      const data = await getTransactions({ type: TAB_DB_MAP[activeTab] })
      setTransactions(data)
    } catch (e) {
      console.error('내역 로드 실패:', e)
    }
  }, [activeTab])

  useEffect(() => {
    loadData()
  }, [loadData])

  const grouped = groupTransactions(transactions, viewMode)

  const tabColors: Record<TabType, { active: string; border: string; text: string }> = {
    '지출': { active: 'text-accent-coral', border: 'border-accent-coral', text: 'text-accent-coral' },
    '수입': { active: 'text-accent-blue', border: 'border-accent-blue', text: 'text-accent-blue' },
    '저축': { active: 'text-accent-mint', border: 'border-accent-mint', text: 'text-accent-mint' },
  }

  const renderRow = (tx: Transaction) => {
    const cat = tx.category as any
    const parentName = cat?.parent_id ? '' : ''
    const catName = cat?.name || ''
    const desc = tx.description || ''

    const d = new Date(tx.date)
    const dateDisplay = `${d.getMonth() + 1}/${d.getDate()}(${getWeekday(tx.date)})`

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
          {/* 날짜/요일 */}
          <span className="text-xs text-muted-foreground tabular-nums w-14 flex-shrink-0">
            {dateDisplay}
          </span>

          {/* 카테고리 + 메모 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground flex-shrink-0">{catName}</span>
              {desc && <span className="text-[10px] text-muted-foreground truncate">{desc}</span>}
            </div>
          </div>

          {/* 금액 */}
          <span className={`text-sm font-semibold tabular-nums flex-shrink-0 ${tabColors[activeTab].text}`}>
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

        {/* Tabs: 지출 / 수입 / 저축 */}
        <div className="flex border-b border-border">
          {(['지출', '수입', '저축'] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 pb-2.5 text-sm font-medium text-center transition-colors ${
                activeTab === tab
                  ? `${tabColors[tab].active} border-b-2 ${tabColors[tab].border}`
                  : 'text-muted-foreground'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* View mode: 주간 / 월간 / 연간 */}
        <div className="flex items-center justify-end py-2">
          <div className="flex bg-muted rounded-lg p-0.5">
            {(['weekly', 'monthly', 'yearly'] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1 text-[11px] rounded-md transition-colors ${
                  viewMode === mode
                    ? 'bg-card text-foreground font-medium shadow-sm'
                    : 'text-muted-foreground'
                }`}
              >
                {mode === 'weekly' ? '주간' : mode === 'monthly' ? '월간' : '연간'}
              </button>
            ))}
          </div>
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
                  <div key={label} className="bg-card rounded-xl overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-2.5 bg-muted/50">
                      <span className="text-xs font-medium text-muted-foreground">{label}</span>
                      <span className={`text-xs font-medium tabular-nums ${tabColors[activeTab].text}`}>
                        ₩{groupTotal.toLocaleString()}
                      </span>
                    </div>
                    {Object.entries(byWeek).map(([wk, wkItems]) => {
                      const wkTotal = wkItems.reduce((s, t) => s + t.amount, 0)
                      return (
                        <div key={wk}>
                          <div className="flex items-center justify-between px-4 py-1.5 bg-muted/20">
                            <span className="text-[10px] text-muted-foreground">{wk}</span>
                            <span className={`text-[10px] tabular-nums ${tabColors[activeTab].text}`}>
                              ₩{wkTotal.toLocaleString()}
                            </span>
                          </div>
                          {wkItems.map(renderRow)}
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
                  <div key={label} className="bg-card rounded-xl overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-2.5 bg-muted/50">
                      <span className="text-xs font-medium text-muted-foreground">{label}</span>
                      <span className={`text-xs font-medium tabular-nums ${tabColors[activeTab].text}`}>
                        ₩{groupTotal.toLocaleString()}
                      </span>
                    </div>
                    {Object.entries(byMonth).map(([mk, mItems]) => {
                      const mTotal = mItems.reduce((s, t) => s + t.amount, 0)
                      return (
                        <div key={mk}>
                          <div className="flex items-center justify-between px-4 py-1.5 bg-muted/20">
                            <span className="text-[10px] text-muted-foreground">{mk}</span>
                            <span className={`text-[10px] tabular-nums ${tabColors[activeTab].text}`}>
                              ₩{mTotal.toLocaleString()}
                            </span>
                          </div>
                          {mItems.map(renderRow)}
                        </div>
                      )
                    })}
                  </div>
                )
              }

              // 주간 뷰: 기본
              return (
                <div key={label} className="bg-card rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2.5 bg-muted/50">
                    <span className="text-xs font-medium text-muted-foreground">{label}</span>
                    <span className={`text-xs font-medium tabular-nums ${tabColors[activeTab].text}`}>
                      ₩{groupTotal.toLocaleString()}
                    </span>
                  </div>
                  {items.map(renderRow)}
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
