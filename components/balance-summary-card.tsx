'use client'

// ─── Card 1: Balance ──────────────────────────────────
interface BalanceCardProps {
  cashBalance: number
  monthIncome: number
  monthExpense: number
  month: number
}

function BarRow({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="mb-3 last:mb-0">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[12px] text-muted-foreground">{label}</span>
        <span className="text-[12px] font-medium tabular-nums">₩{value.toLocaleString()}</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}

export function BalanceCard({ cashBalance, monthIncome, monthExpense, month }: BalanceCardProps) {
  const maxVal = Math.max(cashBalance, monthIncome, monthExpense, 1)

  return (
    <div className="bg-surface rounded-2xl px-5 py-5 mb-3">
      <p className="text-[12px] text-muted-foreground mb-1">현재 잔액</p>
      <p className="text-[30px] font-bold tabular-nums mb-5" style={{ letterSpacing: '-1px' }}>
        ₩{cashBalance.toLocaleString()}
      </p>
      <BarRow label="잔고" value={cashBalance} max={maxVal} color="#5865F2" />
      <BarRow label={`${month}월 수입`} value={monthIncome} max={maxVal} color="#43B581" />
      <BarRow label={`${month}월 지출`} value={monthExpense} max={maxVal} color="#FF6B6B" />
    </div>
  )
}

// ─── Card 2: Monthly Summary ──────────────────────────
interface MonthlySummaryCardProps {
  month: number
  income: number
  expense: number
  savings: number
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

export function MonthlySummaryCard({ month, income, expense, savings }: MonthlySummaryCardProps) {
  const net = income - expense - savings
  return (
    <div className="bg-surface rounded-2xl px-5 pt-4 pb-1 mb-3">
      <p className="text-[12px] text-muted-foreground mb-2">{month}월 요약</p>
      <SummaryRow
        label="수입"
        value={income}
        color="#43B581"
        icon={
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#43B581" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 19V5M5 12l7-7 7 7" />
          </svg>
        }
      />
      <SummaryRow
        label="지출"
        value={expense}
        color="#FF6B6B"
        icon={
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FF6B6B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12l7 7 7-7" />
          </svg>
        }
      />
      <SummaryRow
        label="저축"
        value={savings}
        color="#5865F2"
        icon={
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#5865F2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/>
          </svg>
        }
      />
      <div className="flex items-center justify-between py-3">
        <span className="text-[13px] text-muted-foreground">순 수지</span>
        <span className={`text-[14px] font-bold tabular-nums ${net >= 0 ? 'text-accent-blue' : 'text-accent-coral'}`}>
          {net >= 0 ? '+' : ''}₩{net.toLocaleString()}
        </span>
      </div>
    </div>
  )
}
