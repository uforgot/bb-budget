'use client'

const CAT_COLORS = ['#7B61FF', '#3B9DFF', '#43B581', '#FF6B6B', '#FFD23F', '#FF9F43', '#00E5CC']

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

interface TopExpenseCardProps {
  year: number
  month: number
  items: { name: string; amount: number }[]
  total: number
}

export function TopExpenseCard({ year, month, items, total }: TopExpenseCardProps) {
  const maxAmount = Math.max(...items.map(i => i.amount), 1)

  return (
    <div className="bg-surface rounded-2xl px-5 pt-4 pb-4 mb-3 h-full">
      <p className="text-[11px] text-muted-foreground">{year}년 {month}월</p>
      <p className="text-[16px] font-bold mb-2.5">지출</p>
      {items.length === 0 ? (
        <p className="text-[12px] text-muted-foreground text-center py-4">지출 내역이 없어요</p>
      ) : (
        <div className="flex flex-col gap-3.5">
          {items.map((item, i) => {
            const color = CAT_COLORS[i % CAT_COLORS.length]
            return (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${color}25` }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>
                    </svg>
                  </span>
                  <span className="text-[13px] text-foreground">{item.name}</span>
                </div>
                <span className="text-[13px] font-semibold tabular-nums">
                  ₩{fmt(item.amount)}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
