'use client'

import { useState } from 'react'
import { typography } from '@/components/ui-colors'

interface MonthData {
  month: number
  value: number
  isFuture: boolean
}

interface MonthlyBarChartProps {
  data: MonthData[]
  label: string
  color?: string
  avgValue?: number
  avgLabel?: string
  headerRight?: React.ReactNode
  className?: string
}

export function MonthlyBarChart({ data, label, color = '#CF6679', avgValue, avgLabel = '월 평균', headerRight, className = '' }: MonthlyBarChartProps) {
  const today = new Date()
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1)

  const BAR_W = 28
  const BAR_GAP = 16
  const ITEM_W = BAR_W + BAR_GAP
  const MAX_H = 120
  const LABEL_H = 24
  const TOP_PAD = 8 // border-radius 잘림 방지용 상단 여백

  const maxValue = Math.max(...data.filter(d => !d.isFuture).map(d => d.value), 1)
  const selectedData = data.find(d => d.month === selectedMonth)

  return (
    <div className={`bg-surface rounded-[22px] px-4 pt-5 pb-6 mb-4 ${className}`}>
      {/* 헤더 */}
      <div className="mb-5">
        <div className="flex items-start justify-between gap-3 mb-0">
          <p className="text-[14px] font-semibold text-foreground mb-0">
            {selectedData ? `${selectedData.month}월 ${label}` : label}
          </p>
          {headerRight}
        </div>
        <p className="text-[24px] font-bold tabular-nums leading-tight mt-0" style={{ letterSpacing: '-1px', color }}>
          {selectedData && !selectedData.isFuture && selectedData.value > 0
            ? `₩${selectedData.value.toLocaleString()}`
            : '—'}
        </p>
        {selectedData && !selectedData.isFuture && selectedData.value > 0 && avgValue != null && avgValue > 0 && (() => {
          const diff = selectedData.value - avgValue
          if (diff === 0) return null
          const isOver = diff > 0
          const toMan = (v: number) => `${Math.round(v / 10000).toLocaleString()}만 원`
          return (
            <p className="text-[14px] font-semibold mt-1 text-foreground/70 dark:text-white/70">
              {avgLabel} {toMan(avgValue)}보다 {toMan(Math.abs(diff))} {isOver ? '더' : '덜'} {label.includes('수입') ? '벌었어요' : '썼어요'}
            </p>
          )
        })()}
      </div>

      {/* 바 그래프 */}
      <div className="overflow-x-auto scrollbar-hide -mx-5 px-4">
        <div className="flex items-end" style={{ height: MAX_H + LABEL_H + 8 + TOP_PAD, paddingTop: TOP_PAD, width: ITEM_W * 12 }}>
          {data.map(d => {
            const isSelected = d.month === selectedMonth
            const hasValue = !d.isFuture && d.value > 0
            const barH = d.isFuture
              ? 6
              : hasValue
                ? Math.max(6, Math.round((d.value / maxValue) * MAX_H))
                : 0
            const barColor = d.isFuture
              ? 'rgba(255,255,255,0.08)'
              : isSelected ? color : 'var(--bar-muted-color)'

            const borderRadius = Math.min(6, Math.max(2, Math.floor(barH / 2)))

            return (
              <div
                key={d.month}
                style={{ width: ITEM_W, flexShrink: 0 }}
                className="flex flex-col items-center justify-end"
                onClick={() => { if (!d.isFuture) setSelectedMonth(d.month) }}
              >
                <div style={{ width: BAR_W, height: barH, backgroundColor: hasValue || d.isFuture ? barColor : 'transparent', borderRadius, marginBottom: 8, flexShrink: 0 }} />
                <span style={{
                  fontSize: 10,
                  fontWeight: isSelected ? 600 : 400,
                  color: isSelected ? 'var(--foreground)' : '#9CA3AF',
                  height: LABEL_H,
                  display: 'flex',
                  alignItems: 'center',
                }}>
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
