'use client'

import { useEffect, useRef, useState } from 'react'

interface DatePickerSheetProps {
  open: boolean
  mode: 'month' | 'year'
  year: number
  month?: number
  onClose: () => void
  onSelect: (year: number, month: number) => void
}

const ITEM_H = 48
const VISIBLE = 5

function DrumCol({
  items,
  selected,
  onSelect,
  label,
}: {
  items: number[]
  selected: number
  onSelect: (v: number) => void
  label: (v: number) => string
}) {
  const listRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)
  const startY = useRef(0)
  const startScroll = useRef(0)

  const scrollToIndex = (idx: number, smooth = true) => {
    const el = listRef.current
    if (!el) return
    el.scrollTo({ top: idx * ITEM_H, behavior: smooth ? 'smooth' : 'instant' })
  }

  useEffect(() => {
    const idx = items.indexOf(selected)
    if (idx >= 0) scrollToIndex(idx, false)
  }, [selected, items])

  const handleScroll = () => {
    if (isDragging.current) return
    const el = listRef.current
    if (!el) return
    const idx = Math.round(el.scrollTop / ITEM_H)
    const clamped = Math.max(0, Math.min(idx, items.length - 1))
    if (items[clamped] !== selected) onSelect(items[clamped])
  }

  return (
    <div className="relative flex-1 overflow-hidden" style={{ height: ITEM_H * VISIBLE }}>
      {/* 선택 하이라이트 */}
      <div
        className="absolute left-0 right-0 rounded-xl bg-muted pointer-events-none z-10"
        style={{ top: ITEM_H * 2, height: ITEM_H }}
      />
      {/* 위아래 페이드 */}
      <div className="absolute inset-x-0 top-0 h-16 pointer-events-none z-20"
        style={{ background: 'linear-gradient(to bottom, var(--color-background), transparent)' }} />
      <div className="absolute inset-x-0 bottom-0 h-16 pointer-events-none z-20"
        style={{ background: 'linear-gradient(to top, var(--color-background), transparent)' }} />
      <div
        ref={listRef}
        onScroll={handleScroll}
        className="h-full overflow-y-scroll scrollbar-hide"
        style={{ scrollSnapType: 'y mandatory', paddingTop: ITEM_H * 2, paddingBottom: ITEM_H * 2 }}
      >
        {items.map(v => (
          <div
            key={v}
            onClick={() => { onSelect(v); scrollToIndex(items.indexOf(v)) }}
            className="flex items-center justify-center cursor-pointer select-none"
            style={{ height: ITEM_H, scrollSnapAlign: 'center' }}
          >
            <span className={`text-[20px] font-medium transition-opacity ${v === selected ? 'text-foreground opacity-100' : 'text-muted-foreground opacity-40'}`}>
              {label(v)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function DatePickerSheet({ open, mode, year, month = 1, onClose, onSelect }: DatePickerSheetProps) {
  const today = new Date()
  const [selYear, setSelYear] = useState(year)
  const [selMonth, setSelMonth] = useState(month)

  useEffect(() => { setSelYear(year); setSelMonth(month) }, [year, month, open])

  const years = Array.from({ length: 20 }, (_, i) => today.getFullYear() - 5 + i)
  const months = Array.from({ length: 12 }, (_, i) => i + 1)

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end" onClick={onClose}>
      <div
        className="w-full bg-background rounded-t-3xl pb-safe"
        style={{ paddingBottom: 'max(24px, env(safe-area-inset-bottom))' }}
        onClick={e => e.stopPropagation()}
      >
        {/* 핸들 */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
        </div>
        <div className="flex items-center justify-between px-5 py-3">
          <button onClick={onClose} className="text-[15px] text-muted-foreground">취소</button>
          <button
            onClick={() => { onSelect(selYear, selMonth); onClose() }}
            className="text-[15px] font-semibold text-accent-blue"
          >확인</button>
        </div>

        <div className="flex px-6 gap-2">
          <DrumCol
            items={years}
            selected={selYear}
            onSelect={setSelYear}
            label={v => `${v}년`}
          />
          {mode === 'month' && (
            <DrumCol
              items={months}
              selected={selMonth}
              onSelect={setSelMonth}
              label={v => `${v}월`}
            />
          )}
        </div>
      </div>
    </div>
  )
}
