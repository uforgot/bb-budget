'use client'

import { useState } from 'react'

interface MonthData {
  month: number
  value: number
  isFuture: boolean
}

interface MonthlyBarChartProps {
  data: MonthData[]
  label: string
  color?: string
  avgExpense?: number
}

export function MonthlyBarChart({ data, label, color = '#CF6679', avgExpense }: MonthlyBarChartProps) {
  const today = new Date()
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1)

  const BAR_W = 28
  const BAR_GAP = 16
  const ITEM_W = BAR_W + BAR_GAP
  const MAX_H = 120
  const LABEL_H = 24

  const maxValue = Math.max(...data.filter(d => !d.isFuture).map(d => d.value), 1)
  const selectedData = data.find(d => d.month === selectedMonth)

  return (
    <div className="bg-surface rounded-2xl px-5 pt-5 pb-6 mb-4">
      {/* 헤더 */}
      <div className="mb-5">
        <p className="text-[13px] font-semibold text-white/80 mb-0.5">
          {selectedData ? `${selectedData.month}월에 ${label}` : label}
        </p>
        <div className="flex items-baseline gap-2">
          <p className="text-[24px] font-bold tabular-nums leading-tight" style={{ letterSpacing: '-1px', color }}>
            {selectedData && !selectedData.isFuture && selectedData.value > 0
              ? `₩${selectedData.value.toLocaleString()}`
              : '—'}
          </p>
          {avgExpense != null && avgExpense > 0 && selectedData && !selectedData.isFuture && selectedData.value > 0 && (
            <p className="text-[12px] text-white/40 tabular-nums">
              평균 ₩{avgExpense.toLocaleString()}
            </p>
          )}
        </div>
        {selectedData && !selectedData.isFuture && selectedData.value > 0 && avgExpense != null && avgExpense > 0 && (() => {
          const diff = selectedData.value - avgExpense
          if (diff === 0) return null
          const isOver = diff > 0
          return (
            <p className="text-[12px] mt-0.5 text-white/50">
              월 평균보다 ₩{Math.abs(diff).toLocaleString()}원 {isOver ? '더' : '덜'} 썼어요
            </p>
          )
        })()}
      </div>

      {/* 바 그래프 */}
      <div className="overflow-x-auto scrollbar-hide -mx-5 px-5">
        <div className="flex items-end" style={{ height: MAX_H + LABEL_H, width: ITEM_W * 12 }}>
          {data.map(d => {
            const isSelected = d.month === selectedMonth
            const barH = d.isFuture || d.value === 0
              ? 6
              : Math.max(6, Math.round((d.value / maxValue) * MAX_H))
            const barColor = d.isFuture
              ? 'rgba(255,255,255,0.08)'
              : isSelected ? color : 'rgba(255,255,255,0.2)'

            return (
              <div
                key={d.month}
                style={{ width: ITEM_W, flexShrink: 0 }}
                className="flex flex-col items-center justify-end"
                onClick={() => { if (!d.isFuture) setSelectedMonth(d.month) }}
              >
                <div style={{ width: BAR_W, height: barH, backgroundColor: barColor, borderRadius: 6, marginBottom: 8, flexShrink: 0 }} />
                <span style={{
                  fontSize: 11,
                  fontWeight: isSelected ? 600 : 400,
                  color: isSelected ? '#fff' : 'rgba(255,255,255,0.35)',
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
