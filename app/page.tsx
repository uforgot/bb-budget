'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { PullToRefresh } from '@/components/pull-to-refresh'
import { BottomNav } from '@/components/bottom-nav'
import { MonthlyCalendar } from '@/components/monthly-calendar'
import { AddTransactionModal } from '@/components/add-transaction-modal'
import { TxRow } from '@/components/tx-row'
import { type Transaction, type Category } from '@/lib/api'
import { LayoutGrid, Settings } from 'lucide-react'
import { DatePickerModal } from '@/components/date-picker-modal'

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토']

function toDateStr(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function DayTransactions({
  date,
  refreshKey,
  categories,
  onEdit,
  onDeleted,
}: {
  date: string
  refreshKey: number
  categories: Category[]
  onEdit: (tx: Transaction) => void
  onDeleted: () => void
}) {
  const [txs, setTxs] = useState<Transaction[]>([])

  useEffect(() => {
    ;(async () => {
      try {
        const { getTransactions } = await import('@/lib/api')
        const d = new Date(date)
        const all = await getTransactions({ year: d.getFullYear(), month: d.getMonth() + 1 })
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
      {txs.map((tx, i) => (
        <TxRow
          key={tx.id}
          tx={tx}
          categories={categories}
          showDate={false}
          dateLabel={i === 0 ? '상세' : undefined}
          showDescription
          onEdit={onEdit}
          onDeleted={onDeleted}
        />
      ))}
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
  const [dayIncome, setDayIncome] = useState(0)
  const [dayExpense, setDayExpense] = useState(0)
  const [categories, setCategories] = useState<Category[]>([])
  const [pickerOpen, setPickerOpen] = useState(false)
  const [calKey, setCalKey] = useState(0)
  const selectChangingRef = useRef(false) // select 변경 중 플래그

  const selectedDate = toDateStr(calYear, calMonth, selectedDay)
  const selectedDateLabel = (() => {
    const d = new Date(calYear, calMonth - 1, selectedDay)
    return `${calMonth}월 ${selectedDay}일 ${DAY_NAMES[d.getDay()]}요일`
  })()

  // 카테고리 로드 (1회)
  useEffect(() => {
    ;(async () => {
      try {
        const { getCategories } = await import('@/lib/api')
        setCategories(await getCategories())
      } catch {}
    })()
  }, [])

  // 선택 날짜 합계 로드
  useEffect(() => {
    ;(async () => {
      try {
        const { getTransactions } = await import('@/lib/api')
        const txs = await getTransactions({ year: calYear, month: calMonth })
        const dayTxs = txs.filter(t => t.date === selectedDate)
        setDayIncome(dayTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0))
        setDayExpense(dayTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0))
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

  const handleMonthChange = useCallback((y: number, m: number) => {
    // select 변경 중이면 캘린더의 onMonthChange 무시
    if (selectChangingRef.current) return
    setCalYear(y); setCalMonth(m)
  }, [])
  const handleDaySelect = useCallback((y: number, m: number, d: number) => {
    setCalYear(y); setCalMonth(m); setSelectedDay(d)
  }, [])

  const goToday = useCallback(() => {
    setCalYear(today.getFullYear())
    setCalMonth(today.getMonth() + 1)
    setSelectedDay(today.getDate())
    setCalKey(k => k + 1)
  }, [today])

  return (
    <PullToRefresh
      className="min-h-dvh bg-background pb-32"
      onRefresh={async () => setRefreshKey(k => k + 1)}
    >
      {/* 상단 바 */}
      <div className="sticky top-0 z-30 bg-background px-5">
          <div className="flex items-center justify-between h-14" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
            <button onClick={() => router.push('/dashboard')} className="flex items-center justify-center w-8 h-8 rounded-lg" aria-label="대시보드">
              <LayoutGrid className="w-5 h-5 text-foreground" />
            </button>
            <div className="flex items-center gap-1">
              <button onClick={() => router.push('/history?search=1')} className="flex items-center justify-center w-8 h-8 rounded-lg text-muted-foreground" aria-label="검색">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
              </button>
              <button onClick={() => router.push('/settings')} className="flex items-center justify-center w-8 h-8 rounded-lg" aria-label="설정">
                <Settings className="w-5 h-5 text-foreground" />
              </button>
            </div>
          </div>
        </div>

        <div className="px-5">
          {/* 연월 타이틀 + 오늘 */}
          <div className="flex items-center justify-between mt-1 mb-4">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1 cursor-pointer">
                <select value={calYear} onChange={e => { selectChangingRef.current = true; setCalYear(Number(e.target.value)); setCalKey(k => k+1); setTimeout(() => { selectChangingRef.current = false }, 500) }} className="appearance-none bg-transparent text-foreground text-[28px] font-bold outline-none cursor-pointer" style={{ letterSpacing: '-1px' }}>
                  {Array.from({length:20},(_,i)=>new Date().getFullYear()-5+i).map(y=><option key={y} value={y}>{y}년</option>)}
                </select>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-foreground/60 flex-shrink-0"><path d="m6 9 6 6 6-6"/></svg>
              </label>
              <label className="flex items-center cursor-pointer">
                <select value={calMonth} onChange={e => { selectChangingRef.current = true; setCalMonth(Number(e.target.value)); setCalKey(k => k+1); setTimeout(() => { selectChangingRef.current = false }, 500) }} className="appearance-none bg-transparent text-foreground text-[28px] font-bold outline-none cursor-pointer" style={{ letterSpacing: '-1px' }}>
                  {Array.from({length:12},(_,i)=>i+1).map(m=><option key={m} value={m}>{m}월</option>)}
                </select>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-foreground/60 flex-shrink-0 -ml-1.5"><path d="m6 9 6 6 6-6"/></svg>
              </label>
            </div>
            <button onClick={goToday} className="px-4 py-2 rounded-full bg-accent-blue text-white text-[14px] font-semibold">오늘</button>
          </div>
          {/* 달력 카드 */}
          <div>
            <div className="bg-surface rounded-2xl px-3 pt-4 pb-6">
              <MonthlyCalendar
                key={calKey}
                showHeader={false}
                showDayDetail={false}
                targetYear={calYear}
                targetMonth={calMonth}
                onMonthChange={handleMonthChange}
                onDaySelect={handleDaySelect}
                onTransactionClick={tx => { setEditTx(tx); setModalOpen(true) }}
                refreshKey={refreshKey}
              />
            </div>
          </div>
        </div>

      {/* 하단 영역 */}
      <div className="bg-background min-h-[50vh] pb-32">
        <div>
          {/* 날짜 요약 카드 */}
          {(() => {
            const net = dayIncome - dayExpense
            const netColor = 'text-foreground'
            return (
              <div className="mx-5 mb-3 mt-4 bg-surface rounded-2xl px-5 py-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[14px] font-semibold">{selectedDateLabel}</span>
                  <span className={`text-[15px] font-bold tabular-nums ${netColor}`}>
                    {net >= 0 ? '+' : '-'}₩{Math.abs(net).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[13px] text-muted-foreground">지출</span>
                  <span className="text-[13px] font-semibold tabular-nums text-[#5865F2]">₩{dayExpense.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[13px] text-muted-foreground">수입</span>
                  <span className="text-[13px] font-semibold tabular-nums text-accent-blue">₩{dayIncome.toLocaleString()}</span>
                </div>
              </div>
            )
          })()}

          {/* 내역 */}
          <div className="px-5">
            <DayTransactions
              date={selectedDate}
              refreshKey={refreshKey}
              categories={categories}
              onEdit={tx => { setEditTx(tx); setModalOpen(true) }}
              onDeleted={() => setRefreshKey(k => k + 1)}
            />
          </div>
        </div>
      </div>

      <DatePickerModal
        open={pickerOpen}
        mode="month"
        year={calYear}
        month={calMonth}
        onClose={() => setPickerOpen(false)}
        onSelect={(y, m) => { setCalYear(y); setCalMonth(m) }}
      />

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
