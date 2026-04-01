'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { PullToRefresh } from '@/components/pull-to-refresh'
import { BottomNav } from '@/components/bottom-nav'
import { MonthlyCalendar } from '@/components/monthly-calendar'
import { AddTransactionModal } from '@/components/add-transaction-modal'
import { type Transaction } from '@/lib/api'
import { LayoutGrid, ChevronDown, ChevronUp, Settings } from 'lucide-react'

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
  const [dayNet, setDayNet] = useState(0)

  const selectedDate = toDateStr(calYear, calMonth, selectedDay)

  const loadSummary = useCallback(async () => {
    try {
      const { getTransactions } = await import('@/lib/api')
      const txs = await getTransactions({ year: calYear, month: calMonth })
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
        {/* 이번 주 + 전체 달력 카드 */}
        {(() => {
          const todayDate = new Date(calYear, calMonth - 1, today.getDate())
          const dow = todayDate.getDay() // 0=일
          // 이번 주 일요일부터 토요일
          const weekDates = Array.from({ length: 7 }, (_, i) => {
            const d = new Date(todayDate)
            d.setDate(todayDate.getDate() - dow + i)
            return d
          })
          return (
            <div className="bg-surface rounded-2xl mb-3 mt-2 overflow-hidden">
              {/* 월 헤더 */}
              <div className="flex items-center justify-between px-5 pt-4 pb-2">
                <span className="text-[18px] font-bold">{calMonth}월</span>
              </div>
              {/* 요일 헤더 */}
              <div className="grid grid-cols-7 px-3 mb-1">
                {['일', '월', '화', '수', '목', '금', '토'].map((d, i) => (
                  <div key={d} className={`text-center text-[12px] font-medium py-1 ${
                    i === 0 ? 'text-accent-coral' : i === 6 ? 'text-accent-blue' : 'text-muted-foreground'
                  }`}>{d}</div>
                ))}
              </div>
              {/* 이번 주 날짜 */}
              <div className="grid grid-cols-7 px-3 pb-2">
                {weekDates.map((d, i) => {
                  const isToday = d.getDate() === today.getDate() &&
                    d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear()
                  const isSelected = d.getDate() === selectedDay &&
                    d.getMonth() + 1 === calMonth && d.getFullYear() === calYear
                  const isOtherMonth = d.getMonth() + 1 !== calMonth
                  return (
                    <button
                      key={i}
                      onClick={() => { setCalYear(d.getFullYear()); setCalMonth(d.getMonth() + 1); setSelectedDay(d.getDate()) }}
                      className="flex items-center justify-center h-10"
                    >
                      <span className={`w-8 h-8 flex items-center justify-center rounded-full text-[16px] font-medium ${
                        isToday
                          ? 'bg-accent-blue text-white'
                          : isSelected
                          ? 'bg-muted'
                          : isOtherMonth
                          ? 'text-muted-foreground/40'
                          : i === 0 ? 'text-accent-coral' : i === 6 ? 'text-accent-blue' : 'text-foreground'
                      }`}>
                        {d.getDate()}
                      </span>
                    </button>
                  )
                })}
              </div>
              {/* 나머지 주 인라인 (calendarOpen) */}
              {calendarOpen && (() => {
                const firstDay = new Date(calYear, calMonth - 1, 1).getDay()
                const daysInMonth = new Date(calYear, calMonth, 0).getDate()
                // 전체 달력 그리드용 셨 배열 (첫 주요일을 일요일로)
                const cells: (number | null)[] = [
                  ...Array(firstDay).fill(null),
                  ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
                ]
                // 이번 주에 속한 달 첫째 날 구하기
                const todayDow = new Date(calYear, calMonth - 1, today.getDate()).getDay()
                const weekStart = today.getDate() - todayDow
                // 첫째 주만 오늘부터 그리는지 확인
                const currentWeekRow = Math.floor((firstDay + today.getDate() - 1) / 7)
                const rowsToRender = Array.from({ length: Math.ceil(cells.length / 7) }, (_, row) => row)
                  .filter(row => row !== currentWeekRow) // 이번 주 제외
                return (
                  <div className="px-3 pb-3">
                    {rowsToRender.map(row => (
                      <div key={row} className="grid grid-cols-7">
                        {cells.slice(row * 7, row * 7 + 7).map((day, i) => (
                          <button
                            key={i}
                            disabled={!day}
                            onClick={() => day && setSelectedDay(day)}
                            className="flex items-center justify-center h-10"
                          >
                            {day && (
                              <span className={`w-8 h-8 flex items-center justify-center rounded-full text-[16px] font-medium ${
                                day === today.getDate() && calMonth === today.getMonth() + 1 && calYear === today.getFullYear()
                                  ? 'bg-accent-blue text-white'
                                  : day === selectedDay
                                  ? 'bg-muted'
                                  : (row * 7 + i) % 7 === 0 ? 'text-accent-coral'
                                  : (row * 7 + i) % 7 === 6 ? 'text-accent-blue'
                                  : 'text-foreground'
                              }`}>
                                {day}
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                )
              })()}
              {/* 아래꺽쇠 — 전체 달력 토글 */}
              <button
                onClick={() => setCalendarOpen(prev => !prev)}
                className="w-full flex items-center justify-center py-2 border-t border-border"
              >
                {calendarOpen
                  ? <ChevronUp className="w-5 h-5 text-muted-foreground" />
                  : <ChevronDown className="w-5 h-5 text-muted-foreground" />
                }
              </button>
            </div>
          )
        })()}

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
