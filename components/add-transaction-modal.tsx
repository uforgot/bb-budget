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
  const [endDate, setEndDate] = useState('')
  const [endAmount, setEndAmount] = useState('')
  const [recoverOpen, setRecoverOpen] = useState(false)
  const [recoverDate, setRecoverDate] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  })
  const [recoverAmount, setRecoverAmount] = useState('')

  // Populate fields when editing
  useEffect(() => {
    if (editTransaction && open) {
      setType(REVERSE_TYPE_MAP[editTransaction.type] || null)
      setRawAmount(String(editTransaction.amount))
      setCategoryId(editTransaction.category_id)
      setMemo(editTransaction.description || '')
      setEditDate(editTransaction.date)
      setEndDate((editTransaction as any).end_date || '')
      setEndAmount((editTransaction as any).end_amount ? String((editTransaction as any).end_amount) : '')
      setRecoverAmount(String(editTransaction.amount))
      setRecoverOpen(false)
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
    const payload: Record<string, unknown> = {
      type: dbType,
      amount: numAmount,
      category_id: categoryId,
      description: memo || '',
      date,
    }
    if (dbType === 'savings') {
      if (endDate) payload.end_date = endDate
      if (endAmount) payload.end_amount = parseInt(endAmount.replace(/[^0-9]/g, ''))
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
      setEndDate('')
      setEndAmount('')
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
    '지출': { active: 'bg-accent-coral text-white', inactive: 'bg-surface text-muted-foreground' },
    '수입': { active: 'bg-accent-blue text-white', inactive: 'bg-surface text-muted-foreground' },
    '저축': { active: 'bg-accent-mint text-white', inactive: 'bg-surface text-muted-foreground' },
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
        <div className="w-full max-w-md mx-auto px-5 pt-4">
          {/* 날짜 */}
          <div className="relative mb-6 flex justify-center items-center gap-2">
            <label className="text-sm text-muted-foreground cursor-pointer inline-flex items-center gap-1 relative">
              <span>{formatDateDisplay(date)}</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
                <path d="m6 9 6 6 6-6" />
              </svg>
              <input
                type="date"
                value={date}
                onChange={(e) => e.target.value && setEditDate(e.target.value)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                style={{ fontSize: '16px' }}
              />
            </label>

          </div>

          {/* 금액 표시 */}
          <div className="mb-8 cursor-pointer" onClick={() => setKeypadActive(true)}>
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-5xl font-bold text-muted-foreground">₩</span>
              <span className="text-5xl font-bold tabular-nums">
                {formatAmount(rawAmount)}
              </span>
            </div>
          </div>



          {/* 유형 + 카테고리 — 일렬 */}
          <div className="mb-3">
            <div className="flex items-center gap-3 mb-3">
              <label className="text-xs text-muted-foreground flex-shrink-0 w-14">카테고리</label>
              <div className="flex gap-2 flex-1">
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
                    className={`flex-1 py-2.5 rounded-xl text-[15px] font-medium transition-colors ${
                      type === t ? typeColors[t].active : typeColors[t].inactive
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            {categoryId && (
              <div className="flex items-center gap-3 mb-3">
                <div className="w-14" />
                <button
                  onClick={() => setCategoryPickerOpen(true)}
                  className="flex-1 bg-surface rounded-xl px-4 py-2.5 text-[15px] text-left flex items-center justify-between"
                >
                  <span>{categoryLabel}</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>
              </div>
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

          {/* 메모 — 일렬 */}
          <div className="mb-4 flex items-center gap-3">
            <label className="text-xs text-muted-foreground flex-shrink-0 w-14">메모</label>
            <input
              type="text"
              placeholder="메모를 입력하세요"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              onBlur={() => setKeypadActive(true)}
              onFocus={() => setKeypadActive(false)}
              style={{ fontSize: '15px' }}
              className="flex-1 bg-surface rounded-xl px-4 py-2.5"
            />
          </div>


        </div>
      </div>

      {/* 키패드 (하단 고정) */}
      {/* 키패드 + 버튼 (하단 고정) */}
      <div className={`w-full max-w-md mx-auto px-4 flex-shrink-0 ${keypadActive ? '' : 'hidden'}`} style={{ paddingBottom: 'calc(20px + env(safe-area-inset-bottom, 0px))' }}>
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

        {/* 저장/취소 버튼 */}
        {editTransaction ? (
          <div className="flex gap-2 mb-2">
            <button onClick={handleSave} className="flex-1 bg-primary text-primary-foreground rounded-xl py-3.5 text-sm font-semibold">
              {saving ? '저장 중...' : '수정하기'}
            </button>
            {editTransaction.type === 'savings' && (
              <button
                onClick={() => setRecoverOpen(true)}
                className="flex-1 bg-accent-mint/10 text-accent-mint rounded-xl py-3.5 text-sm font-semibold"
              >
                회수하기
              </button>
            )}
            <button
              onClick={async () => {
                const { deleteTransaction } = await import('@/lib/api')
                await deleteTransaction(editTransaction.id)
                setRawAmount(''); setMemo(''); setEditDate(null)
                onClose()
              }}
              className="flex-1 bg-accent-coral/10 text-accent-coral rounded-xl py-3.5 text-sm font-semibold"
            >
              삭제하기
            </button>
          </div>
        ) : (
          <div className="flex gap-3 mb-2">
            <button onClick={handleSave} className="flex-1 bg-primary text-primary-foreground rounded-xl py-3.5 text-sm font-semibold">
              {saving ? '저장 중...' : '저장하기'}
            </button>
            <button onClick={handleClose} className="flex-1 bg-surface text-muted-foreground rounded-xl py-3.5 text-sm font-semibold">
              취소하기
            </button>
          </div>
        )}
      </div>
      {/* 회수 바텀시트 */}
      {recoverOpen && editTransaction && (
        <>
          <div className="fixed inset-0 bg-black/30 z-[60]" onClick={() => setRecoverOpen(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-[70] bg-background rounded-t-2xl shadow-xl animate-slide-up">
            <div className="px-5 pt-5 pb-2">
              <h3 className="text-base font-semibold mb-4">저축 회수</h3>

              {/* 회수일 */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-muted-foreground">회수일</span>
                <label className="text-sm cursor-pointer inline-flex items-center gap-1 relative">
                  <span>{recoverDate ? formatDateDisplay(recoverDate) : '날짜 선택'}</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                  <input
                    type="date"
                    value={recoverDate}
                    onChange={(e) => e.target.value && setRecoverDate(e.target.value)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    style={{ fontSize: '16px' }}
                  />
                </label>
              </div>

              {/* 회수 금액 */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-muted-foreground">회수 금액</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-sm text-muted-foreground">₩</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={recoverAmount ? parseInt(recoverAmount).toLocaleString() : ''}
                    onChange={(e) => setRecoverAmount(e.target.value.replace(/[^0-9]/g, ''))}
                    className="text-sm font-semibold tabular-nums bg-transparent border-none outline-none text-right w-32"
                    style={{ fontSize: '16px' }}
                  />
                </div>
              </div>

              {/* 적용 버튼 */}
              <button
                onClick={async () => {
                  const amount = parseInt(recoverAmount, 10)
                  if (!amount) { alert('금액을 입력해주세요'); return }
                  const { addTransaction, deleteTransaction } = await import('@/lib/api')
                  setSaving(true)
                  try {
                    const catName = (editTransaction.category as any)?.name || '저축'
                    await addTransaction({
                      type: 'income',
                      amount,
                      category_id: editTransaction.category_id,
                      description: `${catName} 회수`,
                      date: recoverDate,
                    })
                    await deleteTransaction(editTransaction.id)
                    setRawAmount(''); setMemo(''); setEditDate(null)
                    setRecoverOpen(false)
                    onClose()
                  } catch (e: unknown) {
                    const msg = e instanceof Error ? e.message : JSON.stringify(e)
                    alert(`회수 실패: ${msg}`)
                  } finally {
                    setSaving(false)
                  }
                }}
                className="w-full bg-accent-mint text-white rounded-xl py-3.5 text-sm font-semibold mb-2"
                style={{ paddingBottom: 'calc(20px + env(safe-area-inset-bottom, 0px))' }}
              >
                {saving ? '처리 중...' : '적용하기'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
