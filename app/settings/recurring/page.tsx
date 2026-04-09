'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  addRecurringTransaction,
  deleteRecurringTransaction,
  getRecurringTransactions,
  type RecurringFrequency,
  type RecurringTransaction,
  updateRecurringTransaction,
} from '@/lib/api'
import { CategoryPicker } from '@/components/category-picker'

function formatKoreanAmount(raw: string) {
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

const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']

function getDefaultYearDate() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

function getFrequencyDescription(item: RecurringTransaction) {
  if (item.frequency === 'weekly') return `매주 ${WEEKDAY_LABELS[item.day_of_week ?? 0]}요일`
  if (item.frequency === 'yearly') return `매년 ${item.month_of_year}월 ${item.day_of_month}일`
  return `매월 ${item.day_of_month}일`
}

export default function RecurringPage() {
  const router = useRouter()
  const [items, setItems] = useState<RecurringTransaction[]>([])
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [amount, setAmount] = useState('')
  const [frequency, setFrequency] = useState<RecurringFrequency>('monthly')
  const [dayOfMonth, setDayOfMonth] = useState('10')
  const [dayOfWeek, setDayOfWeek] = useState('1')
  const [yearDate, setYearDate] = useState(getDefaultYearDate())
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [endDate, setEndDate] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [categoryLabel, setCategoryLabel] = useState('')
  const [description, setDescription] = useState('')
  const [categoryPickerOpen, setCategoryPickerOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null)

  const resetForm = () => {
    setAmount('')
    setFrequency('monthly')
    setDayOfMonth('10')
    setDayOfWeek('1')
    setYearDate(getDefaultYearDate())
    setStartDate(new Date().toISOString().slice(0, 10))
    setEndDate('')
    setCategoryId('')
    setCategoryLabel('')
    setDescription('')
    setCategoryPickerOpen(false)
    setEditingId(null)
  }

  const loadData = async () => {
    try {
      setItems(await getRecurringTransactions())
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => { loadData() }, [])

  const handleAdd = async () => {
    const numAmount = parseInt(amount, 10)
    if (!numAmount || !categoryId) {
      alert('금액과 카테고리를 입력해주세요')
      return
    }

    const payload = {
      type: 'expense',
      amount: numAmount,
      category_id: categoryId,
      description: description || null,
      frequency,
      day_of_week: frequency === 'weekly' ? parseInt(dayOfWeek, 10) : null,
      day_of_month: frequency === 'weekly' ? null : frequency === 'yearly' ? parseInt(yearDate.split('-')[2], 10) : parseInt(dayOfMonth, 10),
      month_of_year: frequency === 'yearly' ? parseInt(yearDate.split('-')[1], 10) : null,
      start_date: startDate || null,
      end_date: endDate || null,
      active: true,
    }

    if (frequency === 'monthly' && !payload.day_of_month) {
      alert('매월 날짜를 입력해주세요')
      return
    }

    setSaving(true)
    try {
      if (editingId) {
        await updateRecurringTransaction(editingId, payload)
      } else {
        await addRecurringTransaction(payload)
      }
      resetForm()
      setAdding(false)
      loadData()
    } catch (e) {
      console.error(e)
      alert('저장 실패')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    try {
      await updateRecurringTransaction(id, { active: !currentActive })
      loadData()
    } catch {
      alert('변경 실패')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteRecurringTransaction(id)
      loadData()
    } catch {
      alert('삭제 실패')
    }
  }

  return (
    <div className="min-h-dvh bg-background">
      <header className="flex items-center justify-between px-5 pt-[env(safe-area-inset-top,0px)] h-14 bg-background">
        <button
          onClick={() => router.back()}
          className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-muted-foreground"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
        <h1 className="text-[16px] font-semibold">반복 지출 관리</h1>
        <div className="w-8" />
      </header>

      <div className={`px-5 pt-6 ${adding ? 'pb-36' : ''}`}>
        {!adding && (
          <button
            onClick={() => { resetForm(); setAdding(true) }}
            className="w-full mb-4 py-3.5 rounded-[22px] bg-accent-blue text-[16px] font-semibold text-white"
          >
            반복 지출 추가하기
          </button>
        )}

        {items.length === 0 && !adding && (
          <p className="text-sm text-muted-foreground text-center py-8">등록된 반복 지출이 없어요</p>
        )}

        <div className="flex flex-col gap-3">
          {items.map(item => {
            const cat = item.category as any
            const catName = cat?.name || '미분류'
            return (
              <div
                key={item.id}
                onClick={() => {
                  setEditingId(item.id)
                  setAmount(String(item.amount))
                  setDescription(item.description || '')
                  setCategoryId(item.category_id)
                  setCategoryLabel(catName)
                  setFrequency(item.frequency)
                  setDayOfMonth(String(item.day_of_month ?? 10))
                  setDayOfWeek(String(item.day_of_week ?? 1))
                  setYearDate(`${new Date().getFullYear()}-${String(item.month_of_year ?? 1).padStart(2, '0')}-${String(item.day_of_month ?? 1).padStart(2, '0')}`)
                  setStartDate(item.start_date || new Date().toISOString().slice(0, 10))
                  setEndDate(item.end_date || '')
                  setAdding(true)
                }}
                className={`bg-surface rounded-[22px] px-5 py-4 cursor-pointer active:bg-muted/30 ${!item.active ? 'opacity-40' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-semibold ${!item.active ? 'line-through' : ''}`}>{item.description || catName}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {getFrequencyDescription(item)} · {catName}
                      {item.end_date ? ` · ${item.end_date}까지` : ''}
                      {!item.active ? ' · 일시정지' : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-semibold tabular-nums text-accent-coral ${!item.active ? 'line-through' : ''}`}>₩{item.amount.toLocaleString()}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleToggleActive(item.id, item.active) }}
                      className={`text-xs px-2 py-1 rounded-full ${item.active ? 'bg-muted text-muted-foreground' : 'bg-accent-blue/20 text-accent-blue'}`}
                    >
                      {item.active ? '정지' : '재개'}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeleteConfirm({ id: item.id, name: item.description || catName }) }}
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

        {adding ? (
          <>
            <div className="mt-4 bg-surface rounded-[22px] overflow-visible">
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-[16px]">주기</span>
                <div className="flex gap-1.5">
                  {(['weekly', 'monthly', 'yearly'] as const).map(f => (
                    <button
                      key={f}
                      onClick={() => setFrequency(f)}
                      className={`px-3 py-1.5 rounded-lg text-[14px] font-medium transition-colors ${
                        frequency === f ? 'bg-accent-blue text-white' : 'bg-[#f5f5f7] dark:bg-muted text-muted-foreground'
                      }`}
                    >
                      {f === 'weekly' ? '매주' : f === 'monthly' ? '매월' : '매년'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t border-border mx-5" />
              {frequency === 'weekly' && (
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-[16px]">요일</span>
                  <div className="flex gap-1.5">
                    {WEEKDAY_LABELS.map((d, i) => (
                      <button
                        key={i}
                        onClick={() => setDayOfWeek(String(i))}
                        className={`px-3 py-1.5 rounded-lg text-[14px] font-medium transition-colors ${
                          dayOfWeek === String(i) ? 'bg-accent-blue text-white' : 'bg-[#f5f5f7] dark:bg-muted text-muted-foreground'
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {frequency === 'monthly' && (
                <div className="flex items-center justify-between px-4 py-3.5">
                  <span className="text-[16px]">매월</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={dayOfMonth}
                      onChange={(e) => {
                        const v = e.target.value.replace(/[^0-9]/g, '')
                        if (v === '' || (parseInt(v) >= 1 && parseInt(v) <= 31)) setDayOfMonth(v)
                      }}
                      className="text-[16px] font-semibold bg-transparent border-none outline-none text-right w-10"
                      style={{ fontSize: '16px' }}
                    />
                    <span className="text-[16px] text-muted-foreground">일</span>
                  </div>
                </div>
              )}
              {frequency === 'yearly' && (
                <div className="flex items-center justify-between px-4 py-3.5">
                  <span className="text-[16px]">날짜</span>
                  <label className="relative cursor-pointer">
                    <span className="bg-muted text-foreground px-3 py-1.5 rounded-lg text-[15px] font-medium">
                      {(() => {
                        const d = new Date(yearDate + 'T00:00:00')
                        return `${d.getMonth() + 1}월 ${d.getDate()}일`
                      })()}
                    </span>
                    <input
                      type="date"
                      value={yearDate}
                      onChange={(e) => e.target.value && setYearDate(e.target.value)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      style={{ fontSize: '16px' }}
                    />
                  </label>
                </div>
              )}

              <div className="border-t border-border mx-5" />
              <div className="flex items-center justify-between px-4 py-3.5">
                <span className="text-[16px]">시작일</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-transparent text-right"
                  style={{ fontSize: '16px' }}
                />
              </div>

              <div className="border-t border-border mx-5" />
              <div className="flex items-center justify-between px-4 py-3.5">
                <span className="text-[16px]">종료일</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-transparent text-right"
                  style={{ fontSize: '16px' }}
                />
              </div>

              <div className="border-t border-border mx-5" />
              <div className="flex items-center justify-between px-4 py-3.5">
                <span className="text-[16px]">금액</span>
                <label className="relative flex flex-col items-end cursor-text min-w-[96px]">
                  <span className="text-[16px] font-semibold tabular-nums text-foreground">{amount ? parseInt(amount).toLocaleString() : '0'}</span>
                  {amount ? (
                    <span className="text-[12px] text-muted-foreground">{formatKoreanAmount(amount)}</span>
                  ) : null}
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ''))}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-text"
                    style={{ fontSize: '16px' }}
                  />
                </label>
              </div>

              <div className="border-t border-border mx-5" />
              <button
                onClick={() => setCategoryPickerOpen(prev => !prev)}
                className="w-full flex items-center justify-between px-4 py-3.5"
              >
                <span className="text-[16px]">카테고리</span>
                <span className="text-[16px] text-foreground">{categoryLabel || '선택'}</span>
              </button>
              {categoryPickerOpen && (
                <div className="px-3 pb-3">
                  <CategoryPicker
                    open={categoryPickerOpen}
                    inline
                    type="expense"
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

              <div className="border-t border-border mx-5" />
              <div className="flex items-center justify-between px-4 py-3.5">
                <span className="text-[16px]">메모</span>
                <input
                  type="text"
                  placeholder="입력"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="bg-transparent text-muted-foreground placeholder:text-muted-foreground/50 outline-none w-40 text-right"
                  style={{ fontSize: '16px' }}
                />
              </div>
            </div>

            <div className="fixed bottom-0 left-0 right-0 w-full max-w-md mx-auto px-5 pt-3 flex-shrink-0 bg-background" style={{ paddingBottom: 'max(28px, env(safe-area-inset-bottom, 28px))' }}>
              <div className="flex gap-3 mb-2">
                <button
                  onClick={handleAdd}
                  className="flex-1 py-3.5 rounded-[22px] bg-accent-blue text-white text-[16px] font-semibold"
                >
                  {saving ? '저장 중...' : editingId ? '수정하기' : '저장하기'}
                </button>
                <button
                  onClick={() => { setAdding(false); resetForm() }}
                  className="flex-1 py-3.5 rounded-[22px] bg-surface text-[16px] font-semibold text-muted-foreground"
                >
                  취소하기
                </button>
              </div>
            </div>
          </>
        ) : null}
      </div>

      {deleteConfirm && (
        <>
          <div className="fixed inset-0 bg-black/50 z-[70]" onClick={() => setDeleteConfirm(null)} />
          <div className="fixed inset-0 z-[80] flex items-center justify-center px-8">
            <div className="bg-card rounded-[22px] px-6 py-5 w-full max-w-sm">
              <p className="text-[16px] font-semibold mb-2">{deleteConfirm.name} 반복 지출을 삭제하시겠습니까?</p>
              <p className="text-xs text-muted-foreground mb-4">기존에 확정된 내역은 유지됩니다.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-3.5 rounded-[22px] bg-background text-[16px] font-medium text-muted-foreground">취소하기</button>
                <button onClick={() => { handleDelete(deleteConfirm.id); setDeleteConfirm(null) }} className="flex-1 py-3.5 rounded-[22px] bg-accent-coral/10 text-accent-coral text-[16px] font-semibold">삭제하기</button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
