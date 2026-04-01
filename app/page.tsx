'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { PullToRefresh } from '@/components/pull-to-refresh'
import { BottomNav } from '@/components/bottom-nav'
import { MonthlyCalendar } from '@/components/monthly-calendar'
import { AddTransactionModal } from '@/components/add-transaction-modal'
import { type Transaction } from '@/lib/api'
import { LayoutGrid, Settings } from 'lucide-react'

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토']

function toDateStr(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function DayTransactions({
  date,
  refreshKey,
  onEdit,
}: {
  date: string
  refreshKey: number
  onEdit: (tx: Transaction) => void
}) {
  const [txs, setTxs] = useState<Transaction[]>([])
  const [catMap, setCatMap] = useState<Record<string, any>>({})

  useEffect(() => {
    ;(async () => {
      try {
        const { getTransactions, getCategories } = await import('@/lib/api')
        const d = new Date(date)
        const [all, cats] = await Promise.all([
          getTransactions({ year: d.getFullYear(), month: d.getMonth() + 1 }),
          getCategories(),
        ])
        setCatMap(Object.fromEntries(cats.map(c => [c.id, c])))
        setTxs(
          all
            .filter(t => t.date === date)
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        )
      } catch {}
    })()
  }, [date, refreshKey])

  if (txs.length === 0) {
    return (
      <p className="text-[13px] text-muted-foreground text-center py-6">
        거래 내역이 없어요
      </p>
    )
  }

  return (
    <div className="flex flex-col divide-y divide-border">
      {txs.map(tx => {
        const cat = catMap[tx.category_id]
        const catName = cat?.name || '기타'
        const parentCat = cat?.parent_id ? catMap[cat.parent_id] : null
        const colorClass =
          tx.type === 'savings'
            ? 'text-accent-mint'
            : tx.type === 'expense'
            ? 'text-accent-coral'
            : 'text-accent-blue'
        return (
          <div
            key={tx.id}
            onClick={() => onEdit(tx)}
            className="flex items-center justify-between py-3 px-5 cursor-pointer active:bg-muted/50"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-xs bg-muted px-3 py-1.5 rounded-full shrink-0">
                {parentCat ? (
                  <>
                    <span className="text-foreground">{parentCat.name}</span>
                    <span className="text-muted-foreground"> · {catName}</span>
                  </>
                ) : (
                  <span className="text-foreground">{catName}</span>
                )}
              </span>
              {tx.description && (
                <span className="text-[11px] text-muted-foreground truncate">
                  {tx.description}
                </span>
              )}
            </div>
            <span className={`text-sm font-semibold tabular-nums shrink-0 ml-2 ${colorClass}`}>
              ₩{tx.amount.toLocaleString()}
            </span>
          </div>
        )
      })}
    </div>
  )
}

export default function Home() {
  const router = useRouter()
  const today = new Date()

  const [calYear, setCalYear] = useState(today.getFullYear())
  const [calMonth, setCalMonth] = useState(today.getMonth() + 1)
  const [selectedDay, setSelectedDay] = useState(today.getDate())
  const [modalOpen, setModalOpen] = useState(false)
  const [editTx, setEditTx] = useState<Transaction | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const selectedDate = toDateStr(calYear, calMonth, selectedDay)
  const selectedDateLabel = (() => {
    const d = new Date(calYear, calMonth - 1, selectedDay)
    return `${calMonth}월 ${selectedDay}일 ${DAY_NAMES[d.getDay()]}요일`
  })()

  // 반복 거래 자동 등록 (최초 1회)
  useEffect(() => {
    ;(async () => {
      try {
        const { confirmRecurringTransactions } = await import('@/lib/api')
        await confirmRecurringTransactions(today.getFullYear(), today.getMonth() + 1)
      } catch {}
    })()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleRefresh = useCallback(async () => {
    setRefreshKey(k => k + 1)
  }, [])

  return (
    <PullToRefresh
      className="min-h-dvh bg-background pb-32"
      onRefresh={handleRefresh}
    >
      {/* 상단 바 */}
      <div className="sticky top-0 z-30 bg-background px-5">
        <div
          className="flex items-center justify-between h-14"
          style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
        >
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center justify-center w-8 h-8 rounded-lg"
            aria-label="대시보드"
          >
            <LayoutGrid className="w-5 h-5 text-foreground" />
          </button>
          <button
            onClick={() => router.push('/settings')}
            className="flex items-center justify-center w-8 h-8 rounded-lg"
            aria-label="설정"
          >
            <Settings className="w-5 h-5 text-foreground" />
          </button>
        </div>
      </div>

      <div className="px-5 flex flex-col gap-3 mt-2">
        {/* 달력 카드 */}
        <div className="bg-surface rounded-2xl overflow-hidden">
          <MonthlyCalendar
            onMonthChange={(y, m) => { setCalYear(y); setCalMonth(m) }}
            onDaySelect={(y, m, d) => { setCalYear(y); setCalMonth(m); setSelectedDay(d) }}
            onTransactionClick={tx => { setEditTx(tx); setModalOpen(true) }}
            refreshKey={refreshKey}
          />
        </div>

        {/* 일별 거래 내역 카드 */}
        <div className="bg-surface rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <p className="text-[15px] font-semibold">{selectedDateLabel}</p>
          </div>
          <DayTransactions
            date={selectedDate}
            refreshKey={refreshKey}
            onEdit={tx => { setEditTx(tx); setModalOpen(true) }}
          />
        </div>
      </div>

      <AddTransactionModal
        open={modalOpen}
        initialDate={selectedDate}
        editTransaction={editTx}
        onClose={() => {
          setModalOpen(false)
          setEditTx(null)
          setRefreshKey(k => k + 1)
        }}
        onSave={() => {}}
      />

      {!modalOpen && (
        <BottomNav onAdd={() => { setEditTx(null); setModalOpen(true) }} />
      )}
    </PullToRefresh>
  )
}
