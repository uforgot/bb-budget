'use client'

import { useState, useEffect, useRef } from 'react'
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
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 ${dayNames[d.getDay()]}`
}

function formatAmount(raw: string) {
  if (!raw) return '0'
  return parseInt(raw).toLocaleString()
}

function formatKorean(raw: string) {
  const n = parseInt(raw || '0')
  if (!n) return '0원'
  const eok = Math.floor(n / 100000000)
  const man = Math.floor((n % 100000000) / 10000)
  const rest = n % 10000
  let result = ''
  if (eok) result += `${eok}억 `
  if (man) result += `${man}만 `
  if (rest) result += `${rest.toLocaleString()}`
  return result.trim() + '원'
}

export function AddTransactionModal({ open, initialDate, editTransaction, onClose, onSave }: AddTransactionModalProps) {
  const [type, setType] = useState<TransactionType | null>(null)
  const [rawAmount, setRawAmount] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [categoryLabel, setCategoryLabel] = useState('카테고리 선택')
  const [categoryPickerOpen, setCategoryPickerOpen] = useState(false)
  const [memo, setMemo] = useState('')
  const [keypadActive, setKeypadActive] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editDate, setEditDate] = useState<string | null>(null)
  const [endDate, setEndDate] = useState('')
  const [endAmount, setEndAmount] = useState('')
  const [recoverOpen, setRecoverOpen] = useState(false)
  const [recentCategories, setRecentCategories] = useState<Array<{ id: string; label: string; type: string }>>([])
  const [repeatFrequency, setRepeatFrequency] = useState<'none' | 'weekly' | 'monthly' | 'yearly'>('none')
  const [repeatDropdownOpen, setRepeatDropdownOpen] = useState(false)
  const [linkedRecurringId, setLinkedRecurringId] = useState<string | null>(null)
  const [repeatEndDate, setRepeatEndDate] = useState(() => {
    const d = new Date(); d.setMonth(d.getMonth() + 1)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  })
  const repeatDropdownRef = useRef<HTMLDivElement>(null)
  const amountInputRef = useRef<HTMLInputElement>(null)

  // 최근 사용 카테고리 로드
  useEffect(() => {
    if (!open) return
    ;(async () => {
      try {
        const { getTransactions, getCategories: getCats } = await import('@/lib/api')
        const txs = await getTransactions({})
        const cats = await getCats()
        // 최근 트랜잭션에서 카테고리 ID 추출 (중복 제거, 최근 순)
        const seen = new Set<string>()
        const recent: Array<{ id: string; label: string; type: string }> = []
        for (const tx of txs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())) {
          if (!tx.category_id || seen.has(tx.category_id)) continue
          seen.add(tx.category_id)
          const cat = cats.find(c => c.id === tx.category_id)
          if (!cat) continue
          const parent = cat.parent_id ? cats.find(c => c.id === cat.parent_id) : null
          const label = parent ? `${parent.name} · ${cat.name}` : cat.name
          recent.push({ id: cat.id, label, type: tx.type })
          if (recent.length >= 5) break
        }
        setRecentCategories(recent)
      } catch {}
    })()
  }, [open])
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
      setCategoryPickerOpen(false)
      setLinkedRecurringId(null)
      setRepeatFrequency('none')
      setRepeatDropdownOpen(false)
      const d = new Date(); d.setMonth(d.getMonth() + 1)
      setRepeatEndDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`)
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
      ;(async () => {
        try {
          const { getRecurringTransactions } = await import('@/lib/api')
          const recurring = await getRecurringTransactions()
          const matched = recurring.find((item: any) =>
            item.type === editTransaction.type &&
            item.amount === editTransaction.amount &&
            item.category_id === editTransaction.category_id &&
            (item.description || '') === (editTransaction.description || '') &&
            item.anchor_date === editTransaction.date
          )
          if (matched) {
            setLinkedRecurringId(matched.id)
            setRepeatFrequency(matched.frequency || 'monthly')
            setRepeatEndDate(matched.end_date || '')
          }
        } catch {}
      })()
    } else if (!editTransaction && open) {
      setLinkedRecurringId(null)
      setRepeatFrequency('none')
      setRepeatDropdownOpen(false)
      const d = new Date(); d.setMonth(d.getMonth() + 1)
      setRepeatEndDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`)
    }
  }, [editTransaction, open])

  // 반복 드롭다운 바깥 클릭 시 닫기
  useEffect(() => {
    if (!repeatDropdownOpen) return
    const handler = (e: MouseEvent) => {
      if (repeatDropdownRef.current && !repeatDropdownRef.current.contains(e.target as Node)) {
        setRepeatDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [repeatDropdownOpen])

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
        if (linkedRecurringId) {
          const { updateRecurringTransaction, deleteRecurringTransaction } = await import('@/lib/api')
          if (repeatFrequency === 'none') {
            await deleteRecurringTransaction(linkedRecurringId)
          } else {
            await updateRecurringTransaction(linkedRecurringId, {
              type: dbType,
              amount: numAmount,
              category_id: categoryId,
              description: memo || null,
              frequency: repeatFrequency,
              anchor_date: date,
              end_date: repeatEndDate,
              active: true,
            })
          }
        }
      } else {
        await addTransaction(payload)
        if (repeatFrequency !== 'none') {
          const { addRecurringTransaction } = await import('@/lib/api')
          await addRecurringTransaction({
            type: dbType,
            amount: numAmount,
            category_id: categoryId,
            description: memo || null,
            frequency: repeatFrequency,
            anchor_date: date,
            end_date: repeatEndDate,
            active: true,
          })
        }
      }
      onSave({ date, type: type!, amount: numAmount, category: categoryLabel, memo })
      setRawAmount('')
      setMemo('')
      setCategoryId('')
      setCategoryLabel('카테고리 선택')
      setEditDate(null)
      setEndDate('')
      setEndAmount('')
      setRepeatFrequency('none')
      const d = new Date(); d.setMonth(d.getMonth() + 1)
      setRepeatEndDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`)
      setKeypadActive(false)
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
    '수입': { active: 'bg-[#14b8a6] text-white', inactive: 'bg-surface text-muted-foreground' },
    '저축': { active: 'bg-accent-purple text-white', inactive: 'bg-surface text-muted-foreground' },
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
      <header className="flex items-center justify-between px-5 pt-[env(safe-area-inset-top,0px)] h-14 bg-background flex-shrink-0">
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
        {editTransaction ? (
          <button
            onClick={async () => {
              if (!confirm('삭제할까요?')) return
              const { deleteTransaction } = await import('@/lib/api')
              await deleteTransaction(editTransaction.id)
              setRawAmount(''); setMemo(''); setEditDate(null)
              onClose()
            }}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-accent-coral/10 text-accent-coral"
            aria-label="삭제"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" />
            </svg>
          </button>
        ) : (
          <div className="w-8" />
        )}
      </header>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        <div className="w-full max-w-md mx-auto px-5 pt-6 pb-4">
          {/* 전체 폼 통합 박스 */}
          <div className="mb-3 bg-surface rounded-[22px] overflow-visible">
            <div className="flex items-center justify-between px-4 py-3.5">
              <span className="text-[16px]">날짜</span>
              <label className="relative cursor-pointer">
                <span className="bg-muted text-foreground px-3 py-1.5 rounded-lg text-[15px] font-medium">
                  {(() => {
                    const d = new Date(date + 'T00:00:00')
                    const days = ['일', '월', '화', '수', '목', '금', '토']
                    return `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}. (${days[d.getDay()]})`
                  })()}
                </span>
                <input
                  type="date"
                  value={date}
                  onFocus={() => setKeypadActive(false)}
                  onChange={(e) => e.target.value && setEditDate(e.target.value)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  style={{ fontSize: '16px' }}
                />
              </label>
            </div>
            <div className="border-t border-border mx-4" />
            {/* 카테고리 */}
            {/* 타입 선택 행 */}
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-[16px]">카테고리</span>
              <div className="flex gap-1.5">
                {(['수입', '지출', '저축'] as TransactionType[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => {
                      setKeypadActive(false)
                      if (type === t) {
                        // 재클릭 → 선택 해제
                        setType(null)
                        setCategoryId('')
                        setCategoryLabel('카테고리 선택')
                        setCategoryPickerOpen(false)
                      } else {
                        setCategoryId('')
                        setCategoryLabel('카테고리 선택')
                        setType(t)
                        setCategoryPickerOpen(true)
                      }
                    }}
                    className={`px-3 py-1.5 rounded-lg text-[14px] font-medium transition-colors ${
                      type === t ? typeColors[t].active : 'bg-[#f5f5f7] dark:bg-muted text-muted-foreground'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            {/* 선택된 카테고리 표시 (타입 선택 후, 그리드 닫혔을 때) */}
            {type && categoryId && !categoryPickerOpen && (
              <>
                <div className="border-t border-border mx-4" />
                <button
                  onClick={() => {
                    setKeypadActive(false)
                    setCategoryPickerOpen(true)
                  }}
                  className="w-full flex items-center justify-between px-4 py-3.5"
                >
                  <span className="text-[16px]">{categoryLabel}</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </button>
              </>
            )}

            {/* 인라인 카테고리 그리드 */}
            {categoryPickerOpen && type !== null && (
              <div className="px-3 pb-3">
                <CategoryPicker
                  open={categoryPickerOpen && type !== null}
                  inline
                  type={type ? TYPE_MAP[type] as 'income' | 'expense' | 'savings' : 'expense'}
                  selected={categoryId}
                  onSelect={(id, label) => {
                    setCategoryId(id)
                    setCategoryLabel(label)
                    setCategoryPickerOpen(false)
                  }}
                  onClose={() => setCategoryPickerOpen(false)}
                />
              </div>
            )}
            <div className="border-t border-border mx-4" />
            <div className="flex items-center justify-between px-4 py-3.5" onClick={() => amountInputRef.current?.focus()}>
              <span className="text-[16px]">금액</span>
              <div className="flex flex-col items-end">
                <div className="flex items-baseline justify-end">
                  <span className="text-[16px] font-semibold tabular-nums text-foreground">₩{rawAmount ? parseInt(rawAmount).toLocaleString() : '0'}</span>
                  <input
                    ref={amountInputRef}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={rawAmount}
                    onChange={e => {
                      const v = e.target.value.replace(/[^0-9]/g, '')
                      if (v.length <= 10) setRawAmount(v)
                    }}
                    className="sr-only"
                    placeholder="0"
                  />
                </div>
                {rawAmount ? (
                  <span className="text-[12px] text-muted-foreground">
                    {formatKorean(rawAmount)}
                  </span>
                ) : null}
              </div>
            </div>
            <div className="border-t border-border mx-4" />
            <div className="flex items-center justify-between px-4 py-3.5">
              <span className="text-[16px]">메모</span>
              <input
                type="text"
                placeholder="입력"
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                onBlur={() => setKeypadActive(false)}
                onFocus={() => setKeypadActive(false)}
                style={{ fontSize: '16px', textAlign: 'right' }}
                className="bg-transparent text-muted-foreground placeholder:text-muted-foreground/50 outline-none w-40"
              />
            </div>
          {(!editTransaction || linkedRecurringId) && (
            <>
              <div className="border-t border-border mx-4" />
              <div ref={repeatDropdownRef}>
              {/* 반복 행 */}
              <div className="relative">
                <button
                  onClick={() => { setKeypadActive(false); setRepeatDropdownOpen(prev => !prev) }}
                  className="w-full flex items-center justify-between px-4 py-3.5"
                >
                  <span className="text-[16px]">반복</span>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <span className="text-[16px]">
                      {{ none: '안 함', weekly: '매주', monthly: '매월', yearly: '매년' }[repeatFrequency]}
                    </span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </div>
                </button>
                {repeatDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-[22px] overflow-hidden z-20 shadow-lg">
                    {(['none', 'weekly', 'monthly', 'yearly'] as const).map((opt, i) => (
                      <button
                        key={opt}
                        onClick={() => {
                          setRepeatFrequency(opt)
                          setRepeatDropdownOpen(false)
                        }}
                        className={`w-full px-4 py-3.5 text-[16px] flex items-center justify-between transition-colors ${
                          i > 0 ? 'border-t border-border' : ''
                        } active:bg-muted`}
                      >
                        <span>{{ none: '안 함', weekly: '매주', monthly: '매월', yearly: '매년' }[opt]}</span>
                        {repeatFrequency === opt && (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{color:"#14b8a6"}}>
                            <path d="M20 6 9 17l-5-5" />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 종료일 행 (반복 선택 시) */}
              {repeatFrequency !== 'none' && (
                <>
                  <div className="border-t border-border mx-4" />
                  <div className="flex items-center justify-between px-4 py-3.5">
                    <span className="text-[16px]">종료일</span>
                    <label className="relative cursor-pointer">
                      <span className="bg-muted text-foreground px-3 py-1.5 rounded-lg text-[15px] font-medium">
                        {(() => {
                          const d = new Date(repeatEndDate + 'T00:00:00')
                          return `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}.`
                        })()}
                      </span>
                      <input
                        type="date"
                        value={repeatEndDate}
                        onChange={(e) => e.target.value && setRepeatEndDate(e.target.value)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        style={{ fontSize: '16px' }}
                      />
                    </label>
                  </div>
                </>
              )}
              </div>
            </>
          )}
          </div>

        </div>
      </div>

      {/* 하단 버튼 영역 */}
      <div className="w-full max-w-md mx-auto px-4 pt-3 flex-shrink-0 bg-background" style={{ paddingBottom: 'max(28px, env(safe-area-inset-bottom, 28px))' }}>
        {editTransaction ? (
          /* 수정 모드 */
          <div className="flex gap-2 mb-2">
            <button onClick={handleSave} className="flex-1 bg-accent-blue text-white rounded-[22px] py-3.5 text-[16px] font-semibold">
              {saving ? '저장 중...' : '수정하기'}
            </button>
            {editTransaction.type === 'savings' && (
              <button
                onClick={() => setRecoverOpen(prev => !prev)}
                className="flex-1 bg-[#14b8a6] text-white rounded-[22px] py-3.5 text-[16px] font-semibold"
              >
                회수하기
              </button>
            )}
            <button
              onClick={handleClose}
              className="flex-1 bg-surface text-muted-foreground rounded-[22px] py-3.5 text-[16px] font-semibold"
            >
              취소하기
            </button>
          </div>
        ) : (
          /* 기록 모드 */
          <div className="flex gap-3 mb-2">
            <button onClick={handleSave} className="flex-1 bg-accent-blue text-white rounded-[22px] py-3.5 text-[16px] font-semibold">
              {saving ? '저장 중...' : '저장하기'}
            </button>
            <button onClick={handleClose} className="flex-1 bg-surface text-muted-foreground rounded-[22px] py-3.5 text-[16px] font-semibold">
              취소하기
            </button>
          </div>
        )}
        {recoverOpen && editTransaction && (
          <div className="w-full max-w-md mx-auto px-4 pt-3 pb-2 bg-background">
            <div className="bg-surface rounded-[22px] px-4 py-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[16px] font-semibold">저축 회수</h3>
                <button
                  onClick={() => setRecoverOpen(false)}
                  className="text-sm text-muted-foreground"
                >
                  닫기
                </button>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-border">
                <span className="text-[15px] text-muted-foreground">회수일</span>
                <label className="text-[15px] cursor-pointer inline-flex items-center gap-1 relative">
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

              <div className="flex items-center justify-between py-3 border-b border-border">
                <span className="text-[15px] text-muted-foreground">회수 금액</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-[15px] text-muted-foreground">₩</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={recoverAmount ? parseInt(recoverAmount).toLocaleString() : ''}
                    onChange={(e) => setRecoverAmount(e.target.value.replace(/[^0-9]/g, ''))}
                    className="text-[15px] font-semibold tabular-nums bg-transparent border-none outline-none text-right w-32"
                    style={{ fontSize: '16px' }}
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-4">
                <button
                  onClick={async () => {
                    const amount = parseInt(recoverAmount, 10)
                    if (!amount) { alert('금액을 입력해주세요'); return }
                    const { addTransaction, updateTransaction } = await import('@/lib/api')
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
                      await updateTransaction(editTransaction.id, { end_date: recoverDate })
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
                  className="flex-1 py-3.5 rounded-[22px] bg-[#14b8a6] text-white text-[16px] font-semibold"
                >
                  {saving ? '처리 중...' : '적용하기'}
                </button>
                <button
                  onClick={() => setRecoverOpen(false)}
                  className="flex-1 py-3.5 rounded-[22px] bg-surface text-[16px] font-semibold text-muted-foreground"
                >
                  취소하기
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
