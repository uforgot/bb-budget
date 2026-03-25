'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getRecurringTransactions, addRecurringTransaction, deleteRecurringTransaction, getCategories, type RecurringTransaction, type Category } from '@/lib/api'
import { CategoryPicker } from '@/components/category-picker'

export default function RecurringPage() {
  const router = useRouter()
  const [items, setItems] = useState<RecurringTransaction[]>([])
  const [adding, setAdding] = useState(false)
  const [amount, setAmount] = useState('')
  const [dayOfMonth, setDayOfMonth] = useState('10')
  const [categoryId, setCategoryId] = useState('')
  const [categoryLabel, setCategoryLabel] = useState('')
  const [description, setDescription] = useState('')
  const [categoryPickerOpen, setCategoryPickerOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const loadData = async () => {
    try {
      const data = await getRecurringTransactions()
      setItems(data)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => { loadData() }, [])

  const handleAdd = async () => {
    const numAmount = parseInt(amount, 10)
    if (!numAmount || !categoryId || !dayOfMonth) {
      alert('금액, 카테고리, 날짜를 입력해주세요')
      return
    }
    setSaving(true)
    try {
      await addRecurringTransaction({
        type: 'expense',
        amount: numAmount,
        category_id: categoryId,
        description: description || null,
        day_of_month: parseInt(dayOfMonth, 10),
      })
      setAmount('')
      setDayOfMonth('10')
      setCategoryId('')
      setCategoryLabel('')
      setDescription('')
      setAdding(false)
      loadData()
    } catch (e) {
      alert('추가 실패')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteRecurringTransaction(id)
      loadData()
    } catch (e) {
      alert('삭제 실패')
    }
  }

  return (
    <div className="min-h-dvh bg-background">
      <header className="flex items-center justify-between px-4 pt-[env(safe-area-inset-top,0px)] h-14 border-b border-border bg-background">
        <button
          onClick={() => router.back()}
          className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-muted-foreground"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
        <h1 className="text-[17px] font-semibold">반복 지출</h1>
        <div className="w-8" />
      </header>

      <div className="px-5 pt-6">
        {/* 기존 반복 지출 목록 */}
        {items.length === 0 && !adding && (
          <p className="text-sm text-muted-foreground text-center py-8">등록된 반복 지출이 없어요</p>
        )}

        <div className="flex flex-col gap-3">
          {items.map(item => {
            const cat = item.category as any
            const catName = cat?.name || '미분류'
            const parentCat = cat?.parent_id ? items.find(() => false) : null // simplified
            return (
              <div key={item.id} className="bg-surface rounded-[18px] px-5 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">{item.description || catName}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">매월 {item.day_of_month}일 · {catName}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold tabular-nums text-accent-coral">₩{item.amount.toLocaleString()}</span>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-muted-foreground"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 6 6 18" /><path d="m6 6 12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* 추가 폼 */}
        {adding ? (
          <div className="mt-4 bg-surface rounded-[18px] px-5 py-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[15px] text-muted-foreground">금액</span>
              <div className="flex items-baseline gap-1">
                <span className="text-[15px] text-muted-foreground">₩</span>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={amount ? parseInt(amount).toLocaleString() : ''}
                  onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ''))}
                  className="text-[15px] font-semibold tabular-nums bg-transparent border-none outline-none text-right w-28"
                  style={{ fontSize: '15px' }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between mb-3">
              <span className="text-[15px] text-muted-foreground">매월</span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={dayOfMonth}
                  onChange={(e) => setDayOfMonth(e.target.value)}
                  className="text-[15px] font-semibold bg-transparent border-none outline-none text-right w-10"
                  style={{ fontSize: '15px' }}
                />
                <span className="text-[15px] text-muted-foreground">일</span>
              </div>
            </div>

            <div className="flex items-center justify-between mb-3">
              <span className="text-[15px] text-muted-foreground">카테고리</span>
              <button
                onClick={() => setCategoryPickerOpen(true)}
                className="text-[15px] text-foreground"
              >
                {categoryLabel || '선택'}
              </button>
            </div>

            <div className="flex items-center justify-between mb-4">
              <span className="text-[15px] text-muted-foreground">메모</span>
              <input
                type="text"
                placeholder="월세, 보험 등"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="text-[15px] bg-transparent border-none outline-none text-right w-40"
                style={{ fontSize: '15px' }}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleAdd}
                className="flex-1 py-3.5 rounded-[18px] bg-primary text-primary-foreground text-sm font-semibold"
              >
                {saving ? '저장 중...' : '저장하기'}
              </button>
              <button
                onClick={() => setAdding(false)}
                className="flex-1 py-3.5 rounded-[18px] bg-muted text-sm font-medium text-muted-foreground"
              >
                취소하기
              </button>
            </div>

            <CategoryPicker
              open={categoryPickerOpen}
              type="expense"
              selected={categoryId}
              onSelect={(id, label) => {
                setCategoryId(id)
                setCategoryLabel(label)
              }}
              onClose={() => setCategoryPickerOpen(false)}
            />
          </div>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="w-full mt-4 py-3 rounded-[18px] bg-surface text-sm font-medium text-muted-foreground"
          >
            + 반복 지출 추가
          </button>
        )}
      </div>
    </div>
  )
}
