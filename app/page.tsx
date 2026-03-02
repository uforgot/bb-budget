import { BottomNav } from '@/components/bottom-nav'

export default function Home() {
  const summary = [
    { label: '수입', value: '₩0', color: 'text-blue-400' },
    { label: '지출', value: '₩0', color: 'text-red-400' },
    { label: '잔액', value: '₩0', color: 'text-green-400' },
  ]

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-md mx-auto px-4 pt-8">
        <h1 className="text-lg font-semibold text-muted-foreground mb-1">
          {new Date().getFullYear()}년 {new Date().getMonth() + 1}월
        </h1>
        <p className="text-3xl font-bold mb-6">이번달 요약</p>

        <div className="grid grid-cols-3 gap-3 mb-8">
          {summary.map(({ label, value, color }) => (
            <div key={label} className="bg-card border border-border rounded-xl p-4">
              <p className="text-xs text-muted-foreground mb-1">{label}</p>
              <p className={`text-base font-bold ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-sm text-muted-foreground">최근 내역</p>
          <p className="text-sm text-center text-muted-foreground mt-8 mb-8">내역이 없어요</p>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
