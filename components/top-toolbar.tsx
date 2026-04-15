'use client'

import { Search, Settings } from 'lucide-react'
import type { ReactNode } from 'react'

export function TopToolbar({
  left,
  onSearch,
  onSettings,
  versionLabel,
}: {
  left?: ReactNode
  onSearch?: () => void
  onSettings: () => void
  versionLabel?: string
}) {
  return (
    <div className="sticky top-0 z-30 bg-background px-5">
      <div className="flex items-center justify-between h-14" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <div className="w-8 flex items-center justify-center">{left ?? null}</div>
        <div className="flex items-center gap-2">
          {versionLabel ? <span className="text-[10px] text-muted-foreground tabular-nums">{versionLabel}</span> : null}
          {onSearch ? (
            <button onClick={onSearch} className="flex items-center justify-center w-8 h-8 rounded-lg text-foreground" aria-label="검색">
              <Search size={18} strokeWidth={2} />
            </button>
          ) : null}
          <button onClick={onSettings} className="flex items-center justify-center w-8 h-8 rounded-lg text-foreground" aria-label="설정">
            <Settings size={20} strokeWidth={2} />
          </button>
        </div>
      </div>
    </div>
  )
}
