'use client'

import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import type { Category, Transaction } from '@/lib/api'

function fmt(amount: number) {
  return `₩${amount.toLocaleString()}`
}

function parseDate(date: string) {
  return new Date(`${date}T00:00:00`)
}

export function AnalysisDetailSheet({
  open,
  parent,
  categories,
  transactions,
  initialYear,
  initialMonth,
  onClose,
  onSelectTransaction,
}: {
  open: boolean
  parent: Category | null
  categories: Category[]
  transactions: Transaction[]
  initialYear: number
  initialMonth: number
  onClose: () => void
  onSelectTransaction: (transaction: Transaction) => void
}) {
  const [year, setYear] = useState(initialYear)
  const [month, setMonth] = useState(initialMonth)

  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = previousOverflow }
  }, [open])

  useEffect(() => {
    if (!open) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  const childCategories = useMemo(
    () => categories.filter(category => category.parent_id === parent?.id),
    [categories, parent?.id],
  )

  const monthTransactions = useMemo(() => {
    if (!parent) return []
    const categoryIds = new Set([parent.id, ...childCategories.map(category => category.id)])
    return transactions
      .filter(transaction => {
        if (!categoryIds.has(transaction.category_id)) return false
        const date = parseDate(transaction.date)
        return date.getFullYear() === year && date.getMonth() + 1 === month
      })
      .sort((a, b) => b.date.localeCompare(a.date) || b.created_at.localeCompare(a.created_at))
  }, [childCategories, month, parent, transactions, year])

  const previousMonthTransactions = useMemo(() => {
    if (!parent) return []
    const previousMonth = new Date(year, month - 2, 1)
    const categoryIds = new Set([parent.id, ...childCategories.map(category => category.id)])
    return transactions.filter(transaction => {
      if (!categoryIds.has(transaction.category_id)) return false
      const date = parseDate(transaction.date)
      return date.getFullYear() === previousMonth.getFullYear() && date.getMonth() === previousMonth.getMonth()
    })
  }, [childCategories, month, parent, transactions, year])

  const categoryTotals = useMemo(() => {
    const categoryById = new Map(categories.map(category => [category.id, category]))
    const previousTotals = new Map<string, number>()
    previousMonthTransactions.forEach(transaction => {
      previousTotals.set(transaction.category_id, (previousTotals.get(transaction.category_id) ?? 0) + transaction.amount)
    })

    const totals = new Map<string, { id: string; label: string; total: number }>()
    monthTransactions.forEach(transaction => {
      const category = categoryById.get(transaction.category_id)
      const id = category?.id ?? 'uncategorized'
      const label = category?.id === parent?.id ? (parent?.name ?? '미분류') : (category?.name ?? '미분류')
      const item = totals.get(id) ?? { id, label, total: 0 }
      item.total += transaction.amount
      totals.set(id, item)
    })

    return Array.from(totals.values())
      .map(item => ({ ...item, difference: item.total - (previousTotals.get(item.id) ?? 0) }))
      .sort((a, b) => b.total - a.total)
  }, [categories, monthTransactions, parent, previousMonthTransactions])

  if (!open || !parent) return null

  const total = monthTransactions.reduce((sum, transaction) => sum + transaction.amount, 0)
  const recentTransactions = monthTransactions.slice(0, 5)
  const isCurrentMonth = year === initialYear && month === initialMonth

  const moveMonth = (offset: number) => {
    const next = new Date(year, month - 1 + offset, 1)
    setYear(next.getFullYear())
    setMonth(next.getMonth() + 1)
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center" role="dialog" aria-modal="true" aria-label={`${parent.name} 상세 내역`}>
      <button type="button" className="absolute inset-0 bg-black/50" onClick={onClose} aria-label="상세 내역 닫기" />
      <div className="relative flex max-h-[82dvh] w-full max-w-md flex-col overflow-hidden rounded-t-[28px] bg-sheet shadow-2xl">
        <div className="px-5 pt-3 pb-4 flex-shrink-0">
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-black/15 dark:bg-white/15" />
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-[18px] font-semibold">{parent.name} 상세</p>
              <p className="mt-0.5 text-[13px] text-muted-foreground">{fmt(total)}</p>
            </div>
            <button type="button" onClick={onClose} className="flex size-11 items-center justify-center rounded-full bg-white dark:bg-gray-800" aria-label="닫기">
              <X size={20} strokeWidth={2.2} />
            </button>
          </div>

          <div className="mt-4 flex items-center justify-between rounded-[18px] bg-white px-2 py-1.5 dark:bg-gray-800">
            <button type="button" onClick={() => moveMonth(-1)} className="flex size-10 items-center justify-center rounded-full active:bg-black/5 dark:active:bg-white/5" aria-label="이전 달">
              <ChevronLeft size={20} />
            </button>
            <p className="text-[15px] font-semibold">{year}년 {month}월</p>
            <button type="button" onClick={() => moveMonth(1)} disabled={isCurrentMonth} className="flex size-10 items-center justify-center rounded-full disabled:opacity-20 active:bg-black/5 dark:active:bg-white/5" aria-label="다음 달">
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto overscroll-contain px-5" style={{ paddingBottom: 'calc(32px + env(safe-area-inset-bottom, 0px))' }}>
          {monthTransactions.length === 0 ? (
            <div className="rounded-[22px] bg-white px-4 py-10 text-center text-[14px] text-muted-foreground dark:bg-gray-800">
              이 달에는 내역이 없어요
            </div>
          ) : (
            <>
              <section className="overflow-hidden rounded-[22px] bg-white px-4 dark:bg-gray-800">
                <p className="py-4 text-[14px] font-semibold">하위 카테고리</p>
                {categoryTotals.map((item, index) => (
                  <div key={item.id} className={`flex items-center justify-between py-3 text-[14px] ${index > 0 ? 'border-t border-black/10 dark:border-white/10' : ''}`}>
                    <span className="text-black/50 dark:text-white/50">{item.label}</span>
                    <span className="flex flex-col items-end">
                      <span className="font-semibold tabular-nums text-black/50 dark:text-white/50">{fmt(item.total)}</span>
                      <span className={`mt-0.5 text-[11px] tabular-nums ${item.difference > 0 ? 'text-accent-coral' : item.difference < 0 ? 'text-[#14b8a6]' : 'text-muted-foreground'}`}>
                        지난달 대비 {item.difference > 0 ? '+' : item.difference < 0 ? '-' : ''}{fmt(Math.abs(item.difference))}
                      </span>
                    </span>
                  </div>
                ))}
              </section>

              <section className="mt-3 overflow-hidden rounded-[22px] bg-white px-4 dark:bg-gray-800">
                <p className="py-4 text-[14px] font-semibold">최근 결제 내역</p>
                {recentTransactions.map((transaction, index) => {
                  const category = categories.find(item => item.id === transaction.category_id)
                  const date = parseDate(transaction.date)
                  return (
                    <button
                      key={transaction.id}
                      type="button"
                      onClick={() => onSelectTransaction(transaction)}
                      className={`flex w-full items-center gap-3 py-3 text-left ${index > 0 ? 'border-t border-black/10 dark:border-white/10' : ''}`}
                    >
                      <span className="w-11 flex-shrink-0 text-[13px] font-medium tabular-nums">{date.getMonth() + 1}.{date.getDate()}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] text-black/50 dark:text-white/50">{category?.name ?? '미분류'}</span>
                        {transaction.description && <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">{transaction.description}</span>}
                      </span>
                      <span className="flex-shrink-0 text-[14px] font-semibold tabular-nums">{fmt(transaction.amount)}</span>
                    </button>
                  )
                })}
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
