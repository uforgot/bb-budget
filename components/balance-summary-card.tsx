'use client'

interface BalanceSummaryCardProps {
  cashBalance: number
  monthIncome: number
  monthExpense: number
  monthSavings: number
  month: number
}

function fmt(n: number) {
  if (n >= 100000000) return `${(n / 100000000).toFixed(1)}억`
  if (n >= 10000) return `${Math.floor(n / 10000)}만`
  return n.toLocaleString()
}

export function BalanceSummaryCard({
  cashBalance,
  monthIncome,
  monthExpense,
  monthSavings,
  month,
}: BalanceSummaryCardProps) {
  const total = monthIncome + monthExpense + monthSavings || 1
  const incPct = Math.round((monthIncome / total) * 100)
  const expPct = Math.round((monthExpense / total) * 100)
  const savPct = 100 - incPct - expPct

  return (
    <div className="bg-surface rounded-2xl px-5 py-5 mb-4">
      {/* 잔액 */}
      <p className="text-xs text-muted-foreground mb-1">현재 잔액</p>
      <p className="text-[32px] font-bold tabular-nums mb-1" style={{ letterSpacing: '-1px' }}>
        ₩{cashBalance.toLocaleString()}
      </p>

      {/* 세그먼트 바 */}
      <div className="flex rounded-full overflow-hidden h-2 mb-4 gap-[2px]">
        {monthIncome > 0 && (
          <div
            className="h-full rounded-full bg-accent-blue transition-all"
            style={{ width: `${incPct}%` }}
          />
        )}
        {monthExpense > 0 && (
          <div
            className="h-full rounded-full bg-accent-coral transition-all"
            style={{ width: `${expPct}%` }}
          />
        )}
        {monthSavings > 0 && (
          <div
            className="h-full rounded-full bg-accent-mint transition-all"
            style={{ width: `${savPct}%` }}
          />
        )}
        {monthIncome === 0 && monthExpense === 0 && monthSavings === 0 && (
          <div className="h-full w-full rounded-full bg-muted" />
        )}
      </div>

      {/* Summary 3열 */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-background rounded-xl px-3 py-3">
          <div className="flex items-center gap-1 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-accent-blue flex-shrink-0" />
            <span className="text-[11px] text-muted-foreground">{month}월 수입</span>
          </div>
          <p className="text-[14px] font-semibold tabular-nums text-accent-blue">
            ₩{fmt(monthIncome)}
          </p>
        </div>
        <div className="bg-background rounded-xl px-3 py-3">
          <div className="flex items-center gap-1 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-accent-coral flex-shrink-0" />
            <span className="text-[11px] text-muted-foreground">{month}월 지출</span>
          </div>
          <p className="text-[14px] font-semibold tabular-nums text-accent-coral">
            ₩{fmt(monthExpense)}
          </p>
        </div>
        <div className="bg-background rounded-xl px-3 py-3">
          <div className="flex items-center gap-1 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-accent-mint flex-shrink-0" />
            <span className="text-[11px] text-muted-foreground">{month}월 저축</span>
          </div>
          <p className="text-[14px] font-semibold tabular-nums text-accent-mint">
            ₩{fmt(monthSavings)}
          </p>
        </div>
      </div>
    </div>
  )
}
