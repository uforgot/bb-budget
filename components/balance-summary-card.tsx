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

export function MonthlySummaryCard({ month, income, savings, prevSavings }: MonthlySummaryCardProps) {
  return (
    <div className="bg-surface rounded-2xl px-4 pt-4 pb-1 mb-3">
      <p className="text-[12px] text-muted-foreground mb-2">{month}월 요약</p>
      <SummaryRow
        label={`${month}월 수입`}
        value={income}
        color="#43B581"
        icon={
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#43B581" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 19V5M5 12l7-7 7 7" />
          </svg>
        }
      />
      <SummaryRow
        label={`${month}월 지출`}
        value={savings}
        color="#FF6B6B"
        icon={
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FF6B6B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12l7 7 7-7" />
          </svg>
        }
      />
      <SummaryRow
        label="이월 저축"
        value={prevSavings}
        color="#9B59B6"
        icon={
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9B59B6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12h18M3 6h18M3 18h18" />
          </svg>
        }
      />
    </div>
  )
}
