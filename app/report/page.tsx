'use client'

import { useState, useEffect } from 'react'
import {
  XAxis, YAxis, ResponsiveContainer,
  LineChart, Line, CartesianGrid, Tooltip,
} from 'recharts'
import { BottomNav } from '@/components/bottom-nav'
import { TopHeader } from '@/components/top-header'
import type { Transaction, Category } from '@/lib/api'

// ─── constants ────────────────────────────────────────
const CAT_COLORS = ['#CF6679', '#5865F2', '#43B581', '#7289DA', '#9B59B6', '#1ABC9C', '#E67E22', '#2ECC71']

// ─── helpers ──────────────────────────────────────────

function fmt(n: number) {
  return `₩${n.toLocaleString()}`
}

function monthLabel(_year: number, month: number) {
  return `${month}월`
}

function getMonthKey(date: string) {
  return date.slice(0, 7)
}

// ─── accordion card ───────────────────────────────────

function Card({
  header,
  children,
  defaultOpen = false,
}: {
  header: (open: boolean) => React.ReactNode
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="bg-surface rounded-[18px] px-5 py-4 mb-3">
      <button
        type="button"
        className="w-full flex items-center justify-between"
        onClick={() => setOpen(o => !o)}
      >
        {header(open)}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`}><path d="m6 9 6 6 6-6" /></svg>
      </button>
      {open && <div className="mt-4">{children}</div>}
    </div>
  )
}

// ─── component ────────────────────────────────────────

export default function Report() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [trendMode, setTrendMode] = useState<'expense' | 'income' | 'all'>('expense')

  useEffect(() => {
    ;(async () => {
      try {
        const { getTransactions, getCategories } = await import('@/lib/api')
        const [txs, cats] = await Promise.all([getTransactions({}), getCategories()])
        setTransactions(txs)
        setCategories(cats)
      } catch (e) {
        console.error('리포트 데이터 로드 실패:', e)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const catMap = Object.fromEntries(categories.map(c => [c.id, c]))

  function getCatRootName(catId: string): string {
    const cat = catMap[catId]
    if (!cat) return '기타'
    if (cat.parent_id) {
      const parent = catMap[cat.parent_id]
      return parent?.name || cat.name
    }
    return cat.name
  }

  const now = new Date()
  const curYear = now.getFullYear()
  const curMonth = now.getMonth() + 1

  // ─── 월별 집계 ───────────────────────────────────────
  type MonthBucket = { income: number; expense: number }
  const monthlyMap = new Map<string, MonthBucket>()

  for (const tx of transactions) {
    const key = getMonthKey(tx.date)
    if (!monthlyMap.has(key)) monthlyMap.set(key, { income: 0, expense: 0 })
    const b = monthlyMap.get(key)!
    if (tx.type === 'income') b.income += tx.amount
    else if (tx.type === 'expense') b.expense += tx.amount
  }

  const curKey = `${curYear}-${String(curMonth).padStart(2, '0')}`
  const prevMonth = curMonth === 1 ? 12 : curMonth - 1
  const prevYear = curMonth === 1 ? curYear - 1 : curYear
  const prevKey = `${prevYear}-${String(prevMonth).padStart(2, '0')}`

  const curData = monthlyMap.get(curKey) || { income: 0, expense: 0 }
  const prevData = monthlyMap.get(prevKey) || { income: 0, expense: 0 }

  function changeRate(cur: number, prev: number) {
    if (prev === 0) return cur > 0 ? { pct: 100, dir: 'up' as const } : { pct: 0, dir: 'same' as const }
    const pct = Math.round(((cur - prev) / prev) * 100)
    return { pct: Math.abs(pct), dir: pct > 0 ? 'up' as const : pct < 0 ? 'down' as const : 'same' as const }
  }

  const expChange = changeRate(curData.expense, prevData.expense)
  const incChange = changeRate(curData.income, prevData.income)

  // ─── 최근 6개월 데이터 ────────────────────────────────
  const last6: { label: string; expense: number; income: number; key: string }[] = []
  for (let i = 5; i >= 0; i--) {
    let m = curMonth - i
    let y = curYear
    if (m <= 0) { m += 12; y -= 1 }
    const key = `${y}-${String(m).padStart(2, '0')}`
    const bucket = monthlyMap.get(key)
    last6.push({ label: monthLabel(y, m), expense: bucket?.expense || 0, income: bucket?.income || 0, key })
  }

  // ─── 카테고리별 지출 (이번 달, 1depth) ────────────────
  const catExpenseByName = new Map<string, number>()
  for (const tx of transactions) {
    if (tx.type !== 'expense') continue
    if (getMonthKey(tx.date) !== curKey) continue
    const name = getCatRootName(tx.category_id)
    catExpenseByName.set(name, (catExpenseByName.get(name) || 0) + tx.amount)
  }
  const catExpenseSorted = [...catExpenseByName.entries()]
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount)
  const catExpenseTotal = catExpenseSorted.reduce((s, c) => s + c.amount, 0)

  // 전체 기간 TOP 5 카테고리 (고정 색상)
  const allCatExpense = new Map<string, number>()
  for (const tx of transactions) {
    if (tx.type !== 'expense') continue
    const name = getCatRootName(tx.category_id)
    allCatExpense.set(name, (allCatExpense.get(name) || 0) + tx.amount)
  }
  const top5 = [...allCatExpense.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name], i) => ({ name, color: CAT_COLORS[i % CAT_COLORS.length] }))
  const top5Names = new Set(top5.map(t => t.name))

  // 스택 바 데이터
  const stackData = last6.map(({ label, key }) => {
    const monthTxs = transactions.filter(tx => tx.type === 'expense' && getMonthKey(tx.date) === key)
    const catAmounts: Record<string, number> = {}
    let others = 0
    for (const tx of monthTxs) {
      const name = getCatRootName(tx.category_id)
      if (top5Names.has(name)) catAmounts[name] = (catAmounts[name] || 0) + tx.amount
      else others += tx.amount
    }
    return { label, ...catAmounts, _others: others, total: monthTxs.reduce((s, t) => s + t.amount, 0), key }
  })

  // ─── 카테고리별 수입 (이번 달, 1depth) ────────────────
  const catIncomeByName = new Map<string, number>()
  for (const tx of transactions) {
    if (tx.type !== 'income') continue
    if (getMonthKey(tx.date) !== curKey) continue
    const name = getCatRootName(tx.category_id)
    catIncomeByName.set(name, (catIncomeByName.get(name) || 0) + tx.amount)
  }
  const catIncomeSorted = [...catIncomeByName.entries()]
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount)
  const catIncomeTotal = catIncomeSorted.reduce((s, c) => s + c.amount, 0)

  // ─── 연간 추이 (1~12월 전체, 데이터 있는 달만 값) ──────
  const yearlyData: { label: string; expense: number | null; income: number | null }[] = []
  for (let m = 1; m <= 12; m++) {
    const key = `${curYear}-${String(m).padStart(2, '0')}`
    const bucket = monthlyMap.get(key)
    const hasData = bucket && (bucket.income > 0 || bucket.expense > 0)
    yearlyData.push({
      label: `${m}월`,
      expense: hasData ? (bucket?.expense || 0) : null,
      income: hasData ? (bucket?.income || 0) : null,
    })
  }
  
  // 연간 합계
  const yearIncome = transactions.filter(t => t.type === 'income' && t.date.startsWith(String(curYear))).reduce((s, t) => s + t.amount, 0)
  const yearExpense = transactions.filter(t => t.type === 'expense' && t.date.startsWith(String(curYear))).reduce((s, t) => s + t.amount, 0)
  const yearBalance = yearIncome - yearExpense

  // ─── 순자산 추이 ──────────────────────────────────────
  const netWorthData: { label: string; value: number }[] = []
  let cumIncome = 0
  let cumExpense = 0

  for (const tx of transactions) {
    const txYear = parseInt(tx.date.slice(0, 4))
    if (txYear < curYear) {
      if (tx.type === 'income') cumIncome += tx.amount
      else if (tx.type === 'expense') cumExpense += tx.amount
    }
  }

  for (let m = 1; m <= 12; m++) {
    const key = `${curYear}-${String(m).padStart(2, '0')}`
    const bucket = monthlyMap.get(key)
    const hasData = bucket && (bucket.income > 0 || bucket.expense > 0)
    if (bucket) {
      cumIncome += bucket.income
      cumExpense += bucket.expense
    }
    netWorthData.push({ label: `${m}월`, value: hasData || m <= curMonth ? cumIncome - cumExpense : null as any })
  }

  const janValue = netWorthData[0]?.value || 0
  const nowValue = netWorthData[netWorthData.length - 1]?.value || 0
  const netDiff = nowValue - janValue

  // ─── loading ──────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-dvh bg-background pb-32">
        <div className="px-5">
          <TopHeader title="리포트" />
          <p className="text-sm text-center text-muted-foreground mt-20">불러오는 중…</p>
        </div>
        <BottomNav />
      </div>
    )
  }

  // ─── render ───────────────────────────────────────────
  return (
    <div className="min-h-dvh bg-background pb-32">
      <div className="sticky top-0 z-30 bg-background px-5 border-b border-border">
        <TopHeader title="리포트" />
      </div>

      <div className="px-5 mt-3">

        {/* ── 카드 3: 연간 추이 ──────────────────────── */}
        <Card
          header={() => (
            <div className="flex-1 text-left pr-1">
              <p className="text-sm font-semibold">{curYear}년 추이</p>
              <p className={`text-lg font-bold tabular-nums ${yearBalance >= 0 ? 'text-accent-blue' : 'text-accent-coral'}`}>
                {yearBalance >= 0 ? '+' : ''}{fmt(yearBalance)}
              </p>
            </div>
          )}
        >
          {/* 토글 pill */}
          <div className="flex gap-1 mb-4 bg-border rounded-full p-1 w-fit">
            {([['expense', '지출'], ['income', '수입'], ['all', '전체']] as const).map(([val, label]) => (
              <button
                key={val}
                type="button"
                className={`px-3 py-1 text-xs rounded-full transition-colors ${
                  trendMode === val
                    ? 'bg-surface text-foreground font-semibold'
                    : 'text-muted-foreground'
                }`}
                onClick={() => setTrendMode(val)}
              >
                {label}
              </button>
            ))}
          </div>

          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={yearlyData} margin={{ left: 0, right: 0, top: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f293780" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip
                formatter={(v, name) => [
                  fmt(Number(v)),
                  name === 'expense' ? '지출' : '수입',
                ]}
                contentStyle={{ background: '#141c28', border: 'none', borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: '#9ca3af' }}
              />
              {(trendMode === 'expense' || trendMode === 'all') && (
                <Line
                  type="monotone"
                  dataKey="expense"
                  stroke="#CF6679"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#CF6679' }}
                  activeDot={{ r: 5 }}
                />
              )}
              {(trendMode === 'income' || trendMode === 'all') && (
                <Line
                  type="monotone"
                  dataKey="income"
                  stroke="#5865F2"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#5865F2' }}
                  activeDot={{ r: 5 }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* ── 카드 1: N월 지출 ───────────────────────── */}
        <Card
          defaultOpen
          header={(open) => (
            <div className="flex-1 flex items-center justify-between pr-1">
              <div className="text-left">
                <p className="text-sm font-semibold">{curMonth}월 지출</p>
                <p className="text-lg font-bold tabular-nums text-accent-coral">{fmt(curData.expense)}</p>
              </div>
              {expChange.dir !== 'same' && (
                <span className={`text-xs ${expChange.dir === 'up' ? 'text-accent-coral' : 'text-accent-blue'}`}>
                  {expChange.dir === 'up' ? '↑' : '↓'} {expChange.pct}%
                </span>
              )}
            </div>
          )}
        >
          {/* 스택 바 차트 */}
          <div className="space-y-2 mb-4">
            {stackData.map((row) => {
              const isCurrent = row.key === curKey
              return (
                <div key={row.label} className={isCurrent ? 'opacity-100' : 'opacity-60'}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-muted-foreground w-8">{row.label}</span>
                    <span className="text-xs text-muted-foreground tabular-nums">{fmt(row.total)}</span>
                  </div>
                  <div className="h-5 rounded-full bg-border overflow-hidden flex">
                    {row.total > 0 && top5.map(({ name, color }) => {
                      const amount = (row as Record<string, unknown>)[name] as number || 0
                      if (amount === 0) return null
                      const pct = (amount / row.total) * 100
                      return (
                        <div
                          key={name}
                          style={{ width: `${pct}%`, backgroundColor: color }}
                          className="h-full"
                        />
                      )
                    })}
                    {row.total > 0 && row._others > 0 && (
                      <div
                        style={{ width: `${(row._others / row.total) * 100}%`, backgroundColor: '#4B5563' }}
                        className="h-full"
                      />
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* 범례 (TOP 5) */}
          <div className="space-y-2">
            {top5.map(({ name, color }) => {
              const curAmount = catExpenseByName.get(name) || 0
              const pct = catExpenseTotal > 0 ? Math.round((curAmount / catExpenseTotal) * 100) : 0
              return (
                <div key={name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                    <span className="text-sm">{name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {fmt(curAmount)} · {pct}%
                  </span>
                </div>
              )
            })}
          </div>
        </Card>

        {/* ── 카드 2: N월 수입 ───────────────────────── */}
        <Card
          header={(open) => (
            <div className="flex-1 flex items-center justify-between pr-1">
              <div className="text-left">
                <p className="text-sm font-semibold">{curMonth}월 수입</p>
                <p className="text-lg font-bold tabular-nums text-accent-blue">{fmt(curData.income)}</p>
              </div>
              {incChange.dir !== 'same' && (
                <span className={`text-xs ${incChange.dir === 'up' ? 'text-accent-blue' : 'text-accent-coral'}`}>
                  {incChange.dir === 'up' ? '↑' : '↓'} {incChange.pct}%
                </span>
              )}
            </div>
          )}
        >
          {/* 수입 6개월 막대 */}
          <div className="space-y-2 mb-4">
            {last6.map(({ label, income, key }) => {
              const maxIncome = Math.max(...last6.map(d => d.income), 1)
              const isCurrent = key === curKey
              return (
                <div key={label} className={isCurrent ? 'opacity-100' : 'opacity-60'}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-muted-foreground w-8">{label}</span>
                    <span className="text-xs text-muted-foreground tabular-nums">{fmt(income)}</span>
                  </div>
                  <div className="h-5 rounded-full bg-border overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(income / maxIncome) * 100}%`,
                        backgroundColor: '#5865F2',
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>

          {/* 수입 카테고리 리스트 */}
          <div className="space-y-2">
            {catIncomeSorted.map(({ name, amount }) => {
              const pct = catIncomeTotal > 0 ? Math.round((amount / catIncomeTotal) * 100) : 0
              return (
                <div key={name} className="flex items-center justify-between">
                  <span className="text-sm">{name}</span>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {fmt(amount)} · {pct}%
                  </span>
                </div>
              )
            })}
            {catIncomeSorted.length === 0 && (
              <p className="text-xs text-muted-foreground text-center">수입 데이터 없음</p>
            )}
          </div>
        </Card>

        {/* ── 카드 4: 순자산 추이 ─────────────────────── */}
        <Card
          header={() => (
            <div className="flex-1 text-left pr-1">
              <p className="text-sm font-semibold">순자산</p>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold tabular-nums">{fmt(nowValue)}</span>
                <span className={`text-xs ${netDiff >= 0 ? 'text-accent-blue' : 'text-accent-coral'}`}>
                  1월 대비 {netDiff >= 0 ? '+' : ''}{fmt(netDiff)}
                </span>
              </div>
            </div>
          )}
        >
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={netWorthData} margin={{ left: 0, right: 0, top: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f293780" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip
                formatter={(v) => [fmt(Number(v)), '순자산']}
                contentStyle={{ background: '#141c28', border: 'none', borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: '#9ca3af' }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#5865F2"
                strokeWidth={2}
                dot={{ r: 3, fill: '#5865F2' }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            1월 대비 {netDiff >= 0 ? '+' : ''}{fmt(netDiff)} 변동
          </p>
        </Card>

      </div>

      <BottomNav />
    </div>
  )
}
