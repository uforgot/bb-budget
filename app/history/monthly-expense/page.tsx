'use client'

import { Suspense, useCallback, useEffect, useState } from 'react'
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
          <section className="mb-3">
            <p className="text-[30px] font-bold text-foreground" style={{ letterSpacing: '-1px' }}>
              {year}년 {month}월
            </p>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-[13px] font-semibold text-muted-foreground">쓴 지출</span>
              <span className="text-[20px] font-bold leading-tight tracking-[-0.03em] tabular-nums" style={{ color: semanticColors.expense }}>
                ₩{total.toLocaleString()}
              </span>
              <span className="text-[12px] font-medium text-muted-foreground">{transactions.length}건</span>
            </div>
          </section>

          {loading ? (
            <div className="animate-pulse divide-y divide-black/5 dark:divide-white/10">
              <div className="h-12 bg-surface" />
              <div className="h-12 bg-surface" />
              <div className="h-12 bg-surface" />
              <div className="h-12 bg-surface" />
            </div>
          ) : transactions.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground">지출 내역이 없어요</p>
          ) : (
            <div className="divide-y divide-black/5 pb-8 dark:divide-white/10">
              {transactions.map((tx, index) => {
                const showDate = index === 0 || transactions[index - 1].date !== tx.date
                const d = new Date(`${tx.date}T00:00:00`)
                return (
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
                      className={`flex min-h-12 w-full items-center gap-3 py-2 text-left active:bg-muted/30 ${tx.end_date ? 'opacity-40' : ''}`}
                    >
                      <div className="w-[52px] flex-shrink-0">
                        {showDate ? (
                          <div className="leading-tight">
                            <p className="text-[13px] font-semibold tabular-nums text-foreground">
                              {d.getMonth() + 1}. {d.getDate()}
                            </p>
                            <p className="text-[10px] font-medium text-muted-foreground">{DAY_NAMES[d.getDay()]}</p>
                          </div>
                        ) : null}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`truncate text-[13px] font-semibold text-foreground ${tx.end_date ? 'line-through' : ''}`}>
                          {getCategoryLabel(tx, categories)}
                        </p>
                        {tx.description && (
                          <p className={`truncate text-[11px] text-muted-foreground ${tx.end_date ? 'line-through' : ''}`}>
                            {tx.description}
                          </p>
                        )}
                      </div>
                      <span className={`flex-shrink-0 text-[14px] font-semibold tabular-nums text-foreground ${tx.end_date ? 'line-through' : ''}`}>
                        ₩{tx.amount.toLocaleString()}
                      </span>
                    </button>
                  </SwipeToDelete>
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
