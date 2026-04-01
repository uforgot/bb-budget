'use client'

import { useEffect, useRef } from 'react'

interface DatePickerInlineProps {
  open: boolean
  mode: 'month' | 'year'
  year: number
  month?: number
  onSelect: (year: number, month: number) => void
}

const ITEM_H = 44
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
    const el = listRef.current
    if (!el) return
    const idx = Math.round(el.scrollTop / ITEM_H)
    const clamped = Math.max(0, Math.min(idx, items.length - 1))
    if (items[clamped] !== selected) onSelect(items[clamped])
  }

  const MID = Math.floor(VISIBLE / 2)
  return (
    <div className="relative flex-1 overflow-hidden" style={{ height: ITEM_H * VISIBLE }}>
      {/* 선택 하이라이트 */}
      <div className="absolute left-1 right-1 rounded-xl bg-white/10 pointer-events-none z-10"
        style={{ top: ITEM_H * MID, height: ITEM_H }} />
      {/* 페이드 */}
      <div className="absolute inset-x-0 top-0 pointer-events-none z-20 bg-gradient-to-b from-background to-transparent" style={{ height: ITEM_H * MID }} />
      <div className="absolute inset-x-0 bottom-0 pointer-events-none z-20 bg-gradient-to-t from-background to-transparent" style={{ height: ITEM_H * MID }} />
      <div
        ref={listRef}
        onScroll={handleScroll}
        className="h-full overflow-y-scroll"
        style={{ scrollSnapType: 'y mandatory', paddingTop: ITEM_H * MID, paddingBottom: ITEM_H * MID }}
      >
        {items.map(v => (
          <div
            key={v}
            onClick={() => { onSelect(v); scrollToIndex(items.indexOf(v)) }}
            className="flex items-center justify-center cursor-pointer select-none"
            style={{ height: ITEM_H, scrollSnapAlign: 'center' }}
          >
            <span className={`text-[17px] transition-all ${
              v === selected
                ? 'text-foreground font-semibold'
                : 'text-foreground/30 font-normal'
            }`}>
              {label(v)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function DatePickerInline({ open, mode, year, month = 1, onSelect }: DatePickerInlineProps) {
  const today = new Date()
  const years = Array.from({ length: 20 }, (_, i) => today.getFullYear() - 5 + i)
  const months = Array.from({ length: 12 }, (_, i) => i + 1)

  if (!open) return null

  return (
    <div className="overflow-hidden transition-all">
      <div
        className="flex px-4 pt-1 pb-3 gap-1 border-b border-border"
        onTouchStart={e => e.stopPropagation()}
        onTouchMove={e => e.stopPropagation()}
        onTouchEnd={e => e.stopPropagation()}
      >
        <DrumCol
          items={years}
          selected={year}
          onSelect={y => onSelect(y, month)}
          label={v => `${v}년`}
        />
        {mode === 'month' && (
          <DrumCol
            items={months}
            selected={month}
            onSelect={m => onSelect(year, m)}
            label={v => `${v}월`}
          />
        )}
      </div>
    </div>
  )
}
