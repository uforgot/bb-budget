'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { PullToRefresh } from '@/components/pull-to-refresh'
import { BottomNav } from '@/components/bottom-nav'
import { MonthlyCalendar } from '@/components/monthly-calendar'
import { AddTransactionModal } from '@/components/add-transaction-modal'
import { type Transaction } from '@/lib/api'
import { LayoutGrid, ChevronDown, ChevronUp } from 'lucide-react'

function toDateStr(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토']

function DayTransactions({ date, refreshKey, onEdit }: { date: string; refreshKey: number; onEdit: (tx: Transaction) => void }) {
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
        setTxs(all.filter(t => t.date === date).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()))
      } catch {}
    })()
  }, [date, refreshKey])

  if (txs.length === 0) {
    return <p className="text-[13px] text-muted-foreground text-center py-6">거래 내역이 없어요</p>
  }

  return (
    <div className="flex flex-col">
      {txs.map(tx => {
        const cat = catMap[tx.category_id]
        const catName = cat?.name || '기타'
        const parentCat = cat?.parent_id ? catMap[cat.parent_id] : null
        const colorClass = tx.type === 'savings' ? 'text-accent-mint' : tx.type === 'expense' ? 'text-accent-coral' : 'text-accent-blue'
        return (
          <div
            key={tx.id}
            onClick={() => onEdit(tx)}
            className="flex items-center justify-between py-2 px-5 cursor-pointer active:bg-surface"
          >
            <div className="flex items-center gap-3">
              <span className="text-xs bg-muted px-3 py-1.5 rounded-full">
                {parentCat ? (
                  <><span className="text-foreground">{parentCat.name}</span><span className="text-muted-foreground"> · {catName}</span></>
                ) : (
                  <span className="text-foreground">{catName}</span>
                )}
              </span>
              {tx.description && (
                <span className="text-[10px] text-muted-foreground line-clamp-2">{tx.description}</span>
              )}
            </div>
            <span className={`text-sm font-semibold tabular-nums ${colorClass}`}>
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
  const [selectedDay, setSelectedDay] = useState(today.getDate())
  const [calYear, setCalYear] = useState(today.getFullYear())
  const [calMonth, setCalMonth] = useState(today.getMonth() + 1)
  const [modalOpen, setModalOpen] = useState(false)
  const [editTx, setEditTx] = useState<Transaction | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [summaryOpen, setSummaryOpen] = useState(false)
  const [monthIncome, setMonthIncome] = useState(0)
  const [monthExpense, setMonthExpense] = useState(0)
  const [monthSavings, setMonthSavings] = useState(0)
  const [cashBalance, setCashBalance] = useState(0)
  const [dayNet, setDayNet] = useState(0)

  const selectedDate = toDateStr(calYear, calMonth, selectedDay)

  const loadSummary = useCallback(async () => {
    try {
      const { getTransactions } = await import('@/lib/api')
      const [all, txs] = await Promise.all([
        getTransactions({}),
        getTransactions({ year: calYear, month: calMonth }),
      ])
      setMonthIncome(txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0))
      setMonthExpense(txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0))
      setMonthSavings(txs.filter(t => t.type === 'savings').reduce((s, t) => s + t.amount, 0))
      const totalInc = all.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
      const totalExp = all.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
      const totalSav = all.filter(t => t.type === 'savings' && !t.end_date).reduce((s, t) => s + t.amount, 0)
      setCashBalance(totalInc - totalExp - totalSav)

      // 선택 날짜 일일 합산
      const dayStr = toDateStr(calYear, calMonth, selectedDay)
      const dayTxs = txs.filter(t => t.date === dayStr)
      const dInc = dayTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
      const dExp = dayTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
      setDayNet(dInc - dExp)
    } catch {}
  }, [calYear, calMonth, selectedDay])

  useEffect(() => {
    loadSummary()
    ;(async () => {
      try {
        const { confirmRecurringTransactions } = await import('@/lib/api')
        await confirmRecurringTransactions(today.getFullYear(), today.getMonth() + 1)
      } catch {}
    })()
  }, [loadSummary])

  const todayStr = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일 ${DAY_NAMES[today.getDay()]}요일`

  return (
    <PullToRefresh className="min-h-dvh bg-background pb-32" onRefresh={async () => { setRefreshKey(k => k + 1); loadSummary() }}>
      {/* 상단 바 */}
      <div className="sticky top-0 z-30 bg-background px-5">
        <div className="flex items-center justify-between h-14 pt-[env(safe-area-inset-top,0px)]">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center justify-center w-8 h-8 rounded-lg"
            aria-label="대시보드"
          >
            <LayoutGrid className="w-5 h-5 text-foreground" />
          </button>
          <div className="w-8" />
        </div>
      </div>

      <div className="px-5">
        {/* 수입/지출/저축 + 잔액 */}
        <div className="bg-surface rounded-2xl px-5 py-4 mb-3 mt-2">
          <button
            onClick={() => setSummaryOpen(prev => !prev)}
            className="w-full flex items-center justify-between py-2"
          >
            <span className="text-[16px] text-foreground font-bold">잔액</span>
            <div className="flex items-center gap-2">
              <span className="text-[16px] font-bold tabular-nums">
                ₩{cashBalance.toLocaleString()}
              </span>
              {summaryOpen ? (
                <ChevronUp className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
          </button>
          {summaryOpen && (
            <>
              <div className="border-t border-border mt-1 mb-3" />
              <div className="grid grid-cols-3 text-center">
                {[
                  { label: '수입', value: monthIncome, color: '#5865F2' },
                  { label: '지출', value: monthExpense, color: '#FF6B9D' },
                  { label: '저축', value: monthSavings, color: '#43B581' },
                ].map(({ label, value, color }, i, arr) => (
                  <div
                    key={label}
                    className={`py-1 ${
                      i < arr.length - 1 ? 'border-r border-border' : ''
                    }`}
                  >
                    <p className="text-[12px] text-muted-foreground mb-1">{label}</p>
                    <p className="text-[15px] font-semibold tabular-nums" style={{ color }}>
                      {value >= 100000000
                        ? `${Math.floor(value / 100000000)}억`
                        : value >= 10000
                        ? `${Math.floor(value / 10000).toLocaleString()}만`
                        : `₩${value.toLocaleString()}`}
                    </p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* 달력 카드 (접기/펼치기) */}
        <div className="bg-surface rounded-2xl mb-3 overflow-hidden">
          <button
            onClick={() => setCalendarOpen(prev => !prev)}
            className="w-full flex items-center justify-between px-5 py-4"
          >
            <span className="text-[16px] font-bold">
              {calendarOpen
                ? `${calYear}년 ${calMonth}월`
                : `${calMonth}월 ${selectedDay}일 ${DAY_NAMES[new Date(calYear, calMonth - 1, selectedDay).getDay()]}요일`
              }
            </span>
            <div className="flex items-center gap-2">
              {!calendarOpen && dayNet !== 0 && (
                <span className={`text-[16px] font-bold tabular-nums ${dayNet >= 0 ? 'text-accent-blue' : 'text-accent-coral'}`}>
                  ₩{Math.abs(dayNet).toLocaleString()}
                </span>
              )}
              {calendarOpen ? (
                <ChevronUp className="w-5 h-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              )}
            </div>
          </button>

          {calendarOpen && (
            <div className="px-2 pb-3">
              <MonthlyCalendar
                onMonthChange={(y, m, _inc, _exp) => { setCalYear(y); setCalMonth(m); loadSummary() }}
                onDaySelect={(y, m, d) => {
                  setCalYear(y); setCalMonth(m); setSelectedDay(d)
                  setCalendarOpen(false)
                }}
                onTransactionClick={(tx) => {
                  setEditTx(tx)
                  setModalOpen(true)
                }}
                refreshKey={refreshKey}
              />
            </div>
          )}
        </div>

        {/* 일별 거래 내역 (항상 표시) */}
        <DayTransactions date={selectedDate} refreshKey={refreshKey} onEdit={(tx) => { setEditTx(tx); setModalOpen(true) }} />
      </div>

      <AddTransactionModal
        open={modalOpen}
        initialDate={selectedDate}
        editTransaction={editTx}
        onClose={() => {
          setModalOpen(false)
          setEditTx(null)
          setRefreshKey(k => k + 1)
          loadSummary()
        }}
        onSave={() => {}}
      />

      {!modalOpen && <BottomNav onAdd={() => { setEditTx(null); setModalOpen(true) }} />}
    </PullToRefresh>
  )
}
