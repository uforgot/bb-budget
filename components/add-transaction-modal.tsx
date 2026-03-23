'use client'

import { useState } from 'react'
import { CategoryPicker } from './category-picker'

type TransactionType = '수입' | '지출' | '저축'

const DEFAULT_CATEGORIES = ['식비', '교통', '쇼핑', '주거', '의료']

interface AddTransactionModalProps {
  open: boolean
  onClose: () => void
  onSave: (data: {
    date: string
    type: TransactionType
    amount: number
    category: string
    memo: string
  }) => void
}

function getToday() {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function AddTransactionModal({ open, onClose, onSave }: AddTransactionModalProps) {
  const [date, setDate] = useState(getToday())
  const [type, setType] = useState<TransactionType>('지출')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState(DEFAULT_CATEGORIES[0])
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES)
  const [categoryPickerOpen, setCategoryPickerOpen] = useState(false)
  const [memo, setMemo] = useState('')

  if (!open) return null

  const handleSave = () => {
    const numAmount = parseInt(amount.replace(/[^0-9]/g, ''), 10)
    if (!numAmount) return
    onSave({ date, type, amount: numAmount, category, memo })
    // Reset
    setAmount('')
    setMemo('')
    onClose()
  }

  const typeColors: Record<TransactionType, string> = {
    '지출': 'bg-red-400/20 text-red-400 border-red-400',
    '수입': 'bg-blue-400/20 text-blue-400 border-blue-400',
    '저축': 'bg-green-400/20 text-green-400 border-green-400',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Sheet */}
      <div className="relative w-full max-w-md bg-card border-t border-border rounded-t-2xl p-5 pb-20 overflow-y-auto max-h-[85dvh]">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold">기록하기</h2>
          <button
            onClick={onClose}
            className="p-1 text-muted-foreground hover:text-foreground"
            aria-label="닫기"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18" /><path d="m6 6 12 12" />
            </svg>
          </button>
        </div>

        <div className="flex flex-col gap-4">
          {/* 일자 */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">일자</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm tabular-nums"
            />
          </div>

          {/* 유형 */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">유형</label>
            <div className="grid grid-cols-3 gap-2">
              {(['지출', '수입', '저축'] as TransactionType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={`py-2 rounded-lg text-sm font-medium border transition-colors ${
                    type === t
                      ? typeColors[t]
                      : 'border-border text-muted-foreground'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* 금액 */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">금액</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₩</span>
              <input
                type="text"
                inputMode="numeric"
                placeholder="0"
                value={amount}
                onChange={(e) => {
                  const raw = e.target.value.replace(/[^0-9]/g, '')
                  setAmount(raw ? parseInt(raw).toLocaleString() : '')
                }}
                className="w-full bg-background border border-border rounded-lg pl-7 pr-3 py-2.5 text-sm tabular-nums"
              />
            </div>
          </div>

          {/* 카테고리 */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">카테고리</label>
            <button
              onClick={() => setCategoryPickerOpen(true)}
              className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-left flex items-center justify-between"
            >
              <span>{category}</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>
            <CategoryPicker
              open={categoryPickerOpen}
              categories={categories}
              selected={category}
              onSelect={(cat) => {
                setCategory(cat)
                if (!categories.includes(cat)) {
                  setCategories([...categories, cat])
                }
              }}
              onClose={() => setCategoryPickerOpen(false)}
            />
          </div>

          {/* 메모 */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">메모</label>
            <input
              type="text"
              placeholder="메모를 입력하세요"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm"
            />
          </div>

          {/* 저장 버튼 */}
          <button
            onClick={handleSave}
            className="w-full bg-primary text-primary-foreground rounded-lg py-3 text-sm font-semibold mt-1"
          >
            저장하기
          </button>
        </div>
      </div>
    </div>
  )
}
