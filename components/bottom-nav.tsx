'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CalendarDays, CalendarRange, ChartColumn } from 'lucide-react'

const tabs = [
  { href: '/history', label: '월간', icon: CalendarDays },
  { href: '/analysis', label: '분석', icon: ChartColumn },
  { href: '/yearly', label: '연간', icon: CalendarRange },
]

interface BottomNavProps {
  onAdd?: () => void
  hideAdd?: boolean
}

export function BottomNav({ onAdd, hideAdd }: BottomNavProps) {
  const pathname = usePathname()

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      {/* Tab bar */}
      <div className="flex items-center gap-0.5 px-1 py-1.5 rounded-full bg-white/80 dark:bg-[#2C2C2E] shadow-lg backdrop-blur-md border border-border/30 dark:border-white/10">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={`flex min-w-[64px] flex-col items-center gap-0.5 px-3 py-1.5 rounded-full transition-colors whitespace-nowrap ${
                active ? 'bg-black/5 dark:bg-white/15' : ''
              }`}
            >
              <Icon className={`h-5 w-5 ${active ? 'text-accent-blue' : 'text-gray-500 dark:text-gray-400'}`} />
              <span className={`text-[10px] font-medium ${active ? 'text-accent-blue' : 'text-gray-500 dark:text-gray-400'}`}>
                {label}
              </span>
            </Link>
          )
        })}
      </div>

      {/* + Button */}
      {onAdd && !hideAdd && (
        <button
          onClick={onAdd}
          className="size-[60px] bg-white/80 dark:bg-[#2C2C2E] backdrop-blur-md text-accent-blue rounded-full shadow-lg flex items-center justify-center flex-shrink-0 border border-border/30 dark:border-white/10"
          aria-label="내역 추가"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14" /><path d="M5 12h14" />
          </svg>
        </button>
      )}
    </div>
  )
}
