import { createClient } from './supabase'

function getSupabase() {
  return createClient()
}

export interface Category {
  id: string
  name: string
  type: 'income' | 'expense' | 'savings'
  sort_order: number
  parent_id: string | null
  icon?: string | null
}

export interface Transaction {
  id: string
  type: 'income' | 'expense' | 'savings'
  amount: number
  category_id: string
  description: string | null
  date: string
  created_at: string
  end_date?: string | null
  category?: Category
}

export type RecurringFrequency = 'weekly' | 'monthly' | 'yearly'

export interface RecurringTransaction {
  id: string
  type: string
  amount: number
  category_id: string
  description: string | null
  frequency: RecurringFrequency
  day_of_week: number | null
  day_of_month: number | null
  month_of_year: number | null
  start_date: string | null
  end_date: string | null
  active: boolean
  created_at: string
  category?: Category
}

export interface RecurringPreviewItem {
  day: number
  date: string
  type: string
  amount: number
  category_id: string
  description: string
  categoryName?: string
}

function toDateString(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function parseLocalDate(dateStr: string) {
  return new Date(`${dateStr}T00:00:00`)
}

function clampDay(day: number, year: number, month: number) {
  const daysInMonth = new Date(year, month, 0).getDate()
  return Math.min(Math.max(day, 1), daysInMonth)
}

function normalizeRecurringTransaction(raw: any): RecurringTransaction {
  const frequency = (raw.frequency || 'monthly') as RecurringFrequency
  const startDate = raw.start_date || null
  const fallbackDayOfMonth = typeof raw.day_of_month === 'number'
    ? raw.day_of_month
    : startDate
      ? parseLocalDate(startDate).getDate()
      : null
  const fallbackMonthOfYear = raw.month_of_year ?? (startDate ? parseLocalDate(startDate).getMonth() + 1 : null)
  const fallbackDayOfWeek = raw.day_of_week ?? (frequency === 'weekly' && startDate ? parseLocalDate(startDate).getDay() : null)

  return {
    ...raw,
    frequency,
    day_of_week: fallbackDayOfWeek,
    day_of_month: fallbackDayOfMonth,
    month_of_year: fallbackMonthOfYear,
    start_date: startDate,
    end_date: raw.end_date || null,
  }
}

function normalizeRecurringPayload(tx: Record<string, unknown>) {
  const frequency = (tx.frequency || 'monthly') as RecurringFrequency
  const normalized: Record<string, unknown> = {
    ...tx,
    frequency,
  }

  if (!('month_of_year' in normalized)) normalized.month_of_year = null
  if (!('day_of_week' in normalized)) normalized.day_of_week = null
  if (!('day_of_month' in normalized)) normalized.day_of_month = null
  if (!('start_date' in normalized)) normalized.start_date = null
  if (!('end_date' in normalized)) normalized.end_date = null

  if (frequency === 'weekly') {
    normalized.day_of_week = typeof normalized.day_of_week === 'number' ? normalized.day_of_week : null
    normalized.day_of_month = null
    normalized.month_of_year = null
  } else if (frequency === 'monthly') {
    normalized.day_of_month = typeof normalized.day_of_month === 'number' ? normalized.day_of_month : null
    normalized.day_of_week = null
    normalized.month_of_year = null
  } else {
    normalized.day_of_month = typeof normalized.day_of_month === 'number' ? normalized.day_of_month : null
    normalized.month_of_year = typeof normalized.month_of_year === 'number' ? normalized.month_of_year : null
    normalized.day_of_week = null
  }

  return normalized
}

function isDateInRange(dateStr: string, startDate: string | null, endDate: string | null) {
  if (startDate && dateStr < startDate) return false
  if (endDate && dateStr > endDate) return false
  return true
}

function getRecurringDatesForMonth(recurring: RecurringTransaction, year: number, month: number) {
  const dates: string[] = []
  const daysInMonth = new Date(year, month, 0).getDate()

  if (recurring.frequency === 'weekly') {
    if (recurring.day_of_week == null) return dates
    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = new Date(year, month - 1, day)
      if (date.getDay() !== recurring.day_of_week) continue
      const dateStr = toDateString(date)
      if (isDateInRange(dateStr, recurring.start_date, recurring.end_date)) dates.push(dateStr)
    }
    return dates
  }

  if (recurring.frequency === 'monthly') {
    if (recurring.day_of_month == null) return dates
    const day = clampDay(recurring.day_of_month, year, month)
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    if (isDateInRange(dateStr, recurring.start_date, recurring.end_date)) dates.push(dateStr)
    return dates
  }

  if (recurring.month_of_year !== month || recurring.day_of_month == null) return dates
  const day = clampDay(recurring.day_of_month, year, month)
  const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  if (isDateInRange(dateStr, recurring.start_date, recurring.end_date)) dates.push(dateStr)
  return dates
}

function getRecurringLabel(recurring: RecurringTransaction) {
  const weekdayNames = ['일', '월', '화', '수', '목', '금', '토']
  if (recurring.frequency === 'weekly') return `매주 ${weekdayNames[recurring.day_of_week ?? 0]}요일`
  if (recurring.frequency === 'yearly') return `매년 ${recurring.month_of_year}월 ${recurring.day_of_month}일`
  return `매월 ${recurring.day_of_month}일`
}

// 카테고리
export async function getCategories(type?: string) {
  let query = getSupabase().from('categories').select('*').order('sort_order')
  if (type) query = query.eq('type', type)
  const { data, error } = await query
  if (error) throw error
  return data as Category[]
}

export async function addCategory(name: string, type: string) {
  const existing = await getCategories(type)
  const maxOrder = existing.reduce((max, c) => Math.max(max, c.sort_order), 0)
  const { data, error } = await getSupabase()
    .from('categories')
    .insert({ name, type, sort_order: maxOrder + 1 } as any)
    .select()
    .single()
  if (error) throw error
  return data as Category
}

export async function reorderParentCategories(type: string, orderedIds: string[]) {
  const supabase = getSupabase() as any
  for (let i = 0; i < orderedIds.length; i += 1) {
    const { error } = await supabase
      .from('categories')
      .update({ sort_order: i + 1 })
      .eq('id', orderedIds[i])
      .eq('type', type)
      .is('parent_id', null)
    if (error) throw error
  }
}

// 거래 내역
export async function getTransactions(filters?: { year?: number; month?: number; type?: string }) {
  let query = getSupabase()
    .from('transactions')
    .select('*, category:categories(*)')
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })

  if (filters?.year && filters?.month) {
    const start = `${filters.year}-${String(filters.month).padStart(2, '0')}-01`
    const endMonth = filters.month === 12 ? 1 : filters.month + 1
    const endYear = filters.month === 12 ? filters.year + 1 : filters.year
    const end = `${endYear}-${String(endMonth).padStart(2, '0')}-01`
    query = query.gte('date', start).lt('date', end)
  }

  if (filters?.type) query = query.eq('type', filters.type)

  const { data, error } = await query
  if (error) throw error
  return data as Transaction[]
}

export async function addTransaction(tx: Record<string, unknown>) {
  const { data, error } = await getSupabase()
    .from('transactions')
    .insert(tx as any)
    .select()
    .single()
  if (error) {
    console.error('Supabase insert error:', JSON.stringify(error))
    throw error
  }
  return data as Transaction
}

export async function updateTransaction(id: string, tx: Record<string, unknown>) {
  const supabase = getSupabase() as any
  const { error } = await supabase.from('transactions').update(tx).eq('id', id)
  if (error) throw error
}

export async function deleteTransaction(id: string) {
  const supabase = getSupabase() as any
  const { error } = await supabase.from('transactions').delete().eq('id', id)
  if (error) throw error
}

// ─── 반복 지출 ─────────────────────────────────────────

export async function getRecurringTransactions(): Promise<RecurringTransaction[]> {
  const { data, error } = await (getSupabase() as any)
    .from('recurring_transactions')
    .select('*, category:categories(*)')
    .order('frequency')
    .order('month_of_year', { ascending: true, nullsFirst: false })
    .order('day_of_week', { ascending: true, nullsFirst: false })
    .order('day_of_month', { ascending: true, nullsFirst: false })
  if (error) throw error
  return (data || []).map(normalizeRecurringTransaction)
}

export async function addRecurringTransaction(tx: Record<string, unknown>) {
  const { error } = await (getSupabase() as any)
    .from('recurring_transactions')
    .insert(normalizeRecurringPayload(tx))
  if (error) throw error
}

export async function updateRecurringTransaction(id: string, tx: Record<string, unknown>) {
  const { error } = await (getSupabase() as any)
    .from('recurring_transactions')
    .update(normalizeRecurringPayload(tx))
    .eq('id', id)
  if (error) throw error
}

export async function deleteRecurringTransaction(id: string) {
  const { error } = await (getSupabase() as any)
    .from('recurring_transactions')
    .delete()
    .eq('id', id)
  if (error) throw error
}

// ─── 반복 지출: 자동 확정 + 예정 미리보기 ─────────────────

export async function confirmRecurringTransactions(year: number, month: number) {
  const today = toDateString(new Date())
  const recurring = await getRecurringTransactions()
  const active = recurring.filter(r => r.active)
  if (active.length === 0) return

  const monthTxs = await getTransactions({ year, month })
  const created: Transaction[] = []

  for (const r of active) {
    const dates = getRecurringDatesForMonth(r, year, month)
      .filter(dateStr => dateStr <= today)

    for (const dateStr of dates) {
      const alreadyExists = monthTxs.some(
        t => t.category_id === r.category_id && t.amount === r.amount && t.type === r.type && t.date === dateStr
      )
      if (alreadyExists) continue

      const desc = r.description ? `${r.description} (반복)` : `${getRecurringLabel(r)} (반복)`
      const tx = await addTransaction({
        type: r.type,
        amount: r.amount,
        category_id: r.category_id,
        description: desc,
        date: dateStr,
      })
      created.push(tx)
    }
  }

  return created
}

export async function getRecurringPreview(year: number, month: number): Promise<RecurringPreviewItem[]> {
  const recurring = await getRecurringTransactions()
  const active = recurring.filter(r => r.active)
  if (active.length === 0) return []

  const monthTxs = await getTransactions({ year, month })

  return active
    .flatMap(r => getRecurringDatesForMonth(r, year, month).map(date => ({ recurring: r, date })))
    .filter(({ recurring: r, date }) => {
      return !monthTxs.some(t => t.category_id === r.category_id && t.amount === r.amount && t.type === r.type && t.date === date)
    })
    .map(({ recurring: r, date }) => ({
      day: Number(date.slice(-2)),
      date,
      type: r.type,
      amount: r.amount,
      category_id: r.category_id,
      description: r.description ? `${r.description} (예정)` : `${getRecurringLabel(r)} (예정)`,
      categoryName: r.category?.name || '',
    }))
}

// 월별 요약
export async function getMonthlySummary(year: number, month: number) {
  const transactions = await getTransactions({ year, month })

  const income = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)
  const expense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)
  const endOfMonth = `${year}-${String(month).padStart(2, '0')}-${new Date(year, month, 0).getDate()}`
  const savingsQuery = getSupabase() as any
  const { data: savingsTxs } = await savingsQuery
    .from('transactions')
    .select('amount')
    .eq('type', 'savings')
    .lte('date', endOfMonth)
    .eq('is_active', true)
  const savings = (savingsTxs || []).reduce((sum: number, t: any) => sum + t.amount, 0)

  const allCategories = await getCategories()
  const catMap = Object.fromEntries(allCategories.map(c => [c.id, c]))

  const daily: Record<number, { income: number; expense: number; savings: number; items: { type: 'income' | 'expense' | 'savings'; category: string; parentCategory: string; description: string; amount: number }[] }> = {}
  for (const t of transactions) {
    const day = new Date(t.date).getDate()
    if (!daily[day]) daily[day] = { income: 0, expense: 0, savings: 0, items: [] }
    if (t.type === 'income') daily[day].income += t.amount
    else if (t.type === 'expense') daily[day].expense += t.amount
    else if (t.type === 'savings') daily[day].savings += t.amount
    const cat = catMap[t.category_id]
    const parentCat = cat?.parent_id ? catMap[cat.parent_id] : null
    daily[day].items.push({
      type: t.type as 'income' | 'expense' | 'savings',
      category: cat?.name || '',
      parentCategory: parentCat?.name || '',
      description: t.description || '',
      amount: t.amount,
    })
  }

  return { income, expense, savings, daily, transactions }
}
