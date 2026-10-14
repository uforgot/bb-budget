'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Calendar1, Calendars, ChartColumn, Plus } from 'lucide-react'

const tabs = [
  { href: '/history', label: '월간', icon: Calendar1 },
  { href: '/yearly', label: '연간', icon: Calendars },
  { href: '/analysis', label: '분석', icon: ChartColumn },
]

export const TAB_NAV_EVENT = 'bb-budget:tab-nav'
export const BOTTOM_NAV_CLEARANCE = 'calc(96px + env(safe-area-inset-bottom, 0px))'

export function useDismissOnTab(href: string, dismiss: () => void) {
  const dismissRef = useRef(dismiss)
  dismissRef.current = dismiss

  useEffect(() => {
    const onNav = (event: Event) => {
      if ((event as CustomEvent<string>).detail === href) dismissRef.current()
    }
    window.addEventListener(TAB_NAV_EVENT, onNav)
    return () => window.removeEventListener(TAB_NAV_EVENT, onNav)
  }, [href])
}

interface BottomNavProps {
  onAdd?: () => void
  hideAdd?: boolean
}

export function BottomNav({ onAdd, hideAdd }: BottomNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const lastNavAt = useRef(0)

  const goTab = (href: string) => {
    const now = Date.now()
    if (now - lastNavAt.current < 350) return
    lastNavAt.current = now

    const active = document.activeElement
    if (active instanceof HTMLElement) active.blur()
    window.dispatchEvent(new CustomEvent(TAB_NAV_EVENT, { detail: href }))
    if (pathname !== href) router.push(href)
    window.scrollTo(0, 0)
  }

  return (
    <div className="fixed bottom-6 left-5 right-5 z-[80] flex items-center justify-between gap-3" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      {/* Tab bar */}
      <div className="flex items-center gap-0.5 px-1 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 shadow-lg backdrop-blur-md border border-border/10 dark:border-white/10">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`)
          return (
            <Link
              key={href}
              href={href}
              onPointerDown={(event) => event.preventDefault()}
              onClick={(event) => {
                event.preventDefault()
                goTab(href)
              }}
              onPointerUp={(event) => {
                if (event.pointerType === 'mouse' && event.button !== 0) return
                event.preventDefault()
                goTab(href)
              }}
              className={`flex min-w-[64px] flex-col items-center gap-0.5 px-3 py-1.5 rounded-full transition-colors whitespace-nowrap ${
                active ? 'bg-black/5 dark:bg-white/5' : ''
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
          className="size-[60px] bg-gray-100 dark:bg-gray-800 backdrop-blur-md text-accent-blue rounded-full shadow-lg flex items-center justify-center flex-shrink-0 border border-border/10 dark:border-white/10"
          aria-label="내역 추가"
        >
          <Plus size={22} strokeWidth={2.5} />
        </button>
      )}
    </div>
  )
}
