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

export function BalanceCard({
  prevBalance, thisMonthBalance, totalBalance, month,
  monthIncome = 0, monthExpense = 0, monthSavings = 0,
}: BalanceCardProps) {
  const prevMonth = month > 1 ? month - 1 : 12

  return (
    <div className="bg-surface rounded-2xl px-5 py-5 mb-3">
      <p className="text-[16px] font-bold mb-2">현재 잔액</p>
      <p className="text-[30px] font-bold tabular-nums mb-4" style={{ letterSpacing: '-1px' }}>
        ₩{totalBalance.toLocaleString()}
      </p>
      <div className="border-t border-border mb-3" />
      {/* 수입/지출/저축 3열 */}
      <div className="grid grid-cols-3 text-center mb-3">
        {[
          { label: '수입', value: monthIncome, color: '#5865F2' },
          { label: '지출', value: monthExpense, color: '#FF6B9D' },
          { label: '저축', value: monthSavings, color: '#43B581' },
        ].map(({ label, value, color }, i, arr) => (
          <div key={label} className={`py-1 ${i < arr.length - 1 ? 'border-r border-border' : ''}`}>
            <p className="text-[12px] text-muted-foreground mb-1">{label}</p>
            <p className="text-[15px] font-semibold tabular-nums" style={{ color }}>{fmtAmt(value)}</p>
          </div>
        ))}
      </div>
      <div className="border-t border-border mb-2" />
      {/* 전월/금월 잔액 2열 */}
      <div className="grid grid-cols-2 text-center">
        {[
          { label: `${prevMonth}월 잔액`, value: prevBalance },
          { label: `${month}월 잔액`, value: thisMonthBalance },
        ].map(({ label, value }, i) => (
          <div key={label} className={`py-1 ${i === 0 ? 'border-r border-border' : ''}`}>
            <p className="text-[12px] text-muted-foreground mb-1">{label}</p>
            <p className={`text-[15px] font-semibold tabular-nums ${value >= 0 ? 'text-foreground' : 'text-accent-coral'}`}>
              {fmtAmt(Math.abs(value))}{value < 0 ? ' -' : ''}
            </p>
          </div>
        ))}
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
  return (
    <div className="bg-surface rounded-2xl px-5 pt-4 pb-4 mb-3">
      <p className="text-[16px] font-bold mb-3">{year}년 {month}월 요약</p>
      <div className="grid grid-cols-3 text-center">
        {[
          { label: '수입', value: income, color: '#5865F2' },
          { label: '지출', value: savings, color: '#FF6B9D' },
          { label: '저축', value: prevSavings, color: '#43B581' },
        ].map(({ label, value, color }, i, arr) => (
          <div key={label} className={`py-1 ${i < arr.length - 1 ? 'border-r border-border' : ''}`}>
            <p className="text-[12px] text-muted-foreground mb-1">{label}</p>
            <p className="text-[15px] font-semibold tabular-nums" style={{ color }}>
              {value >= 100000000
                ? `${Math.floor(value / 100000000)}억`
                : value >= 10000
                ? `${Math.floor(value / 10000).toLocaleString()}만`
                : `₩${value.toLocaleString()}`}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
