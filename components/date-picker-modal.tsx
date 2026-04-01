'use client'

import { useState, useEffect } from 'react'

interface DatePickerModalProps {
  open: boolean
  mode: 'month' | 'year'
  year: number
  month?: number
  onClose: () => void
  onSelect: (year: number, month: number) => void
}

export function DatePickerModal({ open, mode, year, month = 1, onClose, onSelect }: DatePickerModalProps) {
  const today = new Date()
  const [selYear, setSelYear] = useState(year)
  const [selMonth, setSelMonth] = useState(month)
  const [tab, setTab] = useState<'year' | 'month'>('year')

  useEffect(() => { setSelYear(year); setSelMonth(month); setTab('year') }, [open])

  const years = Array.from({ length: 20 }, (_, i) => today.getFullYear() - 10 + i)
  const months = Array.from({ length: 12 }, (_, i) => i + 1)

  if (!open) return null

  const handleConfirm = () => {
    onSelect(selYear, selMonth)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-6" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative w-full max-w-sm bg-surface rounded-2xl overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* 타이틀 */}
        <div className="px-5 pt-5 pb-3 text-center border-b border-border">
          <p className="text-[17px] font-semibold">날짜 선택</p>
        </div>

        {/* 연도/월 탭 (month 모드일 때만) */}
        {mode === 'month' && (
          <div className="flex border-b border-border">
            {(['year', 'month'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-3 text-[15px] font-medium transition-colors ${
                  tab === t ? 'text-accent-blue border-b-2 border-accent-blue' : 'text-muted-foreground'
                }`}
              >
                {t === 'year' ? '연도' : '월'}
              </button>
            ))}
          </div>
        )}

        {/* 리스트 */}
        <div className="overflow-y-auto" style={{ maxHeight: '280px' }}>
          {(mode === 'year' || tab === 'year') && years.map(y => (
            <button
              key={y}
              onClick={() => { setSelYear(y); if (mode === 'month') setTab('month') }}
              className="w-full flex items-center justify-between px-5 py-3.5 active:bg-muted/50"
            >
              <span className={`text-[16px] ${y === selYear ? 'text-accent-blue font-semibold' : 'text-foreground'}`}>
                {y}년
              </span>
              {y === selYear && (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-accent-blue">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              )}
            </button>
          ))}
          {mode === 'month' && tab === 'month' && months.map(m => (
            <button
              key={m}
              onClick={() => setSelMonth(m)}
              className="w-full flex items-center justify-between px-5 py-3.5 active:bg-muted/50"
            >
              <span className={`text-[16px] ${m === selMonth ? 'text-accent-blue font-semibold' : 'text-foreground'}`}>
                {m}월
              </span>
              {m === selMonth && (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-accent-blue">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              )}
            </button>
          ))}
        </div>

        {/* 취소 / 확인 */}
        <div className="flex border-t border-border">
          <button onClick={onClose} className="flex-1 py-4 text-[16px] text-muted-foreground font-medium">
            취소
          </button>
          <div className="w-px bg-border" />
          <button onClick={handleConfirm} className="flex-1 py-4 text-[16px] text-accent-blue font-semibold">
            확인
          </button>
        </div>
      </div>
    </div>
  )
}
