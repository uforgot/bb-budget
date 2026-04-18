'use client'

import { useState, useEffect, useRef } from 'react'
import { deleteTransactionWithRecurringCascade, getCategories, type Category, type Transaction } from '@/lib/api'
import { formatDateDisplay, formatDateInputValue, formatKoreanWon } from '@/lib/format'
import { AddTransactionHeader, RecoverySection, TransactionAmountRow, TransactionCategorySection, TransactionDateRow, TransactionMemoRow, TransactionRepeatSection } from './add-transaction-sections'
import { applySavingsRecovery, buildTransactionPayload, REVERSE_TYPE_MAP, saveTransactionWithRecurring, type TransactionTypeKo } from '@/lib/transaction-modal'

type TransactionType = TransactionTypeKo

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
  const scrollRef = useRef<HTMLDivElement>(null)
  const dragStartYRef = useRef(0)
  const dragTranslateYRef = useRef(0)
  const draggingSheetRef = useRef(false)
  const [dragTranslateY, setDragTranslateY] = useState(0)
  const [sheetAnimating, setSheetAnimating] = useState(false)
  const [sheetVisible, setSheetVisible] = useState(false)
  const [shouldRender, setShouldRender] = useState(false)

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
      setType(null)
      setRawAmount('')
      setCategoryId('')
      setCategoryLabel('카테고리 선택')
      setMemo('')
      setEditDate(initialDate || null)
      setEndDate('')
      setEndAmount('')
      setRecoverAmount('')
      setRecoverOpen(false)
      setCategoryPickerOpen(false)
      setLinkedRecurringId(null)
      setRepeatFrequency('none')
      setRepeatDropdownOpen(false)
      const d = new Date(); d.setMonth(d.getMonth() + 1)
      setRepeatEndDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`)
    }
  }, [editTransaction, open, initialDate])

  useEffect(() => {
    if (!open) return
    setShouldRender(true)
    setSheetVisible(true)
    setSheetAnimating(false)
    setDragTranslateY(window.innerHeight)
    const raf = window.requestAnimationFrame(() => {
      setSheetAnimating(true)
      setDragTranslateY(0)
      window.setTimeout(() => setSheetAnimating(false), 220)
    })
    return () => window.cancelAnimationFrame(raf)
  }, [open])

  useEffect(() => {
    if (!open) return
    const prevBodyOverflow = document.body.style.overflow
    const prevBodyOverscroll = document.body.style.overscrollBehavior
    const prevHtmlOverscroll = document.documentElement.style.overscrollBehavior

    document.body.style.overflow = 'hidden'
    document.body.style.overscrollBehavior = 'none'
    document.documentElement.style.overscrollBehavior = 'none'

    return () => {
      document.body.style.overflow = prevBodyOverflow
      document.body.style.overscrollBehavior = prevBodyOverscroll
      document.documentElement.style.overscrollBehavior = prevHtmlOverscroll
    }
  }, [open])

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

  const date = editDate || initialDate || formatDateInputValue()

  const handleSave = async () => {
    const numAmount = parseInt(rawAmount, 10)
    if (!numAmount || !categoryId || !type || saving) {
      console.log('저장 차단:', { numAmount, categoryId, type, saving })
      if (!numAmount) alert('금액을 입력해주세요')
      else if (!type) alert('수입/지출/저축을 선택해주세요')
      else if (!categoryId) alert('카테고리를 선택해주세요')
      return
    }
    const { payload } = buildTransactionPayload({
      type: type!,
      amount: numAmount,
      categoryId,
      memo,
      date,
      endDate,
      endAmount,
    })
    setSaving(true)
    try {
      await saveTransactionWithRecurring({
        editTransaction,
        payload,
        linkedRecurringId,
        repeatFrequency,
        repeatEndDate,
      })
      onSave({ date, type: type!, amount: numAmount, category: categoryLabel, memo })
      setKeypadActive(false)
      handleClose()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : JSON.stringify(e)
      console.error('저장 실패:', msg)
      alert(`저장 실패: ${msg}`)
    } finally {
      setSaving(false)
    }
  }

  const handleClose = () => {
    setSheetAnimating(true)
    setDragTranslateY(window.innerHeight)
    window.setTimeout(() => {
      setSheetAnimating(false)
      setSheetVisible(false)
      setShouldRender(false)
      setDragTranslateY(0)
      setType(null)
      setRawAmount('')
      setCategoryId('')
      setCategoryLabel('카테고리 선택')
      setMemo('')
      setEditDate(initialDate || null)
      setEndDate('')
      setEndAmount('')
      setRecoverAmount('')
      setRecoverOpen(false)
      setCategoryPickerOpen(false)
      setLinkedRecurringId(null)
      setRepeatFrequency('none')
      setRepeatDropdownOpen(false)
      const d = new Date(); d.setMonth(d.getMonth() + 1)
      setRepeatEndDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`)
      onClose()
    }, 220)
  }

  const handleDelete = async () => {
    if (!editTransaction || saving) return
    const ok = window.confirm('이 기록을 삭제할까요?')
    if (!ok) return

    setSaving(true)
    try {
      await deleteTransactionWithRecurringCascade(editTransaction)
      handleClose()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : JSON.stringify(e)
      console.error('삭제 실패:', msg)
      alert(`삭제 실패: ${msg}`)
      setSaving(false)
    }
  }

  const handleSheetTouchStart = (e: React.TouchEvent) => {
    dragStartYRef.current = e.touches[0].clientY
    dragTranslateYRef.current = dragTranslateY
    draggingSheetRef.current = false
  }

  const handleSheetTouchMove = (e: React.TouchEvent) => {
    const diff = e.touches[0].clientY - dragStartYRef.current
    const scrollTop = scrollRef.current?.scrollTop ?? 0
    if (diff <= 0) return
    if (scrollTop > 0 && !draggingSheetRef.current) return
    draggingSheetRef.current = true
    const next = Math.max(0, diff + dragTranslateYRef.current)
    setSheetAnimating(false)
    setDragTranslateY(next)
    e.stopPropagation()
    e.preventDefault()
  }

  const handleSheetTouchEnd = () => {
    if (!draggingSheetRef.current) return
    draggingSheetRef.current = false
    if (dragTranslateY > 140) {
      handleClose()
      return
    }
    setSheetAnimating(true)
    setDragTranslateY(0)
    window.setTimeout(() => setSheetAnimating(false), 220)
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
    '지출': { active: 'bg-accent-coral text-white', inactive: 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-500' },
    '수입': { active: 'bg-[#14b8a6] text-white', inactive: 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-500' },
    '저축': { active: 'bg-accent-purple text-white', inactive: 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-500' },
  }

  const keypadKeys = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['00', '0', 'backspace'],
  ]

  if (!shouldRender) return null

  return (
    <div className="fixed inset-0 z-50 overscroll-none">
      <div className="absolute inset-0" style={{ visibility: sheetVisible ? 'visible' : 'hidden' }} onClick={handleClose} />
      <div
        className="absolute inset-x-0 bottom-0 flex flex-col bg-sheet"
        style={{
          top: 'max(8px, env(safe-area-inset-top, 0px) + 4px)',
          transform: `translateY(${dragTranslateY}px)`,
          transition: sheetAnimating ? 'transform 220ms cubic-bezier(0.22, 1, 0.36, 1)' : 'none',
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          overflow: 'hidden',
          touchAction: 'none',
          backgroundColor: '',
          boxShadow: '0 12px 28px rgba(0,0,0,0.18)',
          visibility: sheetVisible ? 'visible' : 'hidden',
        }}
        onTouchStart={handleSheetTouchStart}
        onTouchMove={handleSheetTouchMove}
        onTouchEnd={handleSheetTouchEnd}
      >
      <AddTransactionHeader
        title={editTransaction ? '수정하기' : '기록하기'}
        onClose={handleClose}
        onConfirm={editTransaction ? handleDelete : handleSave}
      />

      {/* Scrollable content */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto overscroll-contain">
        <div className="w-full max-w-md mx-auto px-5 pt-6 pb-4">
          {/* 전체 폼 통합 박스 */}
          <div className="mb-3 rounded-[22px] overflow-visible bg-white dark:bg-gray-700">
            <TransactionDateRow
              date={date}
              onFocus={() => setKeypadActive(false)}
              onChange={setEditDate}
            />
            <TransactionAmountRow
              rawAmount={rawAmount}
              amountInputRef={amountInputRef}
              formatKorean={formatKoreanWon}
              onChange={setRawAmount}
            />
            <TransactionCategorySection
              type={type}
              categoryId={categoryId}
              categoryLabel={categoryLabel}
              categoryPickerOpen={categoryPickerOpen}
              typeColors={typeColors}
              onTypeClick={(t) => {
                setKeypadActive(false)
                if (type === t) {
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
              onOpenPicker={() => {
                setKeypadActive(false)
                setCategoryPickerOpen(true)
              }}
              onSelect={(id, label) => {
                setCategoryId(id)
                setCategoryLabel(label)
                setCategoryPickerOpen(false)
              }}
              onClosePicker={() => setCategoryPickerOpen(false)}
            />
            <TransactionMemoRow
              memo={memo}
              onChange={setMemo}
              onBlur={() => setKeypadActive(false)}
              onFocus={() => setKeypadActive(false)}
            />
          {(!editTransaction || linkedRecurringId) && (
            <>
              <TransactionRepeatSection
                repeatDropdownRef={repeatDropdownRef}
                repeatFrequency={repeatFrequency}
                repeatDropdownOpen={repeatDropdownOpen}
                repeatEndDate={repeatEndDate}
                onToggleDropdown={() => { setKeypadActive(false); setRepeatDropdownOpen(prev => !prev) }}
                onSelectFrequency={(value) => {
                  setRepeatFrequency(value)
                  setRepeatDropdownOpen(false)
                }}
                onChangeEndDate={setRepeatEndDate}
              />
            </>
          )}
          </div>

          {recoverOpen && editTransaction && (
            <div className="px-0 pt-1 pb-1">
              <RecoverySection
                recoverDate={recoverDate}
                recoverAmount={recoverAmount}
                formatDateDisplay={formatDateDisplay}
                formatKorean={formatKoreanWon}
                onChangeDate={setRecoverDate}
                onChangeAmount={setRecoverAmount}
              />
            </div>
          )}
        </div>
      </div>

      {/* 하단 버튼 영역 */}
      <div className="w-full px-4 pt-3 flex-shrink-0 bg-sheet" style={{ paddingBottom: 'max(28px, env(safe-area-inset-bottom, 28px))' }}>
        <div className="w-full max-w-md mx-auto">
        {editTransaction ? (
          recoverOpen ? (
            <div className="flex gap-3 mb-2">
              <button
                onClick={async () => {
                  setSaving(true)
                  try {
                    await applySavingsRecovery({
                      editTransaction,
                      recoverAmount,
                      recoverDate,
                    })
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
                className="flex-1 bg-[#14b8a6] text-white rounded-[22px] py-3.5 text-[16px] font-semibold"
              >
                {saving ? '처리 중...' : '적용하기'}
              </button>
              <button
                onClick={() => setRecoverOpen(false)}
                className="flex-1 bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-500 rounded-[22px] py-3.5 text-[16px] font-semibold"
              >
                취소하기
              </button>
            </div>
          ) : (
            <div className="flex gap-2 mb-2">
              <button onClick={handleSave} className="flex-1 bg-accent-blue text-white rounded-[22px] py-3.5 text-[16px] font-semibold">
                {saving ? '저장 중...' : '수정하기'}
              </button>
              {editTransaction.type === 'savings' && (
                <button
                  onClick={() => setRecoverOpen(true)}
                  className="flex-1 bg-[#14b8a6] text-white rounded-[22px] py-3.5 text-[16px] font-semibold"
                >
                  회수하기
                </button>
              )}
              <button
                onClick={handleClose}
                className="flex-1 bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-500 rounded-[22px] py-3.5 text-[16px] font-semibold"
              >
                취소하기
              </button>
            </div>
          )
        ) : (
          /* 기록 모드 */
          <div className="flex gap-3 mb-2">
            <button onClick={handleSave} className="flex-1 bg-accent-blue text-white rounded-[22px] py-3.5 text-[16px] font-semibold">
              {saving ? '저장 중...' : '저장하기'}
            </button>
            <button onClick={handleClose} className="flex-1 bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-500 rounded-[22px] py-3.5 text-[16px] font-semibold">
              취소하기
            </button>
          </div>
        )}
        </div>
      </div>
    </div>
    </div>
  )
}
