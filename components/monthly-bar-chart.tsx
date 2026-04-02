'use client'

import { useRef, useState, useEffect } from 'react'

interface MonthData {
  month: number
  value: number
  isFuture: boolean
}

interface MonthlyBarChartProps {
  data: MonthData[]
  label: string      // "N월에 쓴 지출" 형태의 prefix
  color?: string     // 선택된 바 색상 (기본: accent-coral)
}

function fmt(n: number) {
  if (n === 0) return '₩0'
  if (n >= 100000000) return `₩${(n / 100000000).toFixed(1)}억`
  if (n >= 10000) return `₩${Math.floor(n / 10000).toLocaleString()}만`
  return `₩${n.toLocaleString()}`
}

export function MonthlyBarChart({ data, label, color = '#CF6679' }: MonthlyBarChartProps) {
  const today = new Date()
  const currentMonth = today.getMonth() + 1

  // 기본 선택: 현재 월 (미래면 마지막 데이터 있는 월)
  const defaultMonth = data.find(d => d.month === currentMonth && !d.isFuture)?.month
    ?? [...data].reverse().find(d => !d.isFuture && d.value > 0)?.month
    ?? 1
  const [selectedMonth, setSelectedMonth] = useState(defaultMonth)

  const containerRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)
  const startX = useRef(0)
  const startY = useRef(0)
  const direction = useRef<'h' | 'v' | null>(null)
  const [dragOffset, setDragOffset] = useState(0)

  // 최대값 (미래 제외)
  const maxValue = Math.max(...data.filter(d => !d.isFuture).map(d => d.value), 1)

  const selectedData = data.find(d => d.month === selectedMonth)

  const BAR_W = 24
  const BAR_GAP = 12
  const ITEM_W = BAR_W + BAR_GAP
  const TOTAL_W = ITEM_W * 12
  const MAX_H = 100

  // 스와이프로 선택
  const onTouchStart = (e: React.TouchEvent) => {
    isDragging.current = true
    startX.current = e.touches[0].clientX
    startY.current = e.touches[0].clientY
    direction.current = null
    setDragOffset(0)
  }

  const onTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current) return
    const dx = e.touches[0].clientX - startX.current
    const dy = e.touches[0].clientY - startY.current

    if (!direction.current) {
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 6) direction.current = 'h'
      else if (Math.abs(dy) > 6) { direction.current = 'v'; return }
      else return
    }
    if (direction.current === 'h') {
      e.preventDefault()
      e.stopPropagation()
      setDragOffset(dx)
    }
  }

  const onTouchEnd = () => {
    if (!isDragging.current) return
    isDragging.current = false
    if (direction.current === 'h') {
      const steps = Math.round(-dragOffset / ITEM_W)
      const next = Math.max(1, Math.min(12, selectedMonth + steps))
      setSelectedMonth(next)
    }
    setDragOffset(0)
    direction.current = null
  }

  // 선택 월이 보이도록 트랜슬레이트 계산
  const containerW = containerRef.current?.offsetWidth ?? 300
  // 선택 바 중앙이 컨테이너 중앙에 오도록
  const centerOffset = containerW / 2 - BAR_W / 2
  const baseTranslate = centerOffset - (selectedMonth - 1) * ITEM_W
  const translateX = baseTranslate + dragOffset

  return (
    <div className="bg-surface rounded-2xl px-5 py-5 mb-4">
      {/* 헤더: N월에 쓴 지출 + 금액 */}
      <div className="mb-5">
        <p className="text-[13px] text-muted-foreground mb-0.5">
          {selectedData ? `${selectedData.month}월에 ${label}` : label}
        </p>
        <p className="text-[28px] font-bold tabular-nums leading-tight" style={{ letterSpacing: '-1px', color }}>
          {selectedData && !selectedData.isFuture ? fmt(selectedData.value) : '—'}
        </p>
      </div>

      {/* 막대 그래프 */}
      <div
        ref={containerRef}
        className="overflow-hidden"
        style={{ touchAction: 'none' }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div
          className="flex items-end"
          style={{
            width: TOTAL_W,
            transform: `translateX(${translateX}px)`,
            transition: isDragging.current ? 'none' : 'transform 0.3s cubic-bezier(0.65, 0, 0.35, 1)',
            willChange: 'transform',
            height: MAX_H + 28, // 바 높이 + 월 레이블 공간
            alignItems: 'flex-end',
          }}
        >
          {data.map(d => {
            const isSelected = d.month === selectedMonth
            const barH = d.isFuture || d.value === 0 ? 4 : Math.max(4, Math.round((d.value / maxValue) * MAX_H))
            const barColor = d.isFuture
              ? 'rgba(255,255,255,0.08)'
              : isSelected
                ? color
                : 'rgba(255,255,255,0.18)'

            return (
              <div
                key={d.month}
                style={{ width: ITEM_W, paddingRight: BAR_GAP }}
                className="flex flex-col items-center"
              >
                {/* 바 */}
                <div
                  style={{
                    width: BAR_W,
                    height: barH,
                    backgroundColor: barColor,
                    borderRadius: 6,
                    marginBottom: 8,
                    transition: 'height 0.3s ease',
                  }}
                />
                {/* 월 레이블 */}
                <span
                  className="text-[11px] tabular-nums font-medium"
                  style={{ color: isSelected ? '#fff' : 'rgba(255,255,255,0.35)' }}
                >
                  {d.month}월
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
