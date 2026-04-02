'use client'

import { useRef, useState, useEffect } from 'react'

function fmt(n: number) {
  const abs = Math.abs(n)
  if (abs >= 100000000) return `${Math.floor(abs / 100000000)}억`
  if (abs >= 10000) return `${Math.floor(abs / 10000).toLocaleString()}만`
  return abs.toLocaleString()
}

function diffText(diff: number | null, type: 'income' | 'expense' | 'savings' | 'balance', prevLabel: string): string {
  if (diff === null || diff === undefined) return ''
  if (diff === 0) return '변동이 없어요.'
  const f = fmt(Math.abs(diff))
  if (type === 'income') return diff > 0 ? `${prevLabel}보다 ${f}원 더 벌었어요.` : `${prevLabel}보다 ${f}원 덜 벌었어요.`
  if (type === 'expense') return diff > 0 ? `${prevLabel}보다 ${f}원 더 썼어요.` : `${prevLabel}보다 ${f}원 덜 썼어요.`
  if (type === 'savings') return diff > 0 ? `${prevLabel}보다 ${f}원 더 저축했어요.` : `${prevLabel}보다 ${f}원 줄었어요.`
  return diff > 0 ? `${prevLabel}보다 ${f}원 늘었어요.` : `${prevLabel}보다 ${f}원 줄었어요.`
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
}

export function SummaryCardSlider({
  month, income, expense, savings, balance,
  prevMonth, prevIncome, prevExpense, prevSavings, prevBalance, hasPrev,
}: SummaryCardSliderProps) {
  const prevLabel = `${prevMonth}월`
  const [current, setCurrent] = useState(0)
  const [dragX, setDragX] = useState(0)
  const [dragging, setDragging] = useState(false)
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

  const cards = [
    { label: `${month}월 번 수입`, amount: income, diff: hasPrev ? income - prevIncome : null, type: 'income' as const, textColor: 'text-white', bg: '#5865F2', img: '/card-income.png' },
    { label: `${month}월 쓴 지출`, amount: expense, diff: hasPrev ? expense - prevExpense : null, type: 'expense' as const, textColor: 'text-white', bg: '#FF70FF', img: '/card-expense.png' },
    { label: `${month}월 모은 저축`, amount: savings, diff: hasPrev ? savings - prevSavings : null, type: 'savings' as const, textColor: 'text-white', bg: '#2dd4bf', img: '/card-saving.png' },
    { label: `${month}월 남은 잔액`, amount: balance, diff: hasPrev ? balance - prevBalance : null, type: 'balance' as const, textColor: 'text-white', bg: balance >= 0 ? '#2C2C2E' : '#FF6B9D', img: '/card-balance.png' },
  ]
  const total = cards.length

  const onTouchStart = (e: React.TouchEvent) => {
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
    if (dragX < -w * 0.25 && current < total - 1) setCurrent(c => c + 1)
    else if (dragX > w * 0.25 && current > 0) setCurrent(c => c - 1)
    setDragX(0)
    dragDirection.current = null
  }

  const w = containerWidth || 1
  const translateX = -(current * 100) + (dragX / w) * 100

  return (
    <div className="mb-4 overflow-hidden" ref={containerRef}>
      {/* 슬라이드 트랙 */}
      <div
        className="flex"
        style={{
          transform: `translateX(${translateX}%)`,
          transition: dragging ? 'none' : 'transform 0.3s cubic-bezier(0.65, 0, 0.35, 1)',
          willChange: 'transform',
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {cards.map((card, idx) => {
          const dt = diffText(card.diff, card.type, prevLabel)
          return (
            <div
              key={card.label}
              className="flex-shrink-0 w-full"
              style={{ padding: '0 20px' }}
            >
              <div className="rounded-2xl px-5 pt-5 pb-4 flex flex-col justify-between overflow-hidden relative" style={{ minHeight: '150px', backgroundColor: card.bg }}>
                {/* 데코 이미지 */}
                <img
                  src={card.img}
                  alt=""
                  aria-hidden
                  className="absolute right-0 bottom-0 w-28 h-28 object-contain pointer-events-none select-none"
                  style={{ transform: 'translate(10%, 10%)' }}
                />
                <div>
                  <p className="text-[13px] font-semibold text-white/80 mb-0.5">{card.label}</p>
                  <p className="text-[28px] font-bold tabular-nums text-white leading-tight" style={{ letterSpacing: '-1px' }}>
                    ₩{card.amount.toLocaleString()}
                  </p>
                </div>
                {dt && <p className="text-[13px] font-semibold text-white/70 leading-tight">{dt}</p>}
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
            onClick={() => setCurrent(i)}
            className={`rounded-full transition-all ${i === current ? 'w-4 h-1.5 bg-foreground' : 'w-1.5 h-1.5 bg-foreground/20'}`}
          />
        ))}
      </div>
    </div>
  )
}
