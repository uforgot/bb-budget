'use client'

import { useRef } from 'react'

interface SummaryCard {
  label: string       // "N월 번 수입"
  amount: number
  diff: number | null // 전월 대비 (null이면 비교 없음)
  diffLabel: string   // "N-1월보다"
  color: string       // tailwind text class
}

function fmt(n: number) {
  const abs = Math.abs(n)
  if (abs >= 100000000) return `${Math.floor(abs / 100000000)}억`
  if (abs >= 10000) return `${Math.floor(abs / 10000).toLocaleString()}만`
  return abs.toLocaleString()
}

function diffText(diff: number | null, type: 'income' | 'expense' | 'savings' | 'balance', prevLabel: string): string {
  if (diff === null) return ''
  if (diff === 0) return '변동이 없어요.'
  const fmted = fmt(diff)
  const sign = diff > 0 ? '더 ' : ''
  const less = diff < 0 ? '덜 ' : ''
  if (type === 'income') return diff > 0 ? `${prevLabel}보다 ${fmted}원 더 벌었어요.` : `${prevLabel}보다 ${fmt(-diff)}원 덜 벌었어요.`
  if (type === 'expense') return diff > 0 ? `${prevLabel}보다 ${fmted}원 더 썼어요.` : `${prevLabel}보다 ${fmt(-diff)}원 덜 썼어요.`
  if (type === 'savings') return diff > 0 ? `${prevLabel}보다 ${fmted}원 더 저축했어요.` : `${prevLabel}보다 ${fmt(-diff)}원 줄었어요.`
  return diff > 0 ? `${prevLabel}보다 ${fmted}원 늘었어요.` : `${prevLabel}보다 ${fmt(-diff)}원 줄었어요.`
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
  prevMonth, prevIncome, prevExpense, prevSavings, prevBalance,
  hasPrev,
}: SummaryCardSliderProps) {
  const prevLabel = `${prevMonth}월`

  const cards = [
    {
      label: `${month}월 번 수입`,
      amount: income,
      diff: hasPrev ? income - prevIncome : null,
      type: 'income' as const,
      color: 'text-accent-blue',
    },
    {
      label: `${month}월 쓴 지출`,
      amount: expense,
      diff: hasPrev ? expense - prevExpense : null,
      type: 'expense' as const,
      color: 'text-accent-coral',
    },
    {
      label: `${month}월 한 저축`,
      amount: savings,
      diff: hasPrev ? savings - prevSavings : null,
      type: 'savings' as const,
      color: 'text-accent-mint',
    },
    {
      label: `${month}월 남은 잔액`,
      amount: balance,
      diff: hasPrev ? balance - prevBalance : null,
      type: 'balance' as const,
      color: balance >= 0 ? 'text-foreground' : 'text-accent-coral',
    },
  ]

  return (
    <div className="overflow-x-auto scrollbar-hide mb-4 -mx-5 px-5">
      <div className="flex gap-3" style={{ width: 'max-content' }}>
        {cards.map(card => {
          const dt = diffText(card.diff, card.type, prevLabel)
          return (
            <div
              key={card.label}
              className="bg-surface rounded-2xl px-5 py-4 flex flex-col justify-between"
              style={{ width: '200px', minHeight: '110px' }}
            >
              <p className="text-[12px] text-muted-foreground mb-2">{card.label}</p>
              <p className={`text-[22px] font-bold tabular-nums ${card.color}`}>
                ₩{card.amount.toLocaleString()}
              </p>
              {dt && (
                <p className="text-[11px] text-muted-foreground mt-2 leading-tight">{dt}</p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
