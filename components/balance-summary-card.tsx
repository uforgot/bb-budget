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
        <span className="text-[13px] text-foreground">{label}</span>
        <span className={`text-[13px] font-semibold tabular-nums ${isNeg ? 'text-accent-coral' : ''}`}>
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
      <p className="text-[12px] text-muted-foreground mb-1">현재 잔액</p>
      <p className="text-[30px] font-bold tabular-nums mb-5" style={{ letterSpacing: '-1px' }}>
        ₩{totalBalance.toLocaleString()}
      </p>
      <BarRow label={`${month > 1 ? month - 1 : 12}월 잔액`} value={prevBalance} max={maxVal} color="#5865F2" />
      <BarRow label={`${month}월 잔액`} value={thisMonthBalance} max={maxVal} color="#43B581" />
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
    { label: '수입', value: income, color: '#5865F2' },    // 블러플
    { label: '지출', value: savings, color: '#FF6B9D' },   // 핑크
    { label: '저축', value: prevSavings, color: '#43B581' }, // 그린
  ]
  return (
    <div className="bg-surface rounded-2xl px-5 pt-4 pb-4 mb-3 flex flex-col h-full">
      <p className="text-[11px] text-muted-foreground">{year}년 {month}월</p>
      <p className="text-[16px] font-bold mb-3">요약</p>
      <div className="flex flex-col gap-3">
        {rows.map(({ label, value, color }, i) => (
          <div key={label} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${color}25` }}>
                {i === 0 && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 19V5M5 12l7-7 7 7"/>
                  </svg>
                )}
                {i === 1 && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 5v14M5 12l7 7 7-7"/>
                  </svg>
                )}
                {i === 2 && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/>
                  </svg>
                )}
              </span>
              <span className="text-[13px] text-foreground">{label}</span>
            </div>
            <span className="text-[13px] font-semibold tabular-nums">₩{fmt(value)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
