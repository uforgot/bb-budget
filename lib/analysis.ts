import type { Category, Transaction } from '@/lib/api'

const ALL_PARENT_CATEGORY_ID = '__all__'

export function getParentCategoriesByType(categories: Category[], typeFilter: 'expense' | 'income' | 'savings') {
  return categories.filter(cat => cat.type === typeFilter && !cat.parent_id)
}

export function getChildCategoriesForParent(categories: Category[], transactions: Transaction[], parentCategoryId: string) {
  if (parentCategoryId === ALL_PARENT_CATEGORY_ID) {
    return categories.filter(cat => cat.parent_id && cat.type === categories.find(parent => parent.id === cat.parent_id)?.type)
  }

  const children = categories.filter(cat => cat.parent_id === parentCategoryId)
  const parent = categories.find(cat => cat.id === parentCategoryId)
  const hasDirectParentTx = transactions.some(tx => {
    const txCategory = tx.category as Category | undefined
    return txCategory?.id === parentCategoryId
  })

  if (!parent) return children
  if (children.length === 0) return [parent]
  if (hasDirectParentTx) return [parent, ...children]
  return children
}

export function getAvailableTransactionYears(transactions: Transaction[]) {
  return Array.from(new Set(transactions.map(tx => new Date(tx.date).getFullYear()))).sort((a, b) => b - a)
}

export function getAnalysisMonthLabel(year: number, month: number, now: Date = new Date()) {
  if (year === now.getFullYear() && month === now.getMonth() + 1) return '이번 달'
  return `${year}년 ${month}월`
}

export function getAnalysisMonthValue(year: number, month: number) {
  return `${year}-${String(month).padStart(2, '0')}`
}

export function getAnalysisMonthOptions(now: Date = new Date(), earliestYear?: number) {
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1
  const startYear = Math.min(earliestYear ?? currentYear, currentYear - 5)
  const options: { year: number; month: number; value: string; label: string }[] = []

  for (let year = currentYear; year >= startYear; year--) {
    const maxMonth = year === currentYear ? currentMonth : 12
    for (let month = maxMonth; month >= 1; month--) {
      options.push({
        year,
        month,
        value: getAnalysisMonthValue(year, month),
        label: getAnalysisMonthLabel(year, month, now),
      })
    }
  }

  return options
}

export function getAnalysisRows(categories: Category[], transactions: Transaction[], selectedYear: number, selectedMonth?: number) {
  return categories
    .map(category => {
      const categoryTxs = transactions.filter(tx => {
        const txYear = new Date(tx.date).getFullYear()
        const txCategory = tx.category as Category | undefined
        if (txYear !== selectedYear || !txCategory) return false
        return txCategory.id === category.id
      })

      const monthRange = selectedMonth ? [selectedMonth] : Array.from({ length: 12 }, (_, i) => i + 1)
      const months = monthRange.map(month => {
        const amount = categoryTxs
          .filter(tx => new Date(tx.date).getMonth() + 1 === month)
          .reduce((sum, tx) => sum + tx.amount, 0)
        return { month, amount }
      })

      const total = months.reduce((sum, item) => sum + item.amount, 0)

      return {
        id: category.id,
        label: category.name,
        total,
        months,
        type: category.type,
      }
    })
    .filter(row => row.total > 0)
    .sort((a, b) => b.total - a.total)
}

export function getMonthlyGroupedRows(
  parentCategories: Category[],
  categories: Category[],
  transactions: Transaction[],
  selectedYear: number,
  selectedMonth: number,
) {
  return parentCategories
    .map(parent => {
      const children = categories.filter(cat => cat.parent_id === parent.id)
      const hasDirectParentTx = transactions.some(tx => {
        const txCategory = tx.category as Category | undefined
        return txCategory?.id === parent.id
      })
      const targets = hasDirectParentTx ? [parent, ...children] : children
      const rows = getAnalysisRows(targets, transactions, selectedYear, selectedMonth)
      const total = rows.reduce((sum, row) => sum + row.total, 0)
      return { parent, rows, total }
    })
    .filter(group => group.rows.length > 0)
}

export function getParentCategorySummaryRows(
  parentCategories: Category[],
  categories: Category[],
  transactions: Transaction[],
  selectedYear: number,
  selectedMonth?: number,
) {
  return parentCategories
    .map(parent => {
      const categoryIds = new Set([
        parent.id,
        ...categories.filter(cat => cat.parent_id === parent.id).map(cat => cat.id),
      ])

      const parentTxs = transactions.filter(tx => {
        const txYear = new Date(tx.date).getFullYear()
        const txCategory = tx.category as Category | undefined
        if (txYear !== selectedYear || !txCategory) return false
        return categoryIds.has(txCategory.id)
      })

      const monthRange = selectedMonth ? [selectedMonth] : Array.from({ length: 12 }, (_, i) => i + 1)
      const months = monthRange.map(month => {
        const amount = parentTxs
          .filter(tx => new Date(tx.date).getMonth() + 1 === month)
          .reduce((sum, tx) => sum + tx.amount, 0)
        return { month, amount }
      })

      const total = months.reduce((sum, item) => sum + item.amount, 0)

      return {
        id: parent.id,
        label: parent.name,
        total,
        months,
        type: parent.type,
      }
    })
    .filter(row => row.total > 0)
    .sort((a, b) => b.total - a.total)
}
