import { BottomNav } from '@/components/bottom-nav'
import { TopHeader } from '@/components/top-header'

export default function Report() {
  return (
    <div className="min-h-dvh bg-background pb-20">
      <div className="max-w-md mx-auto px-4">
        <TopHeader />
        <p className="text-lg font-bold text-pretty mb-6">리포트</p>
        <p className="text-sm text-center text-muted-foreground mt-20">준비 중이에요</p>
      </div>
      <BottomNav />
    </div>
  )
}
