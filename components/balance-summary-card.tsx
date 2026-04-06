'use client'

// ─── Card 1: Balance ──────────────────────────────────
interface BalanceCardProps {
  prevBalance: number
  thisMonthBalance: number
  totalBalance: number
  month: number
  monthIncome?: number
  monthExpense?: number
  monthSavings?: number
}

function fmtAmt(n: number) {
  if (n >= 100000000) return `${Math.floor(n / 100000000)}억`
  if (n >= 10000) return `${Math.floor(n / 10000).toLocaleString()}만`
  return `₩${n.toLocaleString()}`
}

function formatCurrency(n: number) {
  const abs = Math.abs(n).toLocaleString()
  return n < 0 ? `-₩${abs}` : `₩${abs}`
}

export function BalanceCard({
  prevBalance, thisMonthBalance, totalBalance, month,
  monthIncome = 0, monthExpense = 0, monthSavings = 0,
}: BalanceCardProps) {
  const prevMonth = month > 1 ? month - 1 : 12
  const total = Math.abs(prevBalance) + Math.abs(thisMonthBalance) || 1
  const prevPct = Math.round((Math.abs(prevBalance) / total) * 100)
  const thisPct = 100 - prevPct

  return (
    <div className="bg-surface rounded-[22px] px-5 pt-5 pb-4 mb-3 min-h-[150px] flex flex-col justify-between">
      <div>
        <p className="text-[13px] font-semibold text-white/80 mb-0.5">현재 잔액</p>
        <p className="text-[24px] font-bold tabular-nums text-white leading-tight mb-6" style={{ letterSpacing: '-1px' }}>
          {formatCurrency(totalBalance)}
        </p>
      </div>

      <div>
        <div className="flex h-[6px] rounded-full overflow-hidden gap-[2px] mb-3 bg-white/10">
          <div className="h-full rounded-full" style={{ width: `${prevPct}%`, backgroundColor: '#AEB4FF' }} />
          <div className="h-full rounded-full" style={{ width: `${thisPct}%`, backgroundColor: '#5865F2' }} />
        </div>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[14px] text-white mb-0.5">{prevMonth}월 잔액</p>
            <p className="text-[14px] font-semibold tabular-nums text-white">{formatCurrency(prevBalance)}</p>
          </div>
          <div className="text-right">
            <p className="text-[14px] text-white mb-0.5">{month}월 잔액</p>
            <p className={`text-[14px] font-semibold tabular-nums ${thisMonthBalance < 0 ? 'text-[#5865F2]' : 'text-white'}`}>
              {formatCurrency(thisMonthBalance)}
            </p>
          </div>
        </div>
      </div>
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
  if (n >= 100000000) {
    const eok = Math.floor(n / 100000000)
    const man = Math.floor((n % 100000000) / 10000)
    return man > 0
      ? `${eok.toLocaleString()}억 ${man.toLocaleString()}만`
      : `${eok.toLocaleString()}억`
  }
  if (n >= 10000) return `${Math.floor(n / 10000).toLocaleString()}만`
  return n.toLocaleString()
}

export function MonthlySummaryCard({ month, income, savings, prevSavings, year }: MonthlySummaryCardProps & { year: number }) {
  const max = Math.max(income, savings, prevSavings, 1)
  const rows = [
    { label: '수입', value: income, color: '#5865F2' },
    { label: '지출', value: savings, color: '#FF6B9D' },
    { label: '저축', value: prevSavings, color: '#43B581' },
  ]
  return (
    <div className="bg-surface rounded-[22px] px-5 pt-4 pb-4 mb-3">
      <p className="text-[16px] font-bold mb-3">{year}년 {month}월 요약</p>
      <div className="flex flex-col gap-3">
        {rows.map(({ label, value, color }) => {
          const pct = max > 0 ? Math.max(Math.round((value / max) * 100), value > 0 ? 4 : 0) : 0
          return (
            <div key={label}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[14px] text-foreground">{label}</span>
                <span className="text-[14px] font-semibold tabular-nums">{formatCurrency(value)}</span>
              </div>
              <div className="h-[6px] bg-muted rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
