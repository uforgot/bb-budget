'use client'

import { useRef, useState, useEffect } from 'react'

interface MonthData {
  month: number
  value: number
  isFuture: boolean
}

interface MonthlyBarChartProps {
  data: MonthData[]
  label: string
  color?: string
}

export function MonthlyBarChart({ data, label, color = '#CF6679' }: MonthlyBarChartProps) {
  const today = new Date()
  const currentMonth = today.getMonth() + 1

  const [selectedMonth, setSelectedMonth] = useState(currentMonth)
  const scrollRef = useRef<HTMLDivElement>(null)
  const isScrolling = useRef(false)

  const BAR_W = 28
  const BAR_GAP = 16
  const ITEM_W = BAR_W + BAR_GAP
  const MAX_H = 120
  const LABEL_H = 24

  const maxValue = Math.max(...data.filter(d => !d.isFuture).map(d => d.value), 1)
  const selectedData = data.find(d => d.month === selectedMonth)

  // 초기 스크롤: 현재 월 센터 정렬
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const containerW = el.offsetWidth
    const centerOffset = containerW / 2 - BAR_W / 2
    // index = selectedMonth - 1
    const scrollTo = (selectedMonth - 1) * ITEM_W - centerOffset
    el.scrollLeft = Math.max(0, scrollTo)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 스크롤 위치 → 선택 월 동기화
  const onScroll = () => {
    const el = scrollRef.current
    if (!el) return
    const containerW = el.offsetWidth
    const centerOffset = containerW / 2 - BAR_W / 2
    const scrollLeft = el.scrollLeft
    // 스크롤 중앙에 가장 가까운 바 인덱스
    const idx = Math.round((scrollLeft + centerOffset) / ITEM_W)
    const month = Math.max(1, Math.min(12, idx + 1))
    setSelectedMonth(month)
  }

  return (
    <div className="bg-surface rounded-2xl px-5 pt-5 pb-6 mb-4">
      {/* 헤더 */}
      <div className="mb-5 px-0">
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

      {/* 스크롤 그래프 */}
      <div
        ref={scrollRef}
        className="overflow-x-auto scrollbar-hide"
        style={{ WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
        onScroll={onScroll}
      >
        {/* 좌우 패딩: 첫/마지막 바도 센터에 올 수 있게 */}
        <div
          className="flex items-end"
          style={{ height: MAX_H + LABEL_H, paddingLeft: 'calc(50% - 14px)', paddingRight: 'calc(50% - 14px)' }}
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
                style={{ width: ITEM_W, flexShrink: 0, cursor: d.isFuture ? 'default' : 'pointer' }}
                className="flex flex-col items-center justify-end"
                onClick={() => {
                  if (d.isFuture) return
                  setSelectedMonth(d.month)
                  // 탭 시 해당 바 센터로 스크롤
                  const el = scrollRef.current
                  if (!el) return
                  const containerW = el.offsetWidth
                  const centerOffset = containerW / 2 - BAR_W / 2
                  el.scrollTo({ left: (d.month - 1) * ITEM_W - centerOffset, behavior: 'smooth' })
                }}
              >
                <div
                  style={{
                    width: BAR_W,
                    height: barH,
                    backgroundColor: barColor,
                    borderRadius: 6,
                    marginBottom: 8,
                    flexShrink: 0,
                    transition: 'background-color 0.2s ease',
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
