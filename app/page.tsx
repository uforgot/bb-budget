import { BottomNav } from '@/components/bottom-nav'
import { MonthlyCalendar } from '@/components/monthly-calendar'

export default function Home() {
  const summary = [
    { label: '수입', value: '₩0', color: 'text-blue-400' },
    { label: '지출', value: '₩0', color: 'text-red-400' },
    { label: '잔액', value: '₩0', color: 'text-green-400' },
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

        <MonthlyCalendar year={2026} month={3} />
      </div>

      <BottomNav />
    </div>
  )
}
