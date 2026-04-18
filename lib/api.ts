import { createClient } from './supabase'

type SupabaseClient = ReturnType<typeof createClient>
type LegacyRecurringBase = {
  frequency?: string | null
  anchor_date?: string | null
  end_date?: string | null
  start_date?: string | null
  created_at?: string | null
  day_of_week?: number | null
  day_of_month?: number | null
  month_of_year?: number | null
}
type LegacyRecurringRow = Partial<RecurringTransaction> & LegacyRecurringBase & {
  id: string
  type: string
  amount: number
  category_id: string
  description: string | null
  active: boolean
  created_at: string
}
type AnchorTransactionRow = {
  type: string
  amount: number
  category_id: string
  description: string | null
  date: string
}
type AmountRow = { amount: number }

function getSupabase(): SupabaseClient {
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
  anchor_date: string | null
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
  anchor_date?: string
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

function getLegacyAnchorDate(raw: LegacyRecurringBase, frequency: RecurringFrequency) {
  const baseDateStr = raw.start_date || raw.created_at?.slice?.(0, 10) || toDateString(new Date())
  const baseDate = parseLocalDate(baseDateStr)

  if (frequency === 'weekly') {
    const targetWeekday = typeof raw.day_of_week === 'number' ? raw.day_of_week : baseDate.getDay()
    const diff = (targetWeekday - baseDate.getDay() + 7) % 7
    baseDate.setDate(baseDate.getDate() + diff)
    return toDateString(baseDate)
  }

  if (frequency === 'yearly') {
    const month = typeof raw.month_of_year === 'number' ? raw.month_of_year : baseDate.getMonth() + 1
    const day = typeof raw.day_of_month === 'number' ? raw.day_of_month : baseDate.getDate()
    return `${baseDate.getFullYear()}-${String(month).padStart(2, '0')}-${String(clampDay(day, baseDate.getFullYear(), month)).padStart(2, '0')}`
  }

  const day = typeof raw.day_of_month === 'number' ? raw.day_of_month : baseDate.getDate()
  return `${baseDate.getFullYear()}-${String(baseDate.getMonth() + 1).padStart(2, '0')}-${String(clampDay(day, baseDate.getFullYear(), baseDate.getMonth() + 1)).padStart(2, '0')}`
}

function normalizeRecurringTransaction(raw: LegacyRecurringRow): RecurringTransaction {
  const frequency = (raw.frequency || 'monthly') as RecurringFrequency
  const anchorDate = raw.anchor_date || getLegacyAnchorDate(raw, frequency)

  return {
    ...raw,
    frequency,
    anchor_date: anchorDate,
    end_date: raw.end_date || null,
  }
}

function normalizeRecurringPayload(tx: Record<string, unknown>) {
  const frequency = (tx.frequency || 'monthly') as RecurringFrequency
  const anchorDate = typeof tx.anchor_date === 'string' && tx.anchor_date
    ? tx.anchor_date
    : getLegacyAnchorDate(tx, frequency)

  return {
    ...tx,
    frequency,
    anchor_date: anchorDate,
    end_date: tx.end_date ?? null,
  }
}

function isDateInRange(dateStr: string, anchorDate: string | null, endDate: string | null) {
  if (anchorDate && dateStr < anchorDate) return false
  if (endDate && dateStr > endDate) return false
  return true
}

function getRecurringDatesForMonth(recurring: RecurringTransaction, year: number, month: number) {
  const dates: string[] = []
  if (!recurring.anchor_date) return dates

  const anchor = parseLocalDate(recurring.anchor_date)
  const daysInMonth = new Date(year, month, 0).getDate()

  if (recurring.frequency === 'weekly') {
    const anchorWeekday = anchor.getDay()
    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = new Date(year, month - 1, day)
      if (date.getDay() !== anchorWeekday) continue
      const dateStr = toDateString(date)
      if (isDateInRange(dateStr, recurring.anchor_date, recurring.end_date)) dates.push(dateStr)
    }
    return dates
  }

  if (recurring.frequency === 'monthly') {
    const day = clampDay(anchor.getDate(), year, month)
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    if (isDateInRange(dateStr, recurring.anchor_date, recurring.end_date)) dates.push(dateStr)
    return dates
  }

  if (anchor.getMonth() + 1 !== month) return dates
  const day = clampDay(anchor.getDate(), year, month)
  const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  if (isDateInRange(dateStr, recurring.anchor_date, recurring.end_date)) dates.push(dateStr)
  return dates
}

async function findOrphanedRecurringIds(recurring: RecurringTransaction[]) {
  const anchorDates = Array.from(new Set(recurring.map(item => item.anchor_date).filter(Boolean))) as string[]
  if (anchorDates.length === 0) return new Set<string>()

  const { data: anchorTxs, error } = await getSupabase()
    .from('transactions')
    .select('type, amount, category_id, description, date')
    .in('date', anchorDates)

  if (error) throw error

  const anchorKeys = new Set((anchorTxs || []).map((tx: AnchorTransactionRow) => {
    const normalizedDescription = (tx.description || '').replace(/\s*\(반복\)$/, '') || null
    return `${tx.type}::${tx.amount}::${tx.category_id}::${tx.date}::${normalizedDescription ?? ''}`
  }))

  return new Set(
    recurring
      .filter(item => {
        const normalizedDescription = (item.description || '') || null
        const key = `${item.type}::${item.amount}::${item.category_id}::${item.anchor_date}::${normalizedDescription ?? ''}`
        return !anchorKeys.has(key)
      })
      .map(item => item.id)
  )
}

function getRecurringLabel(recurring: RecurringTransaction) {
  if (!recurring.anchor_date) return '반복 거래'
  const anchor = parseLocalDate(recurring.anchor_date)
  const weekdayNames = ['일', '월', '화', '수', '목', '금', '토']
  if (recurring.frequency === 'weekly') return `매주 ${weekdayNames[anchor.getDay()]}요일`
  if (recurring.frequency === 'yearly') return `매년 ${anchor.getMonth() + 1}월 ${anchor.getDate()}일`
  return `매월 ${anchor.getDate()}일`
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
  const { data, error } = await (getSupabase() as any)
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
  const supabase = getSupabase() as any
  const pageSize = 1000
  let from = 0
  const all: Transaction[] = []

  while (true) {
    let query = supabase
      .from('transactions')
      .select('*, category:categories(*)')
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .range(from, from + pageSize - 1)

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

    const page = (data || []) as Transaction[]
    if (page.length === 0) break
    all.push(...page)
    if (page.length < pageSize) break
    from += pageSize
  }

  return Array.from(new Map(all.map(tx => [tx.id, tx])).values())
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

export async function deleteTransactionWithRecurringCascade(tx: Transaction) {
  const supabase = getSupabase() as any

  const { data: recurringMatches, error: recurringError } = await supabase
    .from('recurring_transactions')
    .select('id')
    .eq('type', tx.type)
    .eq('amount', tx.amount)
    .eq('category_id', tx.category_id)
    .eq('anchor_date', tx.date)

  if (recurringError) throw recurringError

  const recurringIds = (recurringMatches || []).map((item: { id: string }) => item.id)

  if (recurringIds.length > 0) {
    const { error: recurringDeleteError } = await supabase
      .from('recurring_transactions')
      .delete()
      .in('id', recurringIds)
    if (recurringDeleteError) throw recurringDeleteError
  }

  const { error: txDeleteError } = await supabase.from('transactions').delete().eq('id', tx.id)
  if (txDeleteError) throw txDeleteError
}

// ─── 반복 지출 ─────────────────────────────────────────

export async function getRecurringTransactions(): Promise<RecurringTransaction[]> {
  const { data, error } = await (getSupabase() as any)
    .from('recurring_transactions')
    .select('*, category:categories(*)')
    .order('frequency')
    .order('anchor_date', { ascending: true, nullsFirst: false })
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

  const orphanedIds = await findOrphanedRecurringIds(active)
  const validActive = active.filter(r => !orphanedIds.has(r.id))
  if (validActive.length === 0) return []

  const monthTxs = await getTransactions({ year, month })

  return validActive
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
      anchor_date: r.anchor_date || undefined,
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
  const savings = (savingsTxs || []).reduce((sum: number, t: AmountRow) => sum + t.amount, 0)

  const allCategories = await getCategories()
  const catMap = Object.fromEntries(allCategories.map(c => [c.id, c]))

  const daily: Record<number, { income: number; expense: number; savings: number; items: { type: 'income' | 'expense' | 'savings'; category: string; parentCategory: string; description: string; amount: number; isRecurring?: boolean }[] }> = {}
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
