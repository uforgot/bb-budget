export function HistoryLoadingSkeleton() {
  return (
    <div className="px-5 animate-pulse">
      <div className="flex items-center justify-between mt-1 mb-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-28 rounded-full bg-surface" />
          <div className="h-9 w-20 rounded-full bg-surface" />
        </div>
        <div className="h-9 w-14 rounded-full bg-surface" />
      </div>

      <div className="mb-4 rounded-[22px] bg-surface p-4">
        <div className="h-5 w-24 rounded bg-background/60 mb-3" />
        <div className="h-16 rounded-[18px] bg-background/60" />
      </div>

      <div className="space-y-3 pb-8">
        <div className="h-24 rounded-[22px] bg-surface" />
        <div className="h-24 rounded-[22px] bg-surface" />
        <div className="h-24 rounded-[22px] bg-surface" />
      </div>
    </div>
  )
}

export function AnalysisLoadingSkeleton() {
  return (
    <div className="px-5 animate-pulse">
      <div className="flex items-center gap-3 mt-1 mb-4">
        <div className="h-10 w-24 rounded-full bg-surface" />
        <div className="h-10 w-32 rounded-full bg-surface" />
      </div>

      <div className="flex gap-2 mb-4 overflow-hidden">
        <div className="h-9 w-20 rounded-full bg-surface" />
        <div className="h-9 w-20 rounded-full bg-surface" />
        <div className="h-9 w-20 rounded-full bg-surface" />
      </div>

      <div className="space-y-3 pb-4">
        <div className="h-24 rounded-[22px] bg-surface" />
        <div className="h-24 rounded-[22px] bg-surface" />
        <div className="h-24 rounded-[22px] bg-surface" />
      </div>
    </div>
  )
}
