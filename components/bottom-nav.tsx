'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, List, BarChart2 } from 'lucide-react'

const tabs = [
  { href: '/', label: '홈', icon: Home },
  { href: '/history', label: '내역', icon: List },
  { href: '/report', label: '리포트', icon: BarChart2 },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 px-1.5 py-1.5 rounded-full bg-black/75 dark:bg-black/85 shadow-lg backdrop-blur-md" style={{ paddingBottom: 'calc(6px + env(safe-area-inset-bottom, 0px))' }}>
      {tabs.map(({ href, label, icon: Icon }) => {
        const active = pathname === href
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center gap-0.5 px-6 py-2 rounded-full transition-colors whitespace-nowrap ${
              active ? 'bg-white/15' : ''
            }`}
          >
            <Icon className={`h-5 w-5 ${active ? 'text-blue-400' : 'text-gray-400'}`} />
            <span className={`text-[10px] font-medium ${active ? 'text-blue-400' : 'text-gray-400'}`}>
              {label}
            </span>
          </Link>
        )
      })}
    </div>
  )
}
