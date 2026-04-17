'use client'

import { useRef, useState, useEffect, useMemo } from 'react'
import { typography, semanticColors } from '@/components/ui-colors'

function fmt(n: number) {
  const abs = Math.abs(n)
  if (abs >= 100000000) return `${Math.floor(abs / 100000000)}억`
  if (abs >= 10000) return `${Math.floor(abs / 10000).toLocaleString()}만`
  return abs.toLocaleString()
}

function diffText(diff: number | null, _type: 'income' | 'expense' | 'savings' | 'balance', prevLabel: string): string {
  if (diff === null || diff === undefined) return ''
  const f = `${fmt(Math.abs(diff))} 원`
  if (diff === 0) return `${prevLabel} 대비 동일`
  return `${prevLabel} 대비 ${diff > 0 ? '↑' : '↓'}${f}`
}

interface SummaryCardSliderProps {
  month: number
  income: number
  expense: number
  savings: number
  balance: number
  prevMonth: number
  prevIncome: number
  prevExpense: number
  prevSavings: number
  prevBalance: number
  hasPrev: boolean
  yearMode?: boolean
  prevLabelOverride?: string
  labelPrefixOverride?: string
  labelSuffixOverride?: string
}

export function SummaryCardSlider({
  month, income, expense, savings, balance,
  prevMonth, prevIncome, prevExpense, prevSavings, prevBalance, hasPrev, yearMode, prevLabelOverride, labelPrefixOverride, labelSuffixOverride,
}: SummaryCardSliderProps) {
  const unit = yearMode ? '년' : '월'
  const prevLabel = prevLabelOverride || `${prevMonth}${unit}`
  const [current, setCurrent] = useState(0)
  const [dragX, setDragX] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [animating, setAnimating] = useState(false)
  const isDragging = useRef(false)
  const startX = useRef(0)
  const startY = useRef(0)
  const dragDirection = useRef<'h' | 'v' | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(0)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    setContainerWidth(el.offsetWidth)
    const ro = new ResizeObserver(() => setContainerWidth(el.offsetWidth))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const labelPrefix = labelPrefixOverride || `${month}${unit}`
  const labelSuffix = labelSuffixOverride || ''
  const cards = [
    { label: `${labelPrefix} 쓴 지출${labelSuffix}`, amount: expense, diff: hasPrev ? expense - prevExpense : null, type: 'expense' as const, textColor: 'text-white', bg: semanticColors.expense, img: '/card-expense.png' },
    { label: `${labelPrefix} 번 수입${labelSuffix}`, amount: income, diff: hasPrev ? income - prevIncome : null, type: 'income' as const, textColor: 'text-white', bg: semanticColors.income, img: '/card-income.png' },
    { label: `${labelPrefix} 모은 저축${labelSuffix}`, amount: savings, diff: hasPrev ? savings - prevSavings : null, type: 'savings' as const, textColor: 'text-white', bg: semanticColors.savings, img: '/card-saving.png' },
    { label: `${labelPrefix} 남은 잔액${labelSuffix}`, amount: balance, diff: hasPrev ? balance - prevBalance : null, type: 'balance' as const, textColor: 'text-white', bg: '#2C2C2E', img: '/card-balance.png' },
  ]
  const total = cards.length
  const loopCards = useMemo(() => [...cards, ...cards, ...cards], [cards])
  const baseIndex = total
  const virtualCurrent = current + baseIndex

  useEffect(() => {
    setAnimating(false)
  }, [])

  const isInteractiveTarget = (target: EventTarget | null) => {
    if (!(target instanceof HTMLElement)) return false
    return !!target.closest('button, a, input, select, textarea, [role="button"], [data-no-swipe="true"]')
  }

  const onTouchStart = (e: React.TouchEvent) => {
    if (isInteractiveTarget(e.target)) return
    isDragging.current = true
    setDragging(true)
    dragDirection.current = null
    startX.current = e.touches[0].clientX
    startY.current = e.touches[0].clientY
    setDragX(0)
  }

  const onTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current) return
    const dx = e.touches[0].clientX - startX.current
    const dy = e.touches[0].clientY - startY.current

    // 방향 결정 (10px threshold)
    if (!dragDirection.current) {
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 8) {
        dragDirection.current = 'h'
      } else if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 8) {
        dragDirection.current = 'v'
        isDragging.current = false
        setDragX(0)
        return
      } else {
        return
      }
    }

    if (dragDirection.current === 'h') {
      e.preventDefault()
      e.stopPropagation()
      const clamped = Math.max(-containerWidth * 0.6, Math.min(containerWidth * 0.6, dx))
      setDragX(clamped)
    }
  }

  const onTouchEnd = (_e: React.TouchEvent) => {
    if (!isDragging.current) return
    isDragging.current = false
    setDragging(false)
    if (dragX < -w * 0.25) {
      setAnimating(true)
      setCurrent(c => c + 1)
    } else if (dragX > w * 0.25) {
      setAnimating(true)
      setCurrent(c => c - 1)
    }
    setDragX(0)
    dragDirection.current = null
  }

  const handleTransitionEnd = () => {
    if (!animating) return
    setAnimating(false)
    if (current < 0) setCurrent(total - 1)
    else if (current >= total) setCurrent(0)
  }

  const w = containerWidth || 1
  const translateX = -(virtualCurrent * 100) + (dragX / w) * 100

  return (
    <div className="mb-4 overflow-hidden" ref={containerRef}>
      {/* 슬라이드 트랙 */}
      <div
        className="flex"
        style={{
          transform: `translateX(${translateX}%)`,
          transition: dragging || !animating ? 'none' : 'transform 0.3s cubic-bezier(0.65, 0, 0.35, 1)',
          willChange: 'transform',
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onTransitionEnd={handleTransitionEnd}
      >
        {loopCards.map((card, idx) => {
          const dt = diffText(card.diff, card.type, prevLabel)
          return (
            <div
              key={`${card.label}-${idx}`}
              className="flex-shrink-0 w-full"
              style={{ padding: '0 20px' }}
            >
              <div className="rounded-[22px] px-4 pt-4 pb-4 flex flex-col justify-between overflow-hidden relative" style={{ minHeight: '150px', backgroundColor: card.bg }}>
                {/* 데코 이미지 — 우측, 텍스트 3줄 센터 높이 */}
                <img
                  src={card.img}
                  alt=""
                  aria-hidden
                  className="absolute right-0 top-1/2 w-32 h-32 object-contain pointer-events-none select-none"
                  style={{ transform: 'translateY(-50%) translateX(-5%)' }}
                />
                <div>
                  <p className={`text-[14px] font-medium text-white mb-0`}>{card.label}</p>
                  <p className={`text-[24px] font-bold tracking-[-0.0416667em] tabular-nums ${typography.cardBodyInverse} leading-tight`}>
                    ₩{card.amount.toLocaleString()}
                  </p>
                </div>
                {dt && <p className={`text-[13px] font-medium ${typography.cardSubtleInverse} leading-snug`}>{dt}</p>}
              </div>
            </div>
          )
        })}
      </div>

      {/* 도트 인디케이터 */}
      <div className="flex justify-center gap-1.5 mt-3">
        {cards.map((_, i) => (
          <button
            key={i}
            data-no-swipe="true"
            onClick={() => setCurrent(i)}
            className={`rounded-full transition-all ${i === current ? 'w-4 h-1.5 bg-foreground' : 'w-1.5 h-1.5 bg-foreground/20'}`}
          />
        ))}
      </div>
    </div>
  )
}
