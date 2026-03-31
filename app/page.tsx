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

  useEffect(() => {
    ;(async () => {
      try {
        const { getTransactions } = await import('@/lib/api')
        const d = new Date(date)
        const all = await getTransactions({ year: d.getFullYear(), month: d.getMonth() + 1 })
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
        const catName = (tx.category as any)?.name || ''
        const isIncome = tx.type === 'income'
        const isSavings = tx.type === 'savings'
        return (
          <button
            key={tx.id}
            onClick={() => onEdit(tx)}
            className="flex items-center justify-between py-3.5 border-b border-border last:border-0 text-left"
          >
            <div>
              <p className="text-[15px] font-semibold">{catName || '기타'}</p>
              {tx.description && (
                <p className="text-[13px] text-muted-foreground mt-0.5">{tx.description}</p>
              )}
            </div>
            <span className={`text-[16px] font-semibold tabular-nums ${isIncome ? 'text-[#5865F2]' : isSavings ? 'text-[#43B581]' : 'text-[#FF6B9D]'}`}>
              {isIncome ? '+' : '-'}₩{tx.amount.toLocaleString()}
            </span>
          </button>
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
  const [monthIncome, setMonthIncome] = useState(0)
  const [monthExpense, setMonthExpense] = useState(0)
  const [monthSavings, setMonthSavings] = useState(0)
  const [cashBalance, setCashBalance] = useState(0)

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
    } catch {}
  }, [calYear, calMonth])

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
          {[
            { label: '수입', value: monthIncome, color: '#5865F2' },
            { label: '지출', value: monthExpense, color: '#FF6B9D' },
            { label: '저축', value: monthSavings, color: '#43B581' },
          ].map(({ label, value, color }) => (
            <div key={label} className="flex items-center justify-between py-2">
              <span className="text-[14px] text-foreground">{label}</span>
              <span className="text-[14px] font-semibold tabular-nums" style={{ color }}>
                ₩{value.toLocaleString()}
              </span>
            </div>
          ))}
          <div className="border-t border-border my-1" />
          <div className="flex items-center justify-between py-2">
            <span className="text-[14px] text-foreground font-semibold">잔액</span>
            <span className="text-[14px] font-bold tabular-nums">
              ₩{cashBalance.toLocaleString()}
            </span>
          </div>
        </div>

        {/* 달력 접기/펼치기 버튼 */}
        <button
          onClick={() => setCalendarOpen(prev => !prev)}
          className="w-full flex items-center justify-center gap-1.5 py-2 mb-3 text-muted-foreground"
        >
          <span className="text-[14px] font-medium">
            {calMonth}월 {selectedDay}일 ({DAY_NAMES[new Date(calYear, calMonth - 1, selectedDay).getDay()]})
          </span>
          {calendarOpen ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>

        {/* 달력 (펼쳤을 때만) */}
        {calendarOpen && (
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
        )}

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
