'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { PullToRefresh } from '@/components/pull-to-refresh'
import { BottomNav } from '@/components/bottom-nav'
import { MonthlyCalendar } from '@/components/monthly-calendar'
import { AddTransactionModal } from '@/components/add-transaction-modal'
import { type Transaction } from '@/lib/api'
import { LayoutGrid, Settings, ChevronDown, ChevronUp } from 'lucide-react'

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
        내역이 없어요
      </p>
    )
  }

  return (
    <div className="flex flex-col">
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
            className="flex items-center justify-between py-3 px-5 cursor-pointer active:bg-muted/50 border-t border-border"
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
  const [txOpen, setTxOpen] = useState(true)
  const [dayTotal, setDayTotal] = useState(0)

  const selectedDate = toDateStr(calYear, calMonth, selectedDay)
  const selectedDateLabel = (() => {
    const d = new Date(calYear, calMonth - 1, selectedDay)
    return `${calMonth}월 ${selectedDay}일 ${DAY_NAMES[d.getDay()]}요일`
  })()

  // 선택 날짜 합계 로드
  useEffect(() => {
    ;(async () => {
      try {
        const { getTransactions } = await import('@/lib/api')
        const txs = await getTransactions({ year: calYear, month: calMonth })
        const dayTxs = txs.filter(t => t.date === selectedDate)
        const inc = dayTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
        const exp = dayTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
        setDayTotal(exp - inc) // 지출 기준 (+면 지출)
      } catch {}
    })()
  }, [selectedDate, calYear, calMonth, refreshKey])

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

  const goToday = useCallback(() => {
    setCalYear(today.getFullYear())
    setCalMonth(today.getMonth() + 1)
    setSelectedDay(today.getDate())
    setRefreshKey(k => k + 1)
  }, [today])

  return (
    <PullToRefresh
      className="min-h-dvh bg-background"
      onRefresh={async () => setRefreshKey(k => k + 1)}
    >
      {/* 상단 영역 (bg-background) */}
      <div className="bg-background">
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

        <div className="px-5">
          {/* 연월 타이틀 + 오늘 버튼 */}
          <div className="flex items-center justify-between mt-1 mb-4">
            <h1 className="text-[28px] font-bold">{calYear}년 {calMonth}월</h1>
            <button
              onClick={goToday}
              className="px-4 py-2 rounded-full bg-accent-blue text-white text-[14px] font-semibold"
            >
              오늘
            </button>
          </div>

          {/* 달력 */}
          <MonthlyCalendar
            showHeader={false}
            showDayDetail={false}
            onMonthChange={(y, m) => { setCalYear(y); setCalMonth(m) }}
            onDaySelect={(y, m, d) => { setCalYear(y); setCalMonth(m); setSelectedDay(d) }}
            onTransactionClick={tx => { setEditTx(tx); setModalOpen(true) }}
            refreshKey={refreshKey}
          />
        </div>
      </div>

      {/* 하단 영역 (bg-surface) */}
      <div className="bg-surface min-h-[50vh] pb-32">
        <div className="px-5 pt-4">
          {/* 날짜 헤더 + 거래 내역 */}
          <button
            onClick={() => setTxOpen(v => !v)}
            className="w-full flex items-center justify-between py-3"
          >
            <span className="text-[16px] font-semibold">{selectedDateLabel}</span>
            <div className="flex items-center gap-2">
              <span className={`text-[16px] font-bold tabular-nums ${
                dayTotal > 0 ? 'text-accent-coral' : dayTotal < 0 ? 'text-accent-blue' : 'text-muted-foreground'
              }`}>
                ₩{Math.abs(dayTotal).toLocaleString()}
              </span>
              {txOpen
                ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
                : <ChevronDown className="w-4 h-4 text-muted-foreground" />
              }
            </div>
          </button>

          {txOpen && (
            <>
              <div className="border-t border-border" />
              <DayTransactions
                date={selectedDate}
                refreshKey={refreshKey}
                onEdit={tx => { setEditTx(tx); setModalOpen(true) }}
              />
            </>
          )}
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
