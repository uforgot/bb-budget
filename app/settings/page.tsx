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
      <header className="flex items-center justify-between px-4 pt-[env(safe-area-inset-top,0px)] h-14 border-b border-border">
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

      <div className="max-w-md mx-auto">
        {/* 보기 설정 */}
        <div className="px-4 pt-6 pb-2">
          <p className="text-xs font-medium text-muted-foreground uppercase">보기 설정</p>
        </div>
        <div className="mx-4 bg-card border border-border rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-sm">다크 모드</span>
            <button
              onClick={toggleTheme}
              className={`relative w-12 h-7 rounded-full transition-colors ${
                theme === 'dark' ? 'bg-green-500' : 'bg-muted'
              }`}
              aria-label="다크 모드 토글"
            >
              <span
                className={`absolute top-0.5 size-6 rounded-full bg-white shadow transition-transform ${
                  theme === 'dark' ? 'left-[22px]' : 'left-0.5'
                }`}
              />
            </button>
          </div>
        </div>

        {/* 데이터 관리 */}
        <div className="px-4 pb-2">
          <p className="text-xs font-medium text-muted-foreground uppercase">데이터 관리</p>
        </div>
        <div className="mx-4 bg-card border border-border rounded-xl overflow-hidden">
          <Link
            href="/settings/categories"
            className="flex items-center justify-between p-4"
          >
            <span className="text-sm">카테고리 관리</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  )
}
