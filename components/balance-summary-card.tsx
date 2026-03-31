'use client'

// ─── Card 1: Balance ──────────────────────────────────
interface BalanceCardProps {
  prevBalance: number   // 전월까지 누적 잔고
  thisMonthBalance: number  // 이번 달 잔고 (수입-지출)
  totalBalance: number  // 전체 잔고
  month: number
}

export function BalanceCard({ prevBalance, thisMonthBalance, totalBalance, month }: BalanceCardProps) {
  const total = Math.abs(prevBalance) + Math.abs(thisMonthBalance) || 1
  const prevPct = Math.round((Math.abs(prevBalance) / total) * 100)
  const thisPct = 100 - prevPct
  const prevMonth = month > 1 ? month - 1 : 12

  return (
    <div className="bg-surface rounded-2xl px-5 py-5 mb-3">
      <p className="text-[12px] text-muted-foreground mb-1">현재 잔액</p>
      <p className="text-[30px] font-bold tabular-nums mb-6" style={{ letterSpacing: '-1px' }}>
        ₩{totalBalance.toLocaleString()}
      </p>
      {/* 1줄 분할 바 */}
      <div className="flex h-[6px] rounded-full overflow-hidden gap-[2px] mb-3">
        <div className="h-full rounded-full" style={{ width: `${prevPct}%`, backgroundColor: '#5865F2' }} />
        <div className="h-full rounded-full" style={{ width: `${thisPct}%`, backgroundColor: '#43B581' }} />
      </div>
      {/* 라벨 좌우 */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[12px] text-muted-foreground mb-0.5">{prevMonth}월 잔액</p>
          <p className="text-[14px] font-semibold tabular-nums">₩{prevBalance.toLocaleString()}</p>
        </div>
        <div className="text-right">
          <p className="text-[12px] text-muted-foreground mb-0.5">{month}월 잔액</p>
          <p className="text-[14px] font-semibold tabular-nums">₩{thisMonthBalance.toLocaleString()}</p>
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
    { label: '수입', value: income, color: '#5865F2' },    // 블러플
    { label: '지출', value: savings, color: '#FF6B9D' },   // 핑크
    { label: '저축', value: prevSavings, color: '#43B581' }, // 그린
  ]
  return (
    <div className="bg-surface rounded-2xl px-5 pt-4 pb-4 mb-3">
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
