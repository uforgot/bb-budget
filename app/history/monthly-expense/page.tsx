'use client'

import { Suspense, useCallback, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { AddTransactionModal } from '@/components/add-transaction-modal'
import { BottomNav } from '@/components/bottom-nav'
import { PullToRefresh } from '@/components/pull-to-refresh'
import { semanticColors } from '@/components/ui-colors'
import { TopToolbar } from '@/components/top-toolbar'
import { getCategories, getTransactions, type Category, type Transaction } from '@/lib/api'

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토']
type MonthlyHistoryType = 'expense' | 'income' | 'savings' | 'balance'
type BalanceSummary = {
  prevBalance: number
  income: number
  expense: number
  savingsChange: number
  currentBalance: number
}

const TYPE_META: Record<MonthlyHistoryType, { title: string; empty: string }> = {
  expense: { title: '쓴 지출', empty: '지출 내역이 없어요' },
  income: { title: '번 수입', empty: '수입 내역이 없어요' },
  savings: { title: '모은 저축', empty: '저축 내역이 없어요' },
  balance: { title: '남은 잔액', empty: '수입/지출 내역이 없어요' },
}

const TYPE_COLOR: Record<MonthlyHistoryType, string> = {
  expense: semanticColors.expense,
  income: semanticColors.income,
  savings: semanticColors.savings,
  balance: '#2C2C2E',
}

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

function parseTypeParam(params: Pick<URLSearchParams, 'get'>): MonthlyHistoryType {
  const type = params.get('type')
  return type === 'income' || type === 'savings' || type === 'expense' || type === 'balance' ? type : 'expense'
}

function getMonthEndDate(year: number, month: number) {
  const daysInMonth = new Date(year, month, 0).getDate()
  return formatDateKey(year, month, daysInMonth)
}

function getMonthStartDate(year: number, month: number) {
  return formatDateKey(year, month, 1)
}

function getPrevMonthEndDate(year: number, month: number) {
  const date = new Date(year, month - 1, 0)
  return formatDateKey(date.getFullYear(), date.getMonth() + 1, date.getDate())
}

function filterActiveSavingsAtMonthEnd(transactions: Transaction[], monthEndDate: string) {
  return transactions.filter(tx => tx.date <= monthEndDate && (!tx.end_date || tx.end_date > monthEndDate))
}

function getBalanceAtDate(transactions: Transaction[], date: string) {
  const income = transactions.filter(tx => tx.type === 'income' && tx.date <= date).reduce((sum, tx) => sum + tx.amount, 0)
  const expense = transactions.filter(tx => tx.type === 'expense' && tx.date <= date).reduce((sum, tx) => sum + tx.amount, 0)
  const savings = filterActiveSavingsAtMonthEnd(transactions.filter(tx => tx.type === 'savings'), date).reduce((sum, tx) => sum + tx.amount, 0)
  return income - expense - savings
}

function getBalanceSummary(transactions: Transaction[], year: number, month: number): BalanceSummary {
  const monthStartDate = getMonthStartDate(year, month)
  const monthEndDate = getMonthEndDate(year, month)
  const prevMonthEndDate = getPrevMonthEndDate(year, month)
  const monthTxs = transactions.filter(tx => tx.date >= monthStartDate && tx.date <= monthEndDate)
  const prevSavings = filterActiveSavingsAtMonthEnd(transactions.filter(tx => tx.type === 'savings'), prevMonthEndDate).reduce((sum, tx) => sum + tx.amount, 0)
  const currentSavings = filterActiveSavingsAtMonthEnd(transactions.filter(tx => tx.type === 'savings'), monthEndDate).reduce((sum, tx) => sum + tx.amount, 0)

  return {
    prevBalance: getBalanceAtDate(transactions, prevMonthEndDate),
    income: monthTxs.filter(tx => tx.type === 'income').reduce((sum, tx) => sum + tx.amount, 0),
    expense: monthTxs.filter(tx => tx.type === 'expense').reduce((sum, tx) => sum + tx.amount, 0),
    savingsChange: currentSavings - prevSavings,
    currentBalance: getBalanceAtDate(transactions, monthEndDate),
  }
}

function getVisibleTransactions(type: MonthlyHistoryType, transactions: Transaction[], year: number, month: number) {
  if (type === 'savings') return filterActiveSavingsAtMonthEnd(transactions, getMonthEndDate(year, month))
  if (type !== 'balance') return transactions

  const monthStartDate = getMonthStartDate(year, month)
  const monthEndDate = getMonthEndDate(year, month)
  return transactions.filter(tx => tx.date >= monthStartDate && tx.date <= monthEndDate && (tx.type === 'income' || tx.type === 'expense'))
}

function formatCurrency(amount: number) {
  const sign = amount < 0 ? '-' : ''
  return `${sign}₩${Math.abs(amount).toLocaleString()}`
}

function formatSignedCurrency(amount: number) {
  if (amount === 0) return '₩0'
  return `${amount > 0 ? '+' : '-'}₩${Math.abs(amount).toLocaleString()}`
}

function BalanceSummaryLine({ label, amount, signed = false, strong = false }: { label: string; amount: number; signed?: boolean; strong?: boolean }) {
  const isPositive = amount > 0
  const isNegative = amount < 0
  return (
    <div className={`flex items-center justify-between ${strong ? 'pt-3' : ''}`}>
      <span className={`text-[13px] ${strong ? 'font-semibold text-foreground' : 'font-medium text-muted-foreground'}`}>{label}</span>
      <span
        className={`text-[14px] tabular-nums ${strong ? 'font-bold text-foreground' : 'font-semibold'} ${!strong && isPositive ? 'text-[#14b8a6]' : ''} ${!strong && isNegative ? 'text-accent-blue' : ''} ${!strong && !isPositive && !isNegative ? 'text-foreground' : ''}`}
      >
        {signed ? formatSignedCurrency(amount) : formatCurrency(amount)}
      </span>
    </div>
  )
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
  const type = parseTypeParam(searchParams)
  const meta = TYPE_META[type]
  const monthEndDate = getMonthEndDate(year, month)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [balanceSummary, setBalanceSummary] = useState<BalanceSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editTx, setEditTx] = useState<Transaction | null>(null)

  const loadData = useCallback(async () => {
    try {
      const [cats, txs] = await Promise.all([
        getCategories(),
        type === 'balance'
          ? getTransactions({})
          : type === 'savings'
          ? getTransactions({ type })
          : getTransactions({ year, month, type }),
      ])
      setCategories(cats)
      setBalanceSummary(type === 'balance' ? getBalanceSummary(txs, year, month) : null)
      const visibleTxs = getVisibleTransactions(type, txs, year, month)
      setTransactions([...visibleTxs].sort((a, b) => {
        const dateDiff = b.date.localeCompare(a.date)
        if (dateDiff !== 0) return dateDiff
        return b.created_at.localeCompare(a.created_at)
      }))
    } finally {
      setLoading(false)
    }
  }, [year, month, type])

  useEffect(() => {
    setLoading(true)
    loadData()
  }, [loadData])

  const total = type === 'balance'
    ? balanceSummary?.currentBalance ?? 0
    : transactions.reduce((sum, tx) => sum + tx.amount, 0)
  const savingsAdjustment = balanceSummary ? -balanceSummary.savingsChange : 0

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
            <p className="text-[30px] font-bold text-foreground">
              {year}년 {month}월 {meta.title}
            </p>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-[20px] font-bold leading-tight tabular-nums" style={{ color: TYPE_COLOR[type] }}>
                {formatCurrency(total)}
              </span>
              <span className="text-[12px] font-medium text-muted-foreground">{transactions.length}건</span>
            </div>
          </section>

          {type === 'balance' && balanceSummary && (
            <section className="mb-4 rounded-[18px] bg-surface px-4 py-3">
              <div className="space-y-2">
                <BalanceSummaryLine label="전월 잔액" amount={balanceSummary.prevBalance} />
                <BalanceSummaryLine label="수입" amount={balanceSummary.income} signed />
                <BalanceSummaryLine label="지출" amount={-balanceSummary.expense} signed />
                {savingsAdjustment !== 0 && (
                  <BalanceSummaryLine label="저축 반영" amount={savingsAdjustment} signed />
                )}
              </div>
              <div className="mt-3 border-t border-black/5 dark:border-white/10">
                <BalanceSummaryLine label="해당 월 잔액" amount={balanceSummary.currentBalance} strong />
              </div>
            </section>
          )}

          {loading ? (
            <div className="animate-pulse divide-y divide-black/5 dark:divide-white/10">
              <div className="h-12 bg-surface" />
              <div className="h-12 bg-surface" />
              <div className="h-12 bg-surface" />
              <div className="h-12 bg-surface" />
            </div>
          ) : transactions.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground">{meta.empty}</p>
          ) : (
            <div className="divide-y divide-black/5 pb-8 dark:divide-white/10">
              {transactions.map((tx, index) => {
                const showDate = index === 0 || transactions[index - 1].date !== tx.date
                const d = new Date(`${tx.date}T00:00:00`)
                const isInactiveForView = !!tx.end_date && tx.end_date <= monthEndDate
                return (
                  <button
                    key={tx.id}
                    onClick={() => {
                      setEditTx(tx)
                      setModalOpen(true)
                    }}
                    className={`flex min-h-12 w-full items-center gap-3 py-2 text-left active:bg-muted/30 ${isInactiveForView ? 'opacity-40' : ''}`}
                  >
                    <div className="w-[52px] flex-shrink-0">
                      {showDate ? (
                        <div className="leading-tight">
                          <p className="text-[13px] font-semibold tabular-nums text-foreground">
                            {d.getDate()}일
                          </p>
                          <p className="text-[10px] font-medium text-muted-foreground">{DAY_NAMES[d.getDay()]}</p>
                        </div>
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`truncate text-[13px] font-semibold text-foreground ${isInactiveForView ? 'line-through' : ''}`}>
                        {getCategoryLabel(tx, categories)}
                      </p>
                      {tx.description && (
                        <p className={`truncate text-[11px] text-muted-foreground ${isInactiveForView ? 'line-through' : ''}`}>
                          {tx.description}
                        </p>
                      )}
                    </div>
                    <span
                      className={`flex-shrink-0 text-[14px] font-semibold tabular-nums text-foreground ${isInactiveForView ? 'line-through' : ''}`}
                      style={type === 'balance' ? { color: tx.type === 'income' ? semanticColors.income : semanticColors.expense } : undefined}
                    >
                      {type === 'balance' ? formatSignedCurrency(tx.type === 'income' ? tx.amount : -tx.amount) : formatCurrency(tx.amount)}
                    </span>
                  </button>
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
