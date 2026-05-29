'use client'

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { AddTransactionModal } from '@/components/add-transaction-modal'
import { BottomNav } from '@/components/bottom-nav'
import { PullToRefresh } from '@/components/pull-to-refresh'
import { SwipeToDelete } from '@/components/swipe-to-delete'
import { semanticColors } from '@/components/ui-colors'
import { TopToolbar } from '@/components/top-toolbar'
import { deleteTransactionWithRecurringCascade, getCategories, getTransactions, type Category, type Transaction } from '@/lib/api'

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토']

function formatDateKey(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function getFallbackMonth() {
  const now = new Date()
  return { year: now.getFullYear(), month: now.getMonth() + 1 }
}

function parseMonthParams(params: Pick<URLSearchParams, 'get'>) {
  const fallback = getFallbackMonth()
  const year = Number(params.get('year')) || fallback.year
  const month = Number(params.get('month')) || fallback.month

  if (month < 1 || month > 12) return fallback
  return { year, month }
}

function getCategoryLabel(tx: Transaction, categories: Category[]) {
  const cat = tx.category as Category | undefined
  if (!cat) return '미분류'
  if (!cat.parent_id) return cat.name
  const parent = categories.find(c => c.id === cat.parent_id)
  return parent ? `${parent.name} · ${cat.name}` : cat.name
}

function MonthlyExpensePageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { year, month } = parseMonthParams(searchParams)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editTx, setEditTx] = useState<Transaction | null>(null)

  const loadData = useCallback(async () => {
    try {
      const [cats, txs] = await Promise.all([
        getCategories(),
        getTransactions({ year, month, type: 'expense' }),
      ])
      setCategories(cats)
      setTransactions([...txs].sort((a, b) => {
        const dateDiff = b.date.localeCompare(a.date)
        if (dateDiff !== 0) return dateDiff
        return b.created_at.localeCompare(a.created_at)
      }))
    } finally {
      setLoading(false)
    }
  }, [year, month])

  useEffect(() => {
    setLoading(true)
    loadData()
  }, [loadData])

  const total = transactions.reduce((sum, tx) => sum + tx.amount, 0)
  const grouped = useMemo(() => {
    return transactions.reduce((acc, tx) => {
      if (!acc[tx.date]) acc[tx.date] = []
      acc[tx.date].push(tx)
      return acc
    }, {} as Record<string, Transaction[]>)
  }, [transactions])

  const closeModal = () => {
    const scrollY = window.scrollY
    setModalOpen(false)
    setEditTx(null)
    loadData().then(() => requestAnimationFrame(() => window.scrollTo(0, scrollY)))
  }

  return (
    <PullToRefresh className="min-h-dvh bg-background pb-32" onRefresh={loadData}>
      <>
        <TopToolbar
          left={
            <button
              onClick={() => router.back()}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-black dark:bg-gray-900 dark:text-white"
              aria-label="뒤로"
            >
              <ChevronLeft size={22} strokeWidth={2.4} />
            </button>
          }
          onSettings={() => router.push('/settings')}
        />

        <main className="px-5">
          <section className="mb-5">
            <p className="text-[30px] font-bold text-foreground" style={{ letterSpacing: '-1px' }}>
              {year}년 {month}월
            </p>
            <div className="mt-3 rounded-[22px] px-4 py-4 text-white" style={{ backgroundColor: semanticColors.expense }}>
              <p className="text-[14px] font-medium text-white/75">쓴 지출</p>
              <p className="mt-1 text-[26px] font-bold leading-tight tracking-[-0.03em] tabular-nums">
                ₩{total.toLocaleString()}
              </p>
              <p className="mt-2 text-[13px] font-medium text-white/70">{transactions.length}건</p>
            </div>
          </section>

          {loading ? (
            <div className="space-y-3 animate-pulse">
              <div className="h-24 rounded-[22px] bg-surface" />
              <div className="h-24 rounded-[22px] bg-surface" />
              <div className="h-24 rounded-[22px] bg-surface" />
            </div>
          ) : transactions.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground">지출 내역이 없어요</p>
          ) : (
            <div className="space-y-3 pb-8">
              {Object.entries(grouped).map(([dateKey, items]) => {
                const d = new Date(`${dateKey}T00:00:00`)
                const dayTotal = items.reduce((sum, tx) => sum + tx.amount, 0)
                return (
                  <section key={dateKey} className="overflow-hidden rounded-[22px] bg-surface">
                    <div className="flex items-center justify-between px-4 pb-3 pt-4">
                      <p className="text-[14px] font-semibold text-foreground">
                        {d.getMonth() + 1}. {d.getDate()}. ({DAY_NAMES[d.getDay()]})
                      </p>
                      <p className="text-[13px] font-semibold tabular-nums text-muted-foreground">
                        ₩{dayTotal.toLocaleString()}
                      </p>
                    </div>
                    <div className="mx-4 border-t border-black/10 dark:border-white/10" />
                    <div className="py-2">
                      {items.map(tx => (
                        <SwipeToDelete
                          key={tx.id}
                          onDelete={async () => {
                            await deleteTransactionWithRecurringCascade(tx)
                            loadData()
                          }}
                        >
                          <button
                            onClick={() => {
                              setEditTx(tx)
                              setModalOpen(true)
                            }}
                            className={`flex w-full items-center gap-3 px-4 py-2 text-left active:bg-muted/30 ${tx.end_date ? 'opacity-40' : ''}`}
                          >
                            <div className="min-w-0 flex-1">
                              <span className="inline-block rounded-full px-3 py-1 text-xs text-white" style={{ backgroundColor: semanticColors.expense }}>
                                {getCategoryLabel(tx, categories)}
                              </span>
                              {tx.description && (
                                <p className={`mt-1 truncate pl-1 text-[11px] text-muted-foreground ${tx.end_date ? 'line-through' : ''}`}>
                                  {tx.description}
                                </p>
                              )}
                            </div>
                            <span className={`flex-shrink-0 text-[14px] font-semibold tabular-nums text-foreground ${tx.end_date ? 'line-through' : ''}`}>
                              ₩{tx.amount.toLocaleString()}
                            </span>
                          </button>
                        </SwipeToDelete>
                      ))}
                    </div>
                  </section>
                )
              })}
            </div>
          )}
        </main>

        <AddTransactionModal
          open={modalOpen}
          editTransaction={editTx}
          initialDate={editTx?.date || formatDateKey(year, month, 1)}
          onClose={closeModal}
          onSave={() => {}}
        />

        {!modalOpen && <BottomNav hideAdd />}
      </>
    </PullToRefresh>
  )
}

export default function MonthlyExpensePage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-background" />}>
      <MonthlyExpensePageContent />
    </Suspense>
  )
}
