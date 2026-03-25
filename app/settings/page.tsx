'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTheme } from '@/components/theme-provider'

export default function Settings() {
  const router = useRouter()
  const { theme, toggleTheme } = useTheme()

  return (
    <div className="min-h-dvh bg-background">
      {/* 헤더 */}
      <header className="flex items-center justify-between px-4 pt-[env(safe-area-inset-top,0px)] h-14 border-b border-border bg-background">
        <button
          onClick={() => router.back()}
          className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-muted-foreground"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
        <h1 className="text-[17px] font-semibold">설정</h1>
        <div className="w-8" />
      </header>

      <main className="max-w-lg mx-auto">
        {/* 보기 설정 */}
        <div className="px-4 pt-6 pb-2">
          <p className="text-xs font-medium text-muted-foreground uppercase">보기 설정</p>
        </div>

        <div className="mx-4 rounded-[18px] bg-surface">
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-[15px]">다크 모드</span>
            <button
              role="switch"
              aria-checked={theme === 'dark'}
              onClick={toggleTheme}
              className={`relative inline-flex h-[31px] w-[51px] items-center rounded-full transition-colors duration-200 ${
                theme === 'dark' ? 'bg-accent-mint' : 'bg-muted'
              }`}
            >
              <span
                className={`inline-block h-[27px] w-[27px] rounded-full bg-white shadow-sm transition-transform duration-200 ${
                  theme === 'dark' ? 'translate-x-[22px]' : 'translate-x-[2px]'
                }`}
              />
            </button>
          </div>
        </div>

        {/* 데이터 관리 */}
        <div className="px-4 pt-6 pb-2">
          <p className="text-xs font-medium text-muted-foreground uppercase">데이터 관리</p>
        </div>

        <div className="mx-4 rounded-[18px] bg-surface">
          <Link
            href="/settings/categories"
            className="flex items-center justify-between px-4 py-4 border-b border-border"
          >
            <span className="text-[15px]">카테고리 관리</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </Link>
          <Link
            href="/settings/recurring"
            className="flex items-center justify-between px-4 py-4"
          >
            <span className="text-[15px]">반복 지출 관리</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </Link>
        </div>
      </main>
    </div>
  )
}
