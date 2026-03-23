'use client'

import { useState } from 'react'
import { CategoryPicker } from './category-picker'

type TransactionType = '수입' | '지출' | '저축'

const DEFAULT_CATEGORIES = ['식비', '교통', '쇼핑', '주거', '의료']

interface AddTransactionModalProps {
  open: boolean
  initialDate?: string
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

function formatAmount(raw: string) {
  if (!raw) return '0'
  return parseInt(raw).toLocaleString()
}

export function AddTransactionModal({ open, initialDate, onClose, onSave }: AddTransactionModalProps) {
  const [type, setType] = useState<TransactionType>('지출')
  const [rawAmount, setRawAmount] = useState('')
  const [category, setCategory] = useState(DEFAULT_CATEGORIES[0])
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES)
  const [categoryPickerOpen, setCategoryPickerOpen] = useState(false)
  const [memo, setMemo] = useState('')
  const [showDetails, setShowDetails] = useState(false)

  const date = initialDate || getToday()

  const handleSave = () => {
    const numAmount = parseInt(rawAmount, 10)
    if (!numAmount) return
    onSave({ date, type, amount: numAmount, category, memo })
    setRawAmount('')
    setMemo('')
    setShowDetails(false)
    onClose()
  }

  const handleClose = () => {
    setRawAmount('')
    setMemo('')
    setShowDetails(false)
    onClose()
  }

  const handleKeypad = (key: string) => {
    if (key === 'backspace') {
      setRawAmount((prev) => prev.slice(0, -1))
    } else if (key === '00') {
      if (rawAmount.length > 0 && rawAmount.length <= 10) {
        setRawAmount((prev) => prev + '00')
      }
    } else {
      if (rawAmount.length <= 12) {
        setRawAmount((prev) => prev + key)
      }
    }
  }

  const typeColors: Record<TransactionType, { active: string; inactive: string }> = {
    '지출': { active: 'bg-red-400 text-white', inactive: 'bg-muted text-muted-foreground' },
    '수입': { active: 'bg-blue-400 text-white', inactive: 'bg-muted text-muted-foreground' },
    '저축': { active: 'bg-green-400 text-white', inactive: 'bg-muted text-muted-foreground' },
  }

  const keypadKeys = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['00', '0', 'backspace'],
  ]

  return (
    <div
      className={`fixed inset-0 z-50 bg-background flex flex-col transition-transform duration-200 ${
        open ? 'translate-y-0' : 'translate-y-full pointer-events-none'
      }`}
    >
      {/* Scrollable top area */}
      <div className="flex-1 overflow-y-auto">
        <div className="w-full max-w-md mx-auto p-5">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold">기록하기</h2>
            <button
              onClick={handleClose}
              className="p-1 text-muted-foreground hover:text-foreground"
              aria-label="취소"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6 6 18" /><path d="m6 6 12 12" />
              </svg>
            </button>
          </div>

          {/* 유형 선택 */}
          <div className="flex gap-2 mb-4">
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
          <p className="text-sm text-muted-foreground mb-4 text-center">
            {formatDateDisplay(date)}
          </p>

          {/* 금액 표시 */}
          <div className="mb-4">
            <div className="flex items-baseline justify-center gap-2">
              <span className="text-5xl font-bold text-muted-foreground">₩</span>
              <span className="text-5xl font-bold tabular-nums">
                {formatAmount(rawAmount)}
              </span>
            </div>
            <div className="h-px bg-border mt-2 mx-8" />
          </div>

          {/* 카테고리/메모 토글 */}
          {!showDetails ? (
            <button
              onClick={() => setShowDetails(true)}
              className="w-full text-sm text-blue-400 text-center py-2"
            >
              카테고리 · 메모 추가
            </button>
          ) : (
            <div className="space-y-3 mb-2">
              {/* 카테고리 */}
              <div>
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
          )}
        </div>
      </div>

      {/* 키패드 + 저장 (하단 고정) */}
      <div className="w-full max-w-md mx-auto px-4 pb-[env(safe-area-inset-bottom,8px)] flex-shrink-0">
        <div className="grid grid-cols-3 gap-px mb-3">
          {keypadKeys.map((row, ri) =>
            row.map((key) => (
              <button
                key={`${ri}-${key}`}
                onClick={() => handleKeypad(key)}
                className="h-14 flex items-center justify-center text-xl font-medium rounded-lg active:bg-muted transition-colors"
              >
                {key === 'backspace' ? (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                    <path d="M3 12l5-7h12a1 1 0 011 1v12a1 1 0 01-1 1H8l-5-7z" />
                  </svg>
                ) : (
                  key
                )}
              </button>
            ))
          )}
        </div>

        <button
          onClick={handleSave}
          className="w-full bg-primary text-primary-foreground rounded-lg py-3 text-sm font-semibold mb-2"
        >
          저장하기
        </button>
      </div>
    </div>
  )
}
