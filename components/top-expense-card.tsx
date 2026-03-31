'use client'

const CAT_COLORS = ['#7B61FF', '#3B9DFF', '#43B581', '#FF6B6B', '#FFD23F', '#FF9F43', '#00E5CC']

const CAT_EMOJI: Record<string, string> = {
  '식비': '🍽️', '생활': '🏠', '주거': '🏢', '교통': '🚗', '쇼핑': '🛍️',
  '건강': '💊', '여가': '🎬', '자녀': '👶', '반려동물': '🐾', '경조사': '💐',
  '보험': '🛡️', '세금': '📋', '기타': '📦',
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
    <div className="bg-surface rounded-2xl px-4 pt-4 pb-4 mb-3 h-full">
      <p className="text-[11px] text-muted-foreground">{year}년 {month}월</p>
      <div className="flex items-center justify-between mb-3">
        <p className="text-[16px] font-bold">지출</p>
      </div>
      <p className="text-[22px] font-bold tabular-nums mb-4" style={{ letterSpacing: '-0.5px' }}>
        ₩{total.toLocaleString()}
      </p>

      {items.length === 0 ? (
        <p className="text-[12px] text-muted-foreground text-center py-4">지출 내역이 없어요</p>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((item, i) => {
            const pct = Math.round((item.amount / total) * 100)
            const barPct = Math.round((item.amount / maxAmount) * 100)
            const color = CAT_COLORS[i % CAT_COLORS.length]
            const emoji = CAT_EMOJI[item.name] || '📁'
            return (
              <div key={item.name}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[12px]">{emoji}</span>
                    <span className="text-[12px] text-foreground">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-medium tabular-nums text-muted-foreground">
                      ₩{item.amount.toLocaleString()}
                    </span>
                    <span className="text-[11px] text-muted-foreground w-7 text-right">{pct}%</span>
                  </div>
                </div>
                <div className="h-[3px] bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${barPct}%`, backgroundColor: color }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
