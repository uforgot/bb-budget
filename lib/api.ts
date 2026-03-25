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

// 카테고리
export async function getCategories(type?: string) {
  let query = getSupabase().from('categories').select('*').order('sort_order')
  if (type) query = query.eq('type', type)
  const { data, error } = await query
  if (error) throw error
  return data as Category[]
}

export async function addCategory(name: string, type: string) {
  // 기존 최대 sort_order + 1
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

export interface RecurringTransaction {
  id: string
  type: string
  amount: number
  category_id: string
  description: string | null
  day_of_month: number
  active: boolean
  created_at: string
  category?: Category
}

export async function getRecurringTransactions(): Promise<RecurringTransaction[]> {
  const { data, error } = await (getSupabase() as any)
    .from('recurring_transactions')
    .select('*, category:categories(*)')
    .order('day_of_month')
  if (error) throw error
  return data || []
}

export async function addRecurringTransaction(tx: Record<string, unknown>) {
  const { error } = await (getSupabase() as any)
    .from('recurring_transactions')
    .insert(tx)
  if (error) throw error
}

export async function updateRecurringTransaction(id: string, tx: Record<string, unknown>) {
  const { error } = await (getSupabase() as any)
    .from('recurring_transactions')
    .update(tx)
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

// 월별 요약
export async function getMonthlySummary(year: number, month: number) {
  const transactions = await getTransactions({ year, month })
  
  const income = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)
  const expense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)
  // 저축: 해당 월까지의 누적 (is_active인 것만)
  const endOfMonth = `${year}-${String(month).padStart(2, '0')}-${new Date(year, month, 0).getDate()}`
  const savingsQuery = getSupabase() as any
  const { data: savingsTxs } = await savingsQuery
    .from('transactions')
    .select('amount')
    .eq('type', 'savings')
    .lte('date', endOfMonth)
    .eq('is_active', true)
  const savings = (savingsTxs || []).reduce((sum: number, t: any) => sum + t.amount, 0)

  // 카테고리 전체 로드 (parent 이름 매칭용)
  const allCategories = await getCategories()
  const catMap = Object.fromEntries(allCategories.map(c => [c.id, c]))

  // 일별 집계 + 상세
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
