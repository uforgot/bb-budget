import { BottomNav } from '@/components/bottom-nav'
import { MonthlyCalendar } from '@/components/monthly-calendar'

// 3월 샘플 데이터 (빵계부 기반)
const marchData: Record<number, { income?: number; expense?: number }> = {
  1: { expense: 866630 },
  2: { expense: 226500 },
  3: { expense: 121634 },
  4: { expense: 33000 },
  5: { expense: 42700 },
  6: { income: 30000, expense: 70720 },
  7: { expense: 157030 },
  8: { expense: 151377 },
  9: { expense: 112500 },
  10: { income: 9673032, expense: 1838490 },
  11: { income: 10000, expense: 29000 },
  12: { expense: 87700 },
  13: { expense: 60600 },
  14: { expense: 175850 },
  15: { expense: 258000 },
  16: { expense: 45750 },
  17: { expense: 163000 },
  18: { expense: 52890 },
  19: { expense: 7270 },
}

export default function Home() {
  const totalIncome = Object.values(marchData).reduce((sum, d) => sum + (d.income || 0), 0)
  const totalExpense = Object.values(marchData).reduce((sum, d) => sum + (d.expense || 0), 0)
  const balance = totalIncome - totalExpense

  const summary = [
    { label: '수입', value: `₩${totalIncome.toLocaleString()}`, color: 'text-blue-400' },
    { label: '지출', value: `₩${totalExpense.toLocaleString()}`, color: 'text-red-400' },
    { label: '잔액', value: `₩${balance.toLocaleString()}`, color: balance >= 0 ? 'text-green-400' : 'text-red-400' },
  ]

  return (
    <div className="min-h-dvh bg-background pb-20">
      <div className="max-w-md mx-auto px-4 pt-8">
        <h1 className="text-lg font-semibold text-muted-foreground mb-1">
          2026년 3월
        </h1>
        <p className="text-3xl font-bold text-pretty mb-6">이번달 요약</p>

        <div className="grid grid-cols-3 gap-3 mb-6">
          {summary.map(({ label, value, color }) => (
            <div key={label} className="bg-card border border-border rounded-xl p-4">
              <p className="text-xs text-muted-foreground mb-1">{label}</p>
              <p className={`text-base font-bold tabular-nums ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        <MonthlyCalendar year={2026} month={3} data={marchData} />
      </div>

      <BottomNav />
    </div>
  )
}
