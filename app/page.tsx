'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { PullToRefresh } from '@/components/pull-to-refresh'
import { BottomNav } from '@/components/bottom-nav'
import { MonthlyCalendar } from '@/components/monthly-calendar'
import { AddTransactionModal } from '@/components/add-transaction-modal'
import { type Transaction, type Category } from '@/lib/api'
import { LayoutGrid, Settings } from 'lucide-react'
import { DatePickerModal } from '@/components/date-picker-modal'

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토']

function toDateStr(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
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
  const [pickerOpen, setPickerOpen] = useState(false)
  const [calKey, setCalKey] = useState(0)
  const selectChangingRef = useRef(false) // select 변경 중 플래그

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
      <div className="sticky top-0 z-30 bg-background px-4">
          <div className="flex items-center justify-between h-14" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
            <button onClick={() => router.push('/dashboard')} className="flex items-center justify-center w-8 h-8 rounded-lg" aria-label="대시보드">
              <LayoutGrid className="w-5 h-5 text-foreground" />
            </button>
            <div className="flex items-center gap-1">
              <button onClick={() => router.push('/history?search=1')} className="flex items-center justify-center w-8 h-8 rounded-lg text-foreground" aria-label="검색">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
              </button>
              <button onClick={() => router.push('/settings')} className="flex items-center justify-center w-8 h-8 rounded-lg" aria-label="설정">
                <Settings className="w-5 h-5 text-foreground" />
              </button>
            </div>
          </div>
        </div>

        <div className="px-4">
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

      {/* 하단 영역 */}
      <div className="bg-background min-h-[50vh] pb-32">
        <div>
          {/* 날짜 요약 카드 — 지출/수입 2분할 */}
          <div className="mx-5 mt-3 flex gap-3">
            <div className="flex-1 bg-surface rounded-[22px] px-4 py-4">
              <p className="text-[14px] font-semibold text-muted-foreground mb-1">지출</p>
              <p className="text-[20px] font-bold tabular-nums text-[#5865F2]" style={{ letterSpacing: '-0.5px' }}>
                {`₩${dayExpense.toLocaleString()}`}
              </p>
            </div>
            <div className="flex-1 bg-surface rounded-[22px] px-4 py-4">
              <p className="text-[14px] font-semibold text-muted-foreground mb-1">수입</p>
              <p className="text-[20px] font-bold tabular-nums" style={{ letterSpacing: '-0.5px', color: '#14b8a6' }}>
                {`₩${dayIncome.toLocaleString()}`}
              </p>
            </div>
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
