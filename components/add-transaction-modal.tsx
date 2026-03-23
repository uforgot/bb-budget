'use client'

import { useState, useEffect, useRef } from 'react'
import { CategoryPicker } from './category-picker'

type TransactionType = '수입' | '지출' | '저축'

const DEFAULT_CATEGORIES = ['식비', '교통', '쇼핑', '주거', '의료']

interface AddTransactionModalProps {
  open: boolean
  initialDate?: string // YYYY-MM-DD
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

function formatDateDisplay(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  const days = ['일', '월', '화', '수', '목', '금', '토']
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${days[d.getDay()]})`
}

export function AddTransactionModal({ open, initialDate, onClose, onSave }: AddTransactionModalProps) {
  const [type, setType] = useState<TransactionType>('지출')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState(DEFAULT_CATEGORIES[0])
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES)
  const [categoryPickerOpen, setCategoryPickerOpen] = useState(false)
  const [memo, setMemo] = useState('')
  const amountRef = useRef<HTMLInputElement>(null)

  const date = initialDate || getToday()

  useEffect(() => {
    if (open && amountRef.current) {
      setTimeout(() => amountRef.current?.focus(), 100)
    }
  }, [open])

  if (!open) return null

  const handleSave = () => {
    const numAmount = parseInt(amount.replace(/[^0-9]/g, ''), 10)
    if (!numAmount) return
    onSave({ date, type, amount: numAmount, category, memo })
    setAmount('')
    setMemo('')
    onClose()
  }

  const typeColors: Record<TransactionType, { active: string; inactive: string }> = {
    '지출': { active: 'bg-red-400 text-white', inactive: 'bg-muted text-muted-foreground' },
    '수입': { active: 'bg-blue-400 text-white', inactive: 'bg-muted text-muted-foreground' },
    '저축': { active: 'bg-green-400 text-white', inactive: 'bg-muted text-muted-foreground' },
  }

  return (
    <div className="fixed inset-0 z-50 bg-background overflow-y-auto">
      <div className="w-full max-w-md mx-auto p-5 pb-20">
        {/* Header: X / 기록하기 / ✓ */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onClose}
            className="size-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground"
            aria-label="취소"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18" /><path d="m6 6 12 12" />
            </svg>
          </button>
          <h2 className="text-base font-semibold">기록하기</h2>
          <button
            onClick={handleSave}
            className="size-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground"
            aria-label="저장"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </button>
        </div>

        {/* 유형 선택 */}
        <div className="flex gap-2 mb-6">
          {(['지출', '수입', '저축'] as TransactionType[]).map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`flex-1 py-2.5 rounded-full text-sm font-medium transition-colors ${
                type === t ? typeColors[t].active : typeColors[t].inactive
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* 날짜 */}
        <p className="text-sm text-muted-foreground mb-6 text-center">
          {formatDateDisplay(date)}
        </p>

        {/* 금액 - 크게 */}
        <div className="mb-8">
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-2xl text-muted-foreground">₩</span>
            <input
              ref={amountRef}
              type="text"
              inputMode="numeric"
              placeholder="0"
              value={amount}
              onChange={(e) => {
                const raw = e.target.value.replace(/[^0-9]/g, '')
                setAmount(raw ? parseInt(raw).toLocaleString() : '')
              }}
              className="text-4xl font-bold tabular-nums bg-transparent border-none outline-none text-center w-full"
              style={{ caretColor: 'var(--foreground)' }}
            />
          </div>
          <div className="h-px bg-border mt-2 mx-8" />
        </div>

        {/* 카테고리 */}
        <div className="mb-4">
          <label className="text-xs text-muted-foreground mb-1 block">카테고리</label>
          <button
            onClick={() => setCategoryPickerOpen(true)}
            className="w-full bg-card border border-border rounded-lg px-3 py-2.5 text-sm text-left flex items-center justify-between"
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
            className="w-full bg-card border border-border rounded-lg px-3 py-2.5 text-sm"
          />
        </div>
      </div>
    </div>
  )
}
