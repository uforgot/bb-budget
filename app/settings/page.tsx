'use client'

import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTheme } from '@/components/theme-provider'

export default function Settings() {
  const router = useRouter()
  const { theme, toggleTheme } = useTheme()

  return (
    <div className="min-h-dvh bg-background">
      {/* 헤더 */}
      <header className="flex items-center justify-between px-5 pt-[env(safe-area-inset-top,0px)] h-14 bg-background">
        <button
          onClick={() => router.back()}
          className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-muted-foreground"
        >
          <ChevronLeft size={20} strokeWidth={2} />
        </button>
        <h1 className="text-[17px] font-semibold">설정</h1>
        <div className="w-8" />
      </header>

      <main className="max-w-lg mx-auto">
        {/* 보기 설정 */}
        <div className="px-5 pt-6 pb-2">
          <p className="text-[14px] font-medium text-muted-foreground uppercase">보기 설정</p>
        </div>

        <div className="mx-5 rounded-[22px] bg-surface dark:bg-gray-900">
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-[16px]">다크 모드</span>
            <button
              role="switch"
              aria-checked={theme === 'dark'}
              onClick={toggleTheme}
              className={`relative inline-flex h-[31px] w-[51px] items-center rounded-full transition-colors duration-200 ${
                theme === 'dark' ? 'bg-accent-blue' : 'bg-muted'
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
        <div className="px-5 pt-6 pb-2">
          <p className="text-[14px] font-medium text-muted-foreground uppercase">데이터 관리</p>
        </div>

        <div className="mx-5 rounded-[22px] bg-surface dark:bg-gray-900">
          <Link
            href="/settings/categories"
            className="flex items-center justify-between px-4 py-4"
          >
            <span className="text-[16px]">카테고리 관리</span>
            <ChevronRight size={16} strokeWidth={2} className="text-muted-foreground" />
          </Link>
        </div>
      </main>
    </div>
  )
}
