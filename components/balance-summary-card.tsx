'use client'

// ─── Card 1: Balance ──────────────────────────────────
interface BalanceCardProps {
  prevBalance: number   // 전월까지 누적 잔고
  thisMonthBalance: number  // 이번 달 잔고 (수입-지출)
  totalBalance: number  // 전체 잔고
  month: number
}

function BarRow({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.max(Math.round((Math.abs(value) / max) * 100), 2) : 0
  const isNeg = value < 0
  return (
    <div className="mb-3 last:mb-0">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[12px] text-muted-foreground">{label}</span>
        <span className={`text-[12px] font-medium tabular-nums ${isNeg ? 'text-accent-coral' : ''}`}>
          {isNeg ? '-' : ''}₩{Math.abs(value).toLocaleString()}
        </span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: isNeg ? '#FF6B6B' : color }}
        />
      </div>
    </div>
  )
}

export function BalanceCard({ prevBalance, thisMonthBalance, totalBalance, month }: BalanceCardProps) {
  const maxVal = Math.max(Math.abs(prevBalance), Math.abs(thisMonthBalance), 1)

  return (
    <div className="bg-surface rounded-2xl px-5 py-5 mb-3">
      <p className="text-[12px] text-muted-foreground mb-1">총 잔고</p>
      <p className="text-[30px] font-bold tabular-nums mb-5" style={{ letterSpacing: '-1px' }}>
        ₩{totalBalance.toLocaleString()}
      </p>
      <BarRow label="전월 잔고" value={prevBalance} max={maxVal} color="#5865F2" />
      <BarRow label={`${month}월 잔고`} value={thisMonthBalance} max={maxVal} color="#43B581" />
    </div>
  )
}

// ─── Card 2: Monthly Summary ──────────────────────────
interface MonthlySummaryCardProps {
  month: number
  income: number
  savings: number       // 금월 지출 (필드명 유지, 내부 label만 변경)
  prevSavings: number   // 이월 저축 (전월까지 누적)
}

function SummaryRow({
  label,
  value,
  color,
  icon,
}: {
  label: string
  value: number
  color: string
  icon: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: `${color}20` }}>
          {icon}
        </div>
        <span className="text-[14px]">{label}</span>
      </div>
      <span className="text-[14px] font-semibold tabular-nums" style={{ color }}>
        ₩{value.toLocaleString()}
      </span>
    </div>
  )
}

function fmt(n: number) {
  if (n >= 100000000) return `${(n / 100000000).toFixed(1)}억`
  if (n >= 10000) return `${Math.floor(n / 10000)}만`
  return n.toLocaleString()
}

export function MonthlySummaryCard({ month, income, savings, prevSavings, year }: MonthlySummaryCardProps & { year: number }) {
  const max = Math.max(income, savings, prevSavings, 1)
  const rows = [
    { label: '수입', value: income, color: '#43B581' },
    { label: '지출', value: savings, color: '#FF6B6B' },
    { label: '이월저축', value: prevSavings, color: '#9B59B6' },
  ]
  return (
    <div className="bg-surface rounded-2xl px-4 pt-4 pb-4 mb-3 flex flex-col h-full">
      <p className="text-[11px] text-muted-foreground">{year}년 {month}월</p>
      <p className="text-[16px] font-bold mb-4">요약</p>
      <div className="flex flex-col gap-3.5">
        {rows.map(({ label, value, color }) => (
          <div key={label}>
            <div className="flex items-baseline justify-between mb-1">
              <span className="text-[13px] text-foreground">{label}</span>
              <span className="text-[13px] font-semibold tabular-nums">₩{fmt(value)}</span>
            </div>
            <div className="h-[3px] bg-muted rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.max(Math.round((value / max) * 100), value > 0 ? 4 : 0)}%`,
                  backgroundColor: color,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
