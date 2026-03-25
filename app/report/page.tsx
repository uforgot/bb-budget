'use client'

import { useState, useEffect } from 'react'
import {
  XAxis, YAxis, ResponsiveContainer,
  LineChart, Line, CartesianGrid, Tooltip,
  BarChart, Bar,
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
    <div className="bg-surface rounded-[18px] px-5 py-5 mb-3">
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
  const [trendMode, setTrendMode] = useState<'expense' | 'income' | 'all'>('all')
  const [expMonthOffset, setExpMonthOffset] = useState(0)
  const [incMonthOffset, setIncMonthOffset] = useState(0)

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

  /** 2depth 카테고리 표시명: "부모 · 자식" 또는 1depth 이름 */
  function get2depthCatName(catId: string): string {
    const cat = catMap[catId]
    if (!cat) return '기타'
    if (cat.parent_id) {
      const parent = catMap[cat.parent_id]
      return parent ? `${parent.name} · ${cat.name}` : cat.name
    }
    return cat.name
  }

  /** 2depth TOP 5 연간 라인 차트 데이터 */
  function get2depthTop5LineData(type: 'expense' | 'income', selectedMonthKey: string) {
    // 카테고리별 월별 집계 (2depth 기준 = category_id 그대로)
    const byCat = new Map<string, Map<number, number>>()
    for (const tx of transactions) {
      if (tx.type !== type) continue
      const txYear = parseInt(tx.date.slice(0, 4))
      if (txYear !== curYear) continue
      const txMonth = parseInt(tx.date.slice(5, 7))
      const catId = tx.category_id
      if (!byCat.has(catId)) byCat.set(catId, new Map())
      const monthMap = byCat.get(catId)!
      monthMap.set(txMonth, (monthMap.get(txMonth) || 0) + tx.amount)
    }

    // 연간 총액 기준 TOP 5 (월 이동해도 고정)
    const selectedMonth = parseInt(selectedMonthKey.slice(5, 7))
    const ranked = [...byCat.entries()]
      .map(([catId, monthMap]) => {
        let yearTotal = 0
        monthMap.forEach(v => yearTotal += v)
        return {
          catId,
          name: get2depthCatName(catId),
          selectedAmount: monthMap.get(selectedMonth) || 0,
          yearTotal,
          monthMap,
        }
      })
      .filter(c => c.yearTotal > 0)
      .sort((a, b) => b.yearTotal - a.yearTotal)
      .slice(0, 5)

    // 라인 차트 데이터: 1~12월
    const chartData: Record<string, unknown>[] = []
    for (let m = 1; m <= 12; m++) {
      const row: Record<string, unknown> = { label: `${m}월` }
      for (const cat of ranked) {
        const val = cat.monthMap.get(m)
        row[cat.catId] = val && val > 0 ? val : null
      }
      chartData.push(row)
    }

    // 선택된 월의 총액 (해당 type 전체)
    const totalSelected = transactions
      .filter(tx => tx.type === type && getMonthKey(tx.date) === selectedMonthKey)
      .reduce((s, tx) => s + tx.amount, 0)

    return { ranked, chartData, totalSelected }
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

  // ─── 월 오프셋으로 year/month/key 계산 ─────────────────
  function getOffsetMonth(offset: number) {
    let m = curMonth + offset
    let y = curYear
    while (m <= 0) { m += 12; y -= 1 }
    while (m > 12) { m -= 12; y += 1 }
    const key = `${y}-${String(m).padStart(2, '0')}`
    return { year: y, month: m, key }
  }

  // ─── 특정 월의 카테고리별 집계 (1depth) ─────────────────
  function getCatBreakdown(type: 'expense' | 'income', monthKey: string) {
    const byName = new Map<string, number>()
    for (const tx of transactions) {
      if (tx.type !== type) continue
      if (getMonthKey(tx.date) !== monthKey) continue
      const name = getCatRootName(tx.category_id)
      byName.set(name, (byName.get(name) || 0) + tx.amount)
    }
    const sorted = [...byName.entries()]
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount)
    const total = sorted.reduce((s, c) => s + c.amount, 0)
    return { sorted, total }
  }

  // ─── 연간 추이 (1~12월 전체, 데이터 있는 달만 값) ──────
  const yearlyData: { label: string; expense: number | null; income: number | null }[] = []
  for (let m = 1; m <= 12; m++) {
    const key = `${curYear}-${String(m).padStart(2, '0')}`
    const bucket = monthlyMap.get(key)
    const hasData = bucket && (bucket.income > 0 || bucket.expense > 0)
    const monthSav = transactions.filter(t => t.type === 'savings' && !t.end_date && getMonthKey(t.date) === key).reduce((s, t) => s + t.amount, 0)
    yearlyData.push({
      label: `${m}월`,
      expense: hasData ? (bucket?.expense || 0) : null,
      income: hasData ? ((bucket?.income || 0) - monthSav) : null,
    })
  }
  
  // 연간 합계
  const yearIncome = transactions.filter(t => t.type === 'income' && t.date.startsWith(String(curYear))).reduce((s, t) => s + t.amount, 0)
  const yearExpense = transactions.filter(t => t.type === 'expense' && t.date.startsWith(String(curYear))).reduce((s, t) => s + t.amount, 0)
  const yearSavings = transactions.filter(t => t.type === 'savings' && t.date.startsWith(String(curYear)) && !t.end_date).reduce((s, t) => s + t.amount, 0)
  const yearBalance = yearIncome - yearExpense

  // ─── 총자산 추이 ──────────────────────────────────────
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
  const lastWithData = netWorthData.filter(d => d.value !== null)
  const nowValue = lastWithData[lastWithData.length - 1]?.value || 0
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
          header={() => {
            const netPct = janValue > 0 ? Math.round(Math.abs(netDiff / janValue) * 100) : 0
            return (
              <div className="flex-1 text-left pr-1">
                <div className="flex items-center gap-1 mb-1">
                  <p className="text-sm font-semibold">총자산</p>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); alert("총자산\n운용 중인 모든 투자금과 현금 잔액을 합친 '나의 전체 자산'") }}
                    className="w-4 h-4 rounded-full bg-muted text-muted-foreground text-[10px] flex items-center justify-center"
                  >?</button>
                </div>
                <div className="flex items-baseline gap-2">
                  <p className="text-lg font-bold tabular-nums text-foreground">{fmt(nowValue)}</p>
                  <span className="text-[10px] text-muted-foreground">{curYear}년 {curMonth}월 {now.getDate()}일 기준</span>
                </div>
                <span className={`text-xs ${netDiff >= 0 ? 'text-accent-blue' : 'text-accent-coral'}`}>
                  연초 대비 {netDiff >= 0 ? '↑' : '↓'} {netPct}% · {netDiff >= 0 ? '+' : ''}{fmt(netDiff)}
                </span>
              </div>
            )
          }}
        >
          {/* 월별 저축+잔액 세로 스택 막대 */}
          {(() => {
            const monthlyAssets: { label: string; savings: number; cash: number; total: number }[] = []
            let cumI = 0, cumE = 0
            for (const tx of transactions) {
              if (parseInt(tx.date.slice(0, 4)) < curYear) {
                if (tx.type === 'income') cumI += tx.amount
                else if (tx.type === 'expense') cumE += tx.amount
              }
            }
            for (let m = 1; m <= 12; m++) {
              const key = `${curYear}-${String(m).padStart(2, '0')}`
              const bucket = monthlyMap.get(key)
              if (bucket) { cumI += bucket.income; cumE += bucket.expense }
              const hasData = bucket && (bucket.income > 0 || bucket.expense > 0)
              if (!hasData && m > curMonth) {
                monthlyAssets.push({ label: `${m}`, savings: 0, cash: 0, total: 0 })
              } else {
                const cumSav = transactions.filter(t => t.type === 'savings' && t.date <= `${curYear}-${String(m).padStart(2,'0')}-31` && !t.end_date).reduce((s, t) => s + t.amount, 0)
                const total = cumI - cumE
                const cash = total - cumSav
                monthlyAssets.push({ label: `${m}`, savings: cumSav, cash: Math.max(cash, 0), total })
              }
            }

            return (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={monthlyAssets} margin={{ left: 0, right: 0, top: 8, bottom: 0 }}>
                    <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#9ca3af' }} axisLine={false} tickLine={false} interval={0} />
                    <YAxis hide />
                    <Tooltip
                      cursor={false}
                      labelFormatter={(v) => String(v).includes('월') ? String(v) : `${v}월`}
                      formatter={(v, name) => [fmt(Number(v)), name === 'cash' ? '잔액' : '저축']}
                      contentStyle={{ background: '#0a0f1a', border: 'none', borderRadius: 8, fontSize: 12 }}
                      labelStyle={{ color: '#9ca3af' }}
                    />
                    <Bar dataKey="cash" stackId="a" fill="#5865F2" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="savings" stackId="a" fill="#43B581" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                {/* 범례 */}
                <div className="flex gap-4 mt-3">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#5865F2' }} />
                    <span className="text-xs text-muted-foreground">잔액</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#43B581' }} />
                    <span className="text-xs text-muted-foreground">저축</span>
                  </div>
                </div>
              </>
            )
          })()}
        </Card>

        {/* ── 수입·지출 추이 카드 ──────────────────────── */}
        <Card
          header={() => {
            // 작년 데이터
            const prevYearIncome = transactions.filter(t => t.type === 'income' && t.date.startsWith(String(curYear - 1))).reduce((s, t) => s + t.amount, 0)
            const prevYearExpense = transactions.filter(t => t.type === 'expense' && t.date.startsWith(String(curYear - 1))).reduce((s, t) => s + t.amount, 0)
            const hasLastYear = prevYearIncome > 0 || prevYearExpense > 0
            return (
              <div className="flex-1 text-left pr-1">
                <div className="flex items-center gap-1 mb-1">
                  <p className="text-sm font-semibold">연간 실질 수입 · 지출</p>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); alert("실질 수입\n이번 달 수입에서 저축액을 제외한 '실제 활동 가능 금액'") }}
                    className="w-4 h-4 rounded-full bg-muted text-muted-foreground text-[10px] flex items-center justify-center"
                  >?</button>
                </div>
                <div className="flex items-baseline gap-2">
                  <p className="text-lg font-bold tabular-nums text-accent-blue">{fmt(yearIncome - yearSavings)}</p>
                  <span className="text-[10px] text-muted-foreground">{curYear}년 누적 실질 수입</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <p className="text-lg font-bold tabular-nums text-accent-coral">{fmt(yearExpense)}</p>
                  <span className="text-[10px] text-muted-foreground">{curYear}년 누적 지출</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  작년 대비 — —% · —
                </span>
              </div>
            )
          }}
        >
          {/* 토글 pill */}
          <div className="flex gap-1 mb-4 bg-border rounded-full p-1 w-fit">
            {([['all', '전체'], ['expense', '지출'], ['income', '수입']] as const).map(([val, label]) => (
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
            <LineChart data={yearlyData} margin={{ left: 10, right: 10, top: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f293780" />
              <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#9ca3af' }} axisLine={false} tickLine={false} interval={0} />
              <YAxis hide />
              <Tooltip
                cursor={false}
                labelFormatter={(v) => String(v).includes('월') ? String(v) : `${v}월`}
                formatter={(v, name) => [fmt(Number(v)), name === 'expense' ? '지출' : '수입']}
                contentStyle={{ background: '#0a0f1a', border: 'none', borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: '#9ca3af' }}
              />
              {(trendMode === 'expense' || trendMode === 'all') && (
                <Line type="monotone" dataKey="expense" stroke="#CF6679" strokeWidth={2} dot={{ r: 3, fill: '#CF6679' }} connectNulls />
              )}
              {(trendMode === 'income' || trendMode === 'all') && (
                <Line type="monotone" dataKey="income" stroke="#5865F2" strokeWidth={2} dot={{ r: 3, fill: '#5865F2' }} connectNulls />
              )}
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* ── 카드 1: N월 지출 ───────────────────────── */}
        <Card
          header={() => {
            const expDiff = curData.expense - prevData.expense
            return (
            <div className="flex-1 text-left pr-1">
              <p className="text-sm font-semibold mb-1">지출 상세</p>
              <div className="flex items-baseline gap-2">
                <p className="text-lg font-bold tabular-nums text-accent-coral">{fmt(curData.expense)}</p>
                <span className="text-[10px] text-muted-foreground">{curYear}년 {curMonth}월 기준</span>
              </div>
              {expChange.dir !== 'same' && (
                <span className={`text-xs ${expChange.dir === 'up' ? 'text-accent-coral' : 'text-accent-blue'}`}>
                  전월 대비 {expChange.dir === 'up' ? '↑' : '↓'} {expChange.pct}% · {expDiff >= 0 ? '+' : ''}{fmt(expDiff)}
                </span>
              )}
            </div>
            )
          }}
        >
          {(() => {
            const { year: ey, month: em, key: eKey } = getOffsetMonth(expMonthOffset)
            const { sorted: eSorted, total: eTotal } = getCatBreakdown('expense', eKey)
            const { ranked: eRanked, chartData: eChartData, totalSelected: eTotalSel } = get2depthTop5LineData('expense', eKey)
            return (
              <>
                {/* 월 네비게이션 */}
                <div className="flex items-center justify-between px-2 py-3">
                  <button type="button" onClick={(e) => { e.stopPropagation(); setExpMonthOffset(o => o - 1) }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><path d="m15 18-6-6 6-6" /></svg>
                  </button>
                  <span className="text-lg font-bold">{ey}년 {em}월</span>
                  <button type="button" onClick={(e) => { e.stopPropagation(); setExpMonthOffset(o => o + 1) }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><path d="m9 18 6-6-6-6" /></svg>
                  </button>
                </div>

                {/* 총 지출 — 월 아래 */}
                {eTotal > 0 && (
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-muted-foreground">총 지출</span>
                    <span className="text-sm font-bold tabular-nums text-accent-coral">{fmt(eTotal)}</span>
                  </div>
                )}

                {eRanked.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">내역이 없어요</p>
                ) : (
                  <>
                    {/* 2depth TOP 5 연간 라인 차트 */}
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={eChartData} margin={{ left: 10, right: 10, top: 8, bottom: 0 }}>
                        <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#9ca3af' }} axisLine={false} tickLine={false} interval={0} />
                        <YAxis hide />
                        <Tooltip
                          cursor={false}
                          labelFormatter={(v) => String(v).includes('월') ? String(v) : `${v}월`}
                          formatter={(v, catId) => [fmt(Number(v)), get2depthCatName(String(catId))]}
                          contentStyle={{ background: '#0a0f1a', border: 'none', borderRadius: 8, fontSize: 12 }}
                          labelStyle={{ color: '#9ca3af' }}
                        />
                        {eRanked.map((cat, i) => (
                          <Line key={cat.catId} type="monotone" dataKey={cat.catId} stroke={CAT_COLORS[i % CAT_COLORS.length]} strokeWidth={2} dot={{ r: 2, fill: CAT_COLORS[i % CAT_COLORS.length] }} connectNulls />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>

                    {/* 범례 */}
                    <div className="space-y-2 mt-3">
                      {eRanked.map((cat, i) => {
                        const pct = eTotalSel > 0 ? Math.round((cat.selectedAmount / eTotalSel) * 100) : 0
                        return (
                          <div key={cat.catId} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: CAT_COLORS[i % CAT_COLORS.length] }} />
                              <span className="text-xs">{cat.name}</span>
                            </div>
                            <span className="text-xs text-muted-foreground tabular-nums">{fmt(cat.selectedAmount)} · {pct}%</span>
                          </div>
                        )
                      })}
                    </div>
                  </>
                )}
              </>
            )
          })()}
        </Card>

        {/* ── 카드 2: N월 수입 ───────────────────────── */}
        <Card
          header={() => {
            const incDiff = curData.income - prevData.income
            return (
            <div className="flex-1 text-left pr-1">
              <p className="text-sm font-semibold mb-1">수입 상세</p>
              <div className="flex items-baseline gap-2">
                <p className="text-lg font-bold tabular-nums text-accent-blue">{fmt(curData.income)}</p>
                <span className="text-[10px] text-muted-foreground">{curYear}년 {curMonth}월 기준</span>
              </div>
              {incChange.dir !== 'same' && (
                <span className={`text-xs ${incChange.dir === 'up' ? 'text-accent-blue' : 'text-accent-coral'}`}>
                  전월 대비 {incChange.dir === 'up' ? '↑' : '↓'} {incChange.pct}% · {incDiff >= 0 ? '+' : ''}{fmt(incDiff)}
                </span>
              )}
            </div>
            )
          }}
        >
          {(() => {
            const { year: iy, month: im, key: iKey } = getOffsetMonth(incMonthOffset)
            const { sorted: iSorted, total: iTotal } = getCatBreakdown('income', iKey)
            const { ranked: iRanked, chartData: iChartData, totalSelected: iTotalSel } = get2depthTop5LineData('income', iKey)
            return (
              <>
                {/* 월 네비게이션 */}
                <div className="flex items-center justify-between px-2 py-3">
                  <button type="button" onClick={(e) => { e.stopPropagation(); setIncMonthOffset(o => o - 1) }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><path d="m15 18-6-6 6-6" /></svg>
                  </button>
                  <span className="text-lg font-bold">{iy}년 {im}월</span>
                  <button type="button" onClick={(e) => { e.stopPropagation(); setIncMonthOffset(o => o + 1) }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><path d="m9 18 6-6-6-6" /></svg>
                  </button>
                </div>

                {/* 총 수입 — 월 아래 */}
                {iTotal > 0 && (
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-muted-foreground">총 수입</span>
                    <span className="text-sm font-bold tabular-nums text-accent-blue">{fmt(iTotal)}</span>
                  </div>
                )}

                {iRanked.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">내역이 없어요</p>
                ) : (
                  <>
                    {/* 2depth TOP 5 연간 라인 차트 */}
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={iChartData} margin={{ left: 10, right: 10, top: 8, bottom: 0 }}>
                        <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#9ca3af' }} axisLine={false} tickLine={false} interval={0} />
                        <YAxis hide />
                        <Tooltip
                          cursor={false}
                          labelFormatter={(v) => String(v).includes('월') ? String(v) : `${v}월`}
                          formatter={(v, catId) => [fmt(Number(v)), get2depthCatName(String(catId))]}
                          contentStyle={{ background: '#0a0f1a', border: 'none', borderRadius: 8, fontSize: 12 }}
                          labelStyle={{ color: '#9ca3af' }}
                        />
                        {iRanked.map((cat, i) => (
                          <Line key={cat.catId} type="monotone" dataKey={cat.catId} stroke={CAT_COLORS[i % CAT_COLORS.length]} strokeWidth={2} dot={{ r: 2, fill: CAT_COLORS[i % CAT_COLORS.length] }} connectNulls />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>

                    {/* 범례 */}
                    <div className="space-y-2 mt-3">
                      {iRanked.map((cat, i) => {
                        const pct = iTotalSel > 0 ? Math.round((cat.selectedAmount / iTotalSel) * 100) : 0
                        return (
                          <div key={cat.catId} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: CAT_COLORS[i % CAT_COLORS.length] }} />
                              <span className="text-xs">{cat.name}</span>
                            </div>
                            <span className="text-xs text-muted-foreground tabular-nums">{fmt(cat.selectedAmount)} · {pct}%</span>
                          </div>
                        )
                      })}
                    </div>
                  </>
                )}
              </>
            )
          })()}
        </Card>



      </div>

      <BottomNav />
    </div>
  )
}
