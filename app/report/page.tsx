'use client'

import { useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Cell, ResponsiveContainer, LabelList,
  LineChart, Line, CartesianGrid, Tooltip,
} from 'recharts'
import { BottomNav } from '@/components/bottom-nav'
import { TopHeader } from '@/components/top-header'
import type { Transaction, Category } from '@/lib/api'

// ─── helpers ───────────────────────────────────────────

function fmt(n: number) {
  return `₩${n.toLocaleString()}`
}

function monthLabel(year: number, month: number) {
  return `${month}월`
}

function getMonthKey(date: string) {
  return date.slice(0, 7) // "2026-03"
}

// ─── component ─────────────────────────────────────────

export default function Report() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

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

  const now = new Date()
  const curYear = now.getFullYear()
  const curMonth = now.getMonth() + 1

  // ─── 월별 집계 ─────────────────────────────────────
  type MonthBucket = { income: number; expense: number }
  const monthlyMap = new Map<string, MonthBucket>()

  for (const tx of transactions) {
    const key = getMonthKey(tx.date)
    if (!monthlyMap.has(key)) monthlyMap.set(key, { income: 0, expense: 0 })
    const b = monthlyMap.get(key)!
    if (tx.type === 'income') b.income += tx.amount
    else if (tx.type === 'expense') b.expense += tx.amount
  }

  // 이번 달 / 전월
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

  // ─── 최근 6개월 지출 추이 ──────────────────────────
  const last6: { label: string; expense: number; key: string }[] = []
  for (let i = 5; i >= 0; i--) {
    let m = curMonth - i
    let y = curYear
    if (m <= 0) { m += 12; y -= 1 }
    const key = `${y}-${String(m).padStart(2, '0')}`
    const bucket = monthlyMap.get(key)
    last6.push({ label: monthLabel(y, m), expense: bucket?.expense || 0, key })
  }

  // ─── 카테고리별 지출 ───────────────────────────────
  const catExpense = new Map<string, number>()
  for (const tx of transactions) {
    if (tx.type !== 'expense') continue
    if (getMonthKey(tx.date) !== curKey) continue
    const catId = tx.category_id
    catExpense.set(catId, (catExpense.get(catId) || 0) + tx.amount)
  }
  const catSorted = [...catExpense.entries()]
    .map(([id, amount]) => ({ name: catMap[id]?.name || '기타', amount }))
    .sort((a, b) => b.amount - a.amount)
  const catTotal = catSorted.reduce((s, c) => s + c.amount, 0)
  const catMax = catSorted[0]?.amount || 1

  // ─── 순자산 추이 (1월~현재) ────────────────────────
  const netWorthData: { label: string; value: number }[] = []
  let cumIncome = 0
  let cumExpense = 0

  // 현재 연도 이전의 모든 트랜잭션을 누적 시작값으로
  for (const tx of transactions) {
    const txYear = parseInt(tx.date.slice(0, 4))
    if (txYear < curYear) {
      if (tx.type === 'income') cumIncome += tx.amount
      else if (tx.type === 'expense') cumExpense += tx.amount
    }
  }

  for (let m = 1; m <= curMonth; m++) {
    const key = `${curYear}-${String(m).padStart(2, '0')}`
    const bucket = monthlyMap.get(key)
    if (bucket) {
      cumIncome += bucket.income
      cumExpense += bucket.expense
    }
    netWorthData.push({ label: `${m}월`, value: cumIncome - cumExpense })
  }

  const janValue = netWorthData[0]?.value || 0
  const nowValue = netWorthData[netWorthData.length - 1]?.value || 0
  const netDiff = nowValue - janValue

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

  return (
    <div className="min-h-dvh bg-background pb-32">
      <div className="sticky top-0 z-30 bg-background px-5 border-b border-border">
        <TopHeader title="리포트" />
      </div>

      <div className="px-5 mt-3">

        {/* ── 1. 이번 달 요약 ─────────────────────── */}
        <div className="flex gap-3 mb-4">
          <div className="flex-1 bg-surface rounded-[18px] px-4 py-3">
            <p className="text-xs text-muted-foreground mb-1">{curMonth}월 지출</p>
            <p className="text-[15px] font-semibold tabular-nums text-accent-coral">
              {fmt(curData.expense)}
            </p>
            {expChange.dir !== 'same' && (
              <p className={`text-xs mt-1 ${expChange.dir === 'up' ? 'text-accent-coral' : 'text-accent-blue'}`}>
                {expChange.dir === 'up' ? '↑' : '↓'} {expChange.pct}% vs 전월
              </p>
            )}
          </div>
          <div className="flex-1 bg-surface rounded-[18px] px-4 py-3">
            <p className="text-xs text-muted-foreground mb-1">{curMonth}월 수입</p>
            <p className="text-[15px] font-semibold tabular-nums text-accent-blue">
              {fmt(curData.income)}
            </p>
            {incChange.dir !== 'same' && (
              <p className={`text-xs mt-1 ${incChange.dir === 'up' ? 'text-accent-blue' : 'text-accent-coral'}`}>
                {incChange.dir === 'up' ? '↑' : '↓'} {incChange.pct}% vs 전월
              </p>
            )}
          </div>
        </div>

        {/* ── 2. 월별 지출 추이 (가로 막대) ──────── */}
        <section className="bg-surface rounded-[18px] px-5 py-4 mb-4">
          <h2 className="text-sm font-semibold mb-3">월별 지출 추이</h2>
          <ResponsiveContainer width="100%" height={last6.length * 40 + 8}>
            <BarChart data={last6} layout="vertical" margin={{ left: 0, right: 60, top: 0, bottom: 0 }}>
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="label" width={36} tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <Bar dataKey="expense" radius={[0, 6, 6, 0]} barSize={20}>
                {last6.map((entry) => (
                  <Cell
                    key={entry.key}
                    fill={entry.key === curKey ? '#CF6679' : '#CF667940'}
                  />
                ))}
                <LabelList
                  dataKey="expense"
                  position="right"
                  formatter={(v) => fmt(Number(v))}
                  style={{ fontSize: 11, fill: '#9ca3af' }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </section>

        {/* ── 3. 카테고리별 지출 (div 막대) ──────── */}
        <section className="bg-surface rounded-[18px] px-5 py-4 mb-4">
          <h2 className="text-sm font-semibold mb-3">{curMonth}월 카테고리별 지출</h2>
          {catSorted.length === 0 ? (
            <p className="text-xs text-muted-foreground">지출 내역이 없어요</p>
          ) : (
            <div className="space-y-3">
              {catSorted.map((cat) => {
                const pct = catTotal > 0 ? Math.round((cat.amount / catTotal) * 100) : 0
                const barWidth = Math.max((cat.amount / catMax) * 100, 2)
                return (
                  <div key={cat.name}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm">{cat.name}</span>
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {fmt(cat.amount)} · {pct}%
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-border overflow-hidden">
                      <div
                        className="h-full rounded-full bg-accent-coral"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* ── 4. 순자산 추이 (라인 차트) ─────────── */}
        <section className="bg-surface rounded-[18px] px-5 py-4 mb-4">
          <h2 className="text-sm font-semibold mb-1">순자산 추이</h2>
          <p className="text-xs text-muted-foreground mb-3">
            1월 대비 {netDiff >= 0 ? '+' : ''}{fmt(netDiff)} 변동
          </p>
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
        </section>

      </div>

      <BottomNav />
    </div>
  )
}
