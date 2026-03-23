'use client'

import Link from 'next/link'
import { useTheme } from '@/components/theme-provider'

export default function Settings() {
  const { theme, toggleTheme } = useTheme()

  return (
    <div className="min-h-dvh bg-background">
      <div className="max-w-md mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between pt-8 pb-6">
          <Link href="/" className="text-blue-400 text-sm font-medium flex items-center gap-1">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
            뒤로
          </Link>
          <span className="text-base font-semibold">설정</span>
          <span className="w-12" />
        </div>

        {/* 보기 설정 */}
        <p className="text-xs text-muted-foreground mb-2 px-1">보기 설정</p>
        <div className="bg-card border border-border rounded-xl p-4 mb-6">
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
        <p className="text-xs text-muted-foreground mb-2 px-1">데이터 관리</p>
        <div className="bg-card border border-border rounded-xl overflow-hidden">
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
