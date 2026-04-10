import type { Category, Transaction } from '@/lib/api'

export function getRecurringPreviewTarget(currentYear: number, currentMonth: number, now = new Date()) {
  const isFuture = currentYear > now.getFullYear() || (currentYear === now.getFullYear() && currentMonth > now.getMonth() + 1)
  return { isFuture }
}

export function searchTransactions(transactions: Transaction[], categories: Category[], query: string) {
  const q = query.trim().toLowerCase()
  if (!q) return []

  return transactions.filter(tx => {
    const cat = tx.category as Category | undefined
    const catName = cat?.name?.toLowerCase() || ''
    const parentName = cat?.parent_id
      ? categories.find(c => c.id === cat.parent_id)?.name?.toLowerCase() || ''
      : ''

    return (
      catName.includes(q) ||
      parentName.includes(q) ||
      (tx.description || '').toLowerCase().includes(q) ||
      tx.amount.toString().includes(q)
    )
  })
}
