'use client'

import { useState } from 'react'
import { CategoryPicker } from './category-picker'

type TransactionType = '수입' | '지출' | '저축'

const CATEGORIES_BY_TYPE: Record<TransactionType, string[]> = {
  '수입': ['월급', '상여금', '부수입'],
  '지출': ['식비', '주거', '통신', '교통', '쇼핑', '건강', '문화', '경조사', '교육'],
  '저축': ['예적금', '투자', '보험'],
}

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
  const [categoriesByType, setCategoriesByType] = useState(CATEGORIES_BY_TYPE)
  const [category, setCategory] = useState(categoriesByType['지출'][0])
  const [categoryPickerOpen, setCategoryPickerOpen] = useState(false)
  const [memo, setMemo] = useState('')

  const date = initialDate || getToday()

  const handleSave = () => {
    const numAmount = parseInt(rawAmount, 10)
    if (!numAmount) return
    onSave({ date, type, amount: numAmount, category, memo })
    setRawAmount('')
    setMemo('')
    onClose()
  }

  const handleClose = () => {
    setRawAmount('')
    setMemo('')
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
      {/* 헤더 */}
      <header className="flex items-center justify-between px-4 pt-[env(safe-area-inset-top,0px)] h-14 border-b border-border bg-background flex-shrink-0">
        <button
          onClick={handleClose}
          className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-muted-foreground"
          aria-label="취소"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
        <h1 className="text-[17px] font-semibold">기록하기</h1>
        <div className="w-8" />
      </header>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        <div className="w-full max-w-md mx-auto p-5">
          {/* 유형 선택 */}
          <div className="flex gap-2 mb-4">
            {(['수입', '지출', '저축'] as TransactionType[]).map((t) => (
              <button
                key={t}
                onClick={() => {
                  setType(t)
                  setCategory(categoriesByType[t][0])
                }}
                className={`flex-1 py-2 rounded-full text-xs font-medium transition-colors ${
                  type === t ? typeColors[t].active : typeColors[t].inactive
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* 날짜 */}
          <p className="text-xs text-muted-foreground mb-4 text-center">
            {formatDateDisplay(date)}
          </p>

          {/* 금액 표시 */}
          <div className="mb-4">
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-4xl font-bold text-muted-foreground">₩</span>
              <span className="text-4xl font-bold tabular-nums">
                {formatAmount(rawAmount)}
              </span>
            </div>
            <div className="h-px bg-border mt-2 mx-8" />
          </div>

          {/* 카테고리 */}
          <div className="mb-3">
            <label className="text-xs text-muted-foreground mb-1 block">카테고리</label>
            <button
              onClick={() => setCategoryPickerOpen(true)}
              className="w-full bg-card rounded-lg px-3 py-2.5 text-sm text-left flex items-center justify-between"
            >
              <span>{category}</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>
            <CategoryPicker
              open={categoryPickerOpen}
              categories={categoriesByType[type]}
              selected={category}
              onSelect={(cat) => {
                setCategory(cat)
                if (!categoriesByType[type].includes(cat)) {
                  setCategoriesByType((prev) => ({
                    ...prev,
                    [type]: [...prev[type], cat],
                  }))
                }
              }}
              onClose={() => setCategoryPickerOpen(false)}
            />
          </div>

          {/* 메모 */}
          <div className="mb-4">
            <label className="text-xs text-muted-foreground mb-1 block">메모</label>
            <input
              type="text"
              placeholder="메모를 입력하세요"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              className="w-full bg-card rounded-lg px-3 py-2.5 text-sm"
            />
          </div>

          {/* 저장 버튼 */}
          <button
            onClick={handleSave}
            className="w-full bg-primary text-primary-foreground rounded-lg py-3 text-sm font-semibold"
          >
            저장하기
          </button>
        </div>
      </div>

      {/* 키패드 (하단 고정) */}
      <div className="w-full max-w-md mx-auto px-4 pb-20 flex-shrink-0">
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
      </div>
    </div>
  )
}
