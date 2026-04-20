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

export function getAnalysisRows(categories: Category[], transactions: Transaction[], selectedYear: number) {
  return categories
    .map(category => {
      const categoryTxs = transactions.filter(tx => {
        const txYear = new Date(tx.date).getFullYear()
        const txCategory = tx.category as Category | undefined
        if (txYear !== selectedYear || !txCategory) return false
        return txCategory.id === category.id
      })

      const months = Array.from({ length: 12 }, (_, i) => {
        const month = i + 1
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

export function getParentCategorySummaryRows(
  parentCategories: Category[],
  categories: Category[],
  transactions: Transaction[],
  selectedYear: number,
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

      const months = Array.from({ length: 12 }, (_, i) => {
        const month = i + 1
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
