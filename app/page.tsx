'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { PullToRefresh } from '@/components/pull-to-refresh'
import { BottomNav } from '@/components/bottom-nav'
import { MonthlyCalendar } from '@/components/monthly-calendar'
import { AddTransactionModal } from '@/components/add-transaction-modal'
import { type Transaction } from '@/lib/api'
import { LayoutGrid, Settings, ChevronDown, ChevronUp, ChevronRight } from 'lucide-react'
import { DatePickerModal } from '@/components/date-picker-modal'

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
  const [pickerOpen, setPickerOpen] = useState(false)
  const [calKey, setCalKey] = useState(0) // select로 정확히 이동할 때만 돌림

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
                <select value={calYear} onChange={e => { setCalYear(Number(e.target.value)); setCalKey(k => k+1) }} className="appearance-none bg-transparent text-foreground text-[28px] font-bold outline-none cursor-pointer">
                  {Array.from({length:20},(_,i)=>new Date().getFullYear()-5+i).map(y=><option key={y} value={y}>{y}년</option>)}
                </select>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-foreground/60 flex-shrink-0"><path d="m6 9 6 6 6-6"/></svg>
              </label>
              <label className="flex items-center gap-0 cursor-pointer">
                <select value={calMonth} onChange={e => { setCalMonth(Number(e.target.value)); setCalKey(k => k+1) }} className="appearance-none bg-transparent text-foreground text-[28px] font-bold outline-none cursor-pointer">
                  {Array.from({length:12},(_,i)=>i+1).map(m=><option key={m} value={m}>{m}월</option>)}
                </select>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-foreground/60 flex-shrink-0"><path d="m6 9 6 6 6-6"/></svg>
              </label>
            </div>
            <button onClick={goToday} className="px-4 py-2 rounded-full bg-accent-blue text-white text-[14px] font-semibold">오늘</button>
          </div>
          {/* 달력 */}
          <div className="pb-6">
          <MonthlyCalendar
            key={calKey}
            showHeader={false}
            showDayDetail={false}
            onMonthChange={(y, m) => { setCalYear(y); setCalMonth(m) }}
            onDaySelect={(y, m, d) => { setCalYear(y); setCalMonth(m); setSelectedDay(d) }}
            onTransactionClick={tx => { setEditTx(tx); setModalOpen(true) }}
            refreshKey={refreshKey}
          />
          </div>
        </div>

      {/* 하단 영역 */}
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
