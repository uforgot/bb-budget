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
}

export interface Transaction {
  id: string
  type: 'income' | 'expense' | 'savings'
  amount: number
  category_id: string
  description: string | null
  date: string
  created_at: string
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
  const { data, error } = await getSupabase()
    .from('categories')
    .insert({ name, type })
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

export async function addTransaction(tx: {
  type: string
  amount: number
  category_id: string
  description?: string
  date: string
}) {
  const { data, error } = await getSupabase()
    .from('transactions')
    .insert(tx)
    .select('*, category:categories(*)')
    .single()
  if (error) throw error
  return data as Transaction
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
  const savings = transactions
    .filter(t => t.type === 'savings')
    .reduce((sum, t) => sum + t.amount, 0)

  // 일별 집계
  const daily: Record<number, { income: number; expense: number }> = {}
  for (const t of transactions) {
    const day = new Date(t.date).getDate()
    if (!daily[day]) daily[day] = { income: 0, expense: 0 }
    if (t.type === 'income') daily[day].income += t.amount
    else if (t.type === 'expense') daily[day].expense += t.amount
  }

  return { income, expense, savings, daily, transactions }
}
