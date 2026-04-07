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
  const [pickerOpen, setPickerOpen] = useState(false)
  const [calKey, setCalKey] = useState(0)
  const selectChangingRef = useRef(false) // select 변경 중 플래그

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
              showDayDetail
              dayDetailMode="sheet"
              targetYear={calYear}
              targetMonth={calMonth}
              onMonthChange={handleMonthChange}
              onDaySelect={handleDaySelect}
              onTransactionClick={tx => { setEditTx(tx); setModalOpen(true) }}
              refreshKey={refreshKey}
            />
          </div>
        </div>

      <div className="pb-32" />

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
