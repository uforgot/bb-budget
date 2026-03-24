'use client'

import { useState, useEffect } from 'react'
import { CategoryPicker } from './category-picker'
import { getCategories, addTransaction, updateTransaction, type Category, type Transaction } from '@/lib/api'

type TransactionType = '수입' | '지출' | '저축'

const TYPE_MAP: Record<TransactionType, string> = { '수입': 'income', '지출': 'expense', '저축': 'savings' }

interface AddTransactionModalProps {
  open: boolean
  initialDate?: string
  editTransaction?: Transaction | null
  onClose: () => void
  onSave: (data: {
    date: string
    type: TransactionType
    amount: number
    category: string
    memo: string
  }) => void
}

const REVERSE_TYPE_MAP: Record<string, TransactionType> = { income: '수입', expense: '지출', savings: '저축' }

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
  const dayNames = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일']
  return `${d.getMonth() + 1}월 ${d.getDate()}일 ${dayNames[d.getDay()]}`
}

function formatAmount(raw: string) {
  if (!raw) return '0'
  return parseInt(raw).toLocaleString()
}

export function AddTransactionModal({ open, initialDate, editTransaction, onClose, onSave }: AddTransactionModalProps) {
  const [type, setType] = useState<TransactionType | null>(null)
  const [rawAmount, setRawAmount] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [categoryLabel, setCategoryLabel] = useState('카테고리 선택')
  const [categoryPickerOpen, setCategoryPickerOpen] = useState(false)
  const [memo, setMemo] = useState('')
  const [keypadActive, setKeypadActive] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editDate, setEditDate] = useState<string | null>(null)

  // Populate fields when editing
  useEffect(() => {
    if (editTransaction && open) {
      setType(REVERSE_TYPE_MAP[editTransaction.type] || null)
      setRawAmount(String(editTransaction.amount))
      setCategoryId(editTransaction.category_id)
      setMemo(editTransaction.description || '')
      setEditDate(editTransaction.date)
      // parent > child 라벨 구성
      const dbType = editTransaction.type
      getCategories(dbType).then(cats => {
        const cat = cats.find(c => c.id === editTransaction.category_id)
        if (cat?.parent_id) {
          const parent = cats.find(c => c.id === cat.parent_id)
          setCategoryLabel(parent ? `${parent.name} > ${cat.name}` : cat.name)
        } else if (cat) {
          setCategoryLabel(cat.name)
        }
      })
    } else if (!editTransaction && open) {
      // Reset for new entry
    }
  }, [editTransaction, open])

  const date = editDate || initialDate || getToday()

  const handleSave = async () => {
    const numAmount = parseInt(rawAmount, 10)
    if (!numAmount || !categoryId || !type || saving) {
      console.log('저장 차단:', { numAmount, categoryId, type, saving })
      if (!numAmount) alert('금액을 입력해주세요')
      else if (!type) alert('수입/지출/저축을 선택해주세요')
      else if (!categoryId) alert('카테고리를 선택해주세요')
      return
    }
    const dbType = TYPE_MAP[type!]
    const payload = {
      type: dbType,
      amount: numAmount,
      category_id: categoryId,
      description: memo || '',
      date,
    }
    setSaving(true)
    try {
      if (editTransaction) {
        await updateTransaction(editTransaction.id, payload)
      } else {
        await addTransaction(payload)
      }
      onSave({ date, type: type!, amount: numAmount, category: categoryLabel, memo })
      setRawAmount('')
      setMemo('')
      setCategoryId('')
      setCategoryLabel('카테고리 선택')
      setEditDate(null)
      onClose()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : JSON.stringify(e)
      console.error('저장 실패:', msg)
      alert(`저장 실패: ${msg}`)
    } finally {
      setSaving(false)
    }
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
    '지출': { active: 'bg-accent-coral text-white', inactive: 'bg-muted text-muted-foreground' },
    '수입': { active: 'bg-accent-blue text-white', inactive: 'bg-muted text-muted-foreground' },
    '저축': { active: 'bg-accent-mint text-white', inactive: 'bg-muted text-muted-foreground' },
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
        <h1 className="text-[17px] font-semibold">{editTransaction ? '수정하기' : '기록하기'}</h1>
        <div className="w-8" />
      </header>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        <div className="w-full max-w-md mx-auto p-5">
          {/* 날짜 */}
          <p className="text-xs text-muted-foreground mb-4 text-center">
            {formatDateDisplay(date)}
          </p>

          {/* 금액 표시 */}
          <div className="mb-4 cursor-pointer" onClick={() => setKeypadActive(true)}>
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-4xl font-bold text-muted-foreground">₩</span>
              <span className="text-4xl font-bold tabular-nums">
                {formatAmount(rawAmount)}
              </span>
            </div>
            <div className={`h-px mt-2 mx-8 ${keypadActive ? 'bg-accent-blue' : 'bg-border'}`} />
          </div>

          {/* 유형 + 카테고리 */}
          <div className="mb-3">
            <label className="text-xs text-muted-foreground mb-1 block">카테고리</label>
            <div className="flex gap-2 mb-2">
              {(['수입', '지출', '저축'] as TransactionType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    if (type !== t) {
                      setCategoryId('')
                      setCategoryLabel('카테고리 선택')
                    }
                    setType(t)
                    setCategoryPickerOpen(true)
                  }}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    type === t ? typeColors[t].active : typeColors[t].inactive
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            {categoryId && (
              <button
                onClick={() => setCategoryPickerOpen(true)}
                className="w-full bg-card rounded-lg px-3 py-2.5 text-sm text-left flex items-center justify-between"
              >
                <span>{categoryLabel}</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>
            )}
            <CategoryPicker
              open={categoryPickerOpen && type !== null}
              type={type ? TYPE_MAP[type] as 'income' | 'expense' | 'savings' : 'expense'}
              selected={categoryId}
              onSelect={(id, label) => {
                setCategoryId(id)
                setCategoryLabel(label)
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
              onBlur={() => setKeypadActive(true)}
              onFocus={() => setKeypadActive(false)}
              style={{ fontSize: '16px' }}
              className="w-full bg-card rounded-lg px-3 py-2.5"
            />
          </div>

          {/* 저장/삭제 버튼 */}
          {editTransaction ? (
            <div className="flex gap-3">
              <button
                onClick={handleSave}
                className="flex-1 bg-primary text-primary-foreground rounded-lg py-3 text-sm font-semibold"
              >
                {saving ? '저장 중...' : '수정하기'}
              </button>
              <button
                onClick={async () => {
                  const { deleteTransaction } = await import('@/lib/api')
                  await deleteTransaction(editTransaction.id)
                  setRawAmount('')
                  setMemo('')
                  setEditDate(null)
                  onClose()
                }}
                className="flex-1 bg-accent-coral/10 text-accent-coral rounded-lg py-3 text-sm font-semibold"
              >
                삭제하기
              </button>
            </div>
          ) : (
            <button
              onClick={handleSave}
              className="w-full bg-primary text-primary-foreground rounded-lg py-3 text-sm font-semibold"
            >
              {saving ? '저장 중...' : '저장하기'}
            </button>
          )}
        </div>
      </div>

      {/* 키패드 (하단 고정) */}
      <div className={`w-full max-w-md mx-auto px-4 pb-20 flex-shrink-0 ${keypadActive ? '' : 'hidden'}`}>
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
