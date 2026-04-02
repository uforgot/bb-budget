'use client'

import { useRef, useState } from 'react'

interface MonthData {
  month: number
  value: number
  isFuture: boolean
}

interface MonthlyBarChartProps {
  data: MonthData[]       // 반드시 12개 (1~12월)
  label: string           // "쓴 지출" 등
  color?: string
}

export function MonthlyBarChart({ data, label, color = '#CF6679' }: MonthlyBarChartProps) {
  const today = new Date()
  const currentMonth = today.getMonth() + 1

  const [selectedMonth, setSelectedMonth] = useState(currentMonth)
  const [dragX, setDragX] = useState(0)
  const [dragging, setDragging] = useState(false)

  const isDragging = useRef(false)
  const startX = useRef(0)
  const startY = useRef(0)
  const direction = useRef<'h' | 'v' | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // 치수
  const BAR_W = 28
  const BAR_GAP = 16
  const ITEM_W = BAR_W + BAR_GAP
  const MAX_H = 120
  const LABEL_H = 24

  const maxValue = Math.max(...data.filter(d => !d.isFuture).map(d => d.value), 1)
  const selectedData = data.find(d => d.month === selectedMonth)

  // 선택 월이 항상 컨테이너 중앙에 오도록
  const containerW = containerRef.current?.offsetWidth ?? 320
  const centerX = containerW / 2 - BAR_W / 2
  // index 0-based
  const baseTranslate = centerX - (selectedMonth - 1) * ITEM_W
  const translateX = baseTranslate + dragX

  const onTouchStart = (e: React.TouchEvent) => {
    isDragging.current = true
    setDragging(true)
    startX.current = e.touches[0].clientX
    startY.current = e.touches[0].clientY
    direction.current = null
  }

  const onTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current) return
    const dx = e.touches[0].clientX - startX.current
    const dy = e.touches[0].clientY - startY.current

    if (!direction.current) {
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 6) direction.current = 'h'
      else if (Math.abs(dy) > 6) { direction.current = 'v'; isDragging.current = false; setDragging(false); return }
      else return
    }
    if (direction.current === 'h') {
      e.preventDefault()
      e.stopPropagation()
      setDragX(dx)
    }
  }

  const onTouchEnd = () => {
    if (!isDragging.current && !dragging) return
    isDragging.current = false
    setDragging(false)
    if (direction.current === 'h') {
      // 0.4 ITEM_W 넘으면 한 칸 이동
      if (dragX < -ITEM_W * 0.4 && selectedMonth < 12) setSelectedMonth(m => m + 1)
      else if (dragX > ITEM_W * 0.4 && selectedMonth > 1) setSelectedMonth(m => m - 1)
    }
    setDragX(0)
    direction.current = null
  }

  return (
    <div className="bg-surface rounded-2xl px-5 pt-5 pb-6 mb-4">
      {/* 헤더 */}
      <div className="mb-5">
        <p className="text-[13px] font-semibold text-white/80 mb-0.5">
          {selectedData ? `${selectedData.month}월에 ${label}` : label}
        </p>
        <p
          className="text-[24px] font-bold tabular-nums leading-tight"
          style={{ letterSpacing: '-1px', color }}
        >
          {selectedData && !selectedData.isFuture && selectedData.value > 0
            ? `₩${selectedData.value.toLocaleString()}`
            : '—'}
        </p>
      </div>

      {/* 그래프 영역 */}
      <div
        ref={containerRef}
        className="overflow-hidden"
        style={{ touchAction: 'none', height: MAX_H + LABEL_H }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div
          className="flex items-end"
          style={{
            height: MAX_H + LABEL_H,
            transform: `translateX(${translateX}px)`,
            transition: dragging ? 'none' : 'transform 0.3s cubic-bezier(0.65, 0, 0.35, 1)',
            willChange: 'transform',
          }}
        >
          {data.map(d => {
            const isSelected = d.month === selectedMonth
            const barH = d.isFuture || d.value === 0
              ? 6
              : Math.max(6, Math.round((d.value / maxValue) * MAX_H))
            const barColor = d.isFuture
              ? 'rgba(255,255,255,0.08)'
              : isSelected
                ? color
                : 'rgba(255,255,255,0.2)'

            return (
              <div
                key={d.month}
                style={{ width: ITEM_W, flexShrink: 0 }}
                className="flex flex-col items-center justify-end"
                onClick={() => !d.isFuture && setSelectedMonth(d.month)}
              >
                <div
                  style={{
                    width: BAR_W,
                    height: barH,
                    backgroundColor: barColor,
                    borderRadius: 6,
                    marginBottom: 8,
                    transition: 'height 0.35s ease, background-color 0.2s ease',
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: isSelected ? 600 : 400,
                    color: isSelected ? '#fff' : 'rgba(255,255,255,0.35)',
                    height: LABEL_H,
                    display: 'flex',
                    alignItems: 'center',
                    lineHeight: 1,
                  }}
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
