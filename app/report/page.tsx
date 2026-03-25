'use client'

import { useState, useEffect } from 'react'
import {
  XAxis, YAxis, ResponsiveContainer,
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

  // 1depth 카테고리명 가져오기 (parent가 있으면 parent 이름)
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
  // 1depth 기준 합산
  const catExpenseByName = new Map<string, number>()
  for (const tx of transactions) {
    if (tx.type !== 'expense') continue
    if (getMonthKey(tx.date) !== curKey) continue
    const name = getCatRootName(tx.category_id)
    catExpenseByName.set(name, (catExpenseByName.get(name) || 0) + tx.amount)
  }
  const catSorted = [...catExpenseByName.entries()]
    .map(([name, amount]) => ({ name, amount }))
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

        {/* ── 2. 월별 카테고리 지출 (스택 바 + 범례) ──────── */}
        <section className="bg-surface rounded-[18px] px-5 py-4 mb-4">
          <h2 className="text-sm font-semibold mb-3">월별 카테고리별 지출</h2>
          {(() => {
            const CAT_COLORS = ['#CF6679', '#5865F2', '#43B581', '#7289DA', '#9B59B6', '#1ABC9C', '#E67E22', '#2ECC71']

            // 전체 기간 TOP 5 카테고리 (고정 색상 배정)
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
            const colorMap = Object.fromEntries(top5.map(t => [t.name, t.color]))

            // 최근 6개월 스택 데이터
            const stackData = last6.map(({ label, key }) => {
              const monthTxs = transactions.filter(tx => tx.type === 'expense' && getMonthKey(tx.date) === key)
              const catAmounts: Record<string, number> = {}
              let others = 0
              for (const tx of monthTxs) {
                const name = getCatRootName(tx.category_id)
                if (top5Names.has(name)) catAmounts[name] = (catAmounts[name] || 0) + tx.amount
                else others += tx.amount
              }
              return { label, ...catAmounts, _others: others, total: monthTxs.reduce((s, t) => s + t.amount, 0) }
            })

            return (
              <>
                {/* 스택 바 차트 */}
                <div className="space-y-2 mb-4">
                  {stackData.map((row) => (
                    <div key={row.label}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-muted-foreground w-8">{row.label}</span>
                        <span className="text-xs text-muted-foreground tabular-nums">{fmt(row.total)}</span>
                      </div>
                      <div className="h-5 rounded-full bg-border overflow-hidden flex">
                        {row.total > 0 && top5.map(({ name, color }) => {
                          const amount = (row as any)[name] || 0
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
                        {row.total > 0 && (row as any)['_others'] > 0 && (
                          <div
                            style={{ width: `${((row as any)['_others'] / row.total) * 100}%`, backgroundColor: '#4B5563' }}
                            className="h-full"
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* 범례 (TOP 5) */}
                <div className="space-y-2">
                  {top5.map(({ name, color }) => {
                    const curAmount = catExpenseByName.get(name) || 0
                    const pct = catTotal > 0 ? Math.round((curAmount / catTotal) * 100) : 0
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
              </>
            )
          })()}
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
