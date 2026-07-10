import { addTransaction, updateTransaction, type Transaction } from '@/lib/api'

export type TransactionTypeKo = '수입' | '지출' | '저축'

export const TYPE_MAP: Record<TransactionTypeKo, string> = {
  '수입': 'income',
  '지출': 'expense',
  '저축': 'savings',
}

export const REVERSE_TYPE_MAP: Record<string, TransactionTypeKo> = {
  income: '수입',
  expense: '지출',
  savings: '저축',
}

export function buildTransactionPayload({
  type,
  amount,
  categoryId,
  memo,
  date,
  endDate,
  endAmount,
}: {
  type: TransactionTypeKo
  amount: number
  categoryId: string
  memo: string
  date: string
  endDate?: string
  endAmount?: string
}) {
  const dbType = TYPE_MAP[type]
  const payload: Record<string, unknown> = {
    type: dbType,
    amount,
    category_id: categoryId,
    description: memo || '',
    date,
  }

  if (dbType === 'savings') {
    if (endDate) payload.end_date = endDate
    if (endAmount) payload.end_amount = parseInt(endAmount.replace(/[^0-9]/g, ''))
  }

  return { dbType, payload }
}

export async function saveTransactionWithRecurring({
  editTransaction,
  payload,
  linkedRecurringId,
  repeatFrequency,
  repeatEndDate,
}: {
  editTransaction?: Transaction | null
  payload: Record<string, unknown>
  linkedRecurringId: string | null
  repeatFrequency: 'none' | 'weekly' | 'monthly' | 'yearly'
  repeatEndDate: string
}) {
  const dbType = String(payload.type)
  const amount = Number(payload.amount)
  const categoryId = String(payload.category_id)
  const description = payload.description ? String(payload.description) : null
  const date = String(payload.date)

  if (editTransaction) {
    await updateTransaction(editTransaction.id, payload)
    if (linkedRecurringId) {
      const { updateRecurringTransaction, deleteRecurringTransaction } = await import('@/lib/api')
      if (repeatFrequency === 'none') {
        await deleteRecurringTransaction(linkedRecurringId)
      } else {
        await updateRecurringTransaction(linkedRecurringId, {
          type: dbType,
          amount,
          category_id: categoryId,
          description,
          frequency: repeatFrequency,
          anchor_date: date,
          end_date: repeatEndDate,
          active: true,
        })
      }
    }
    return
  }

  await addTransaction(payload)
  if (repeatFrequency !== 'none') {
    const { addRecurringTransaction } = await import('@/lib/api')
    await addRecurringTransaction({
      type: dbType,
      amount,
      category_id: categoryId,
      description,
      frequency: repeatFrequency,
      anchor_date: date,
      end_date: repeatEndDate,
      active: true,
    })
  }
}

export async function applySavingsRecovery({
  editTransaction,
  recoverAmount,
  recoverDate,
}: {
  editTransaction: Transaction
  recoverAmount: string
  recoverDate: string
}) {
  const recoveredAmount = parseInt(recoverAmount.replace(/[^0-9]/g, ''), 10)
  if (!recoveredAmount) throw new Error('금액을 입력해주세요')
  if (recoverDate < editTransaction.date) throw new Error('회수일은 저축일보다 빠를 수 없어요')

  const principalAmount = Number(editTransaction.amount)
  const remainingAmount = principalAmount - recoveredAmount

  // 저축 원금 회수는 새 수입이 아니다.
  // 기존 활성 저축을 줄이면 잔액 계산식(income - expense - activeSavings)에서 자동으로 현금 잔액에 반영된다.
  await updateTransaction(editTransaction.id, { end_date: recoverDate })

  if (remainingAmount > 0) {
    await addTransaction({
      type: 'savings',
      amount: remainingAmount,
      category_id: editTransaction.category_id,
      description: editTransaction.description || '',
      date: recoverDate,
    })
    return
  }

  if (remainingAmount < 0) {
    const catName = editTransaction.category?.name || '저축'
    await addTransaction({
      type: 'income',
      amount: Math.abs(remainingAmount),
      category_id: editTransaction.category_id,
      description: `${catName} 회수 차익`,
      date: recoverDate,
    })
  }
}
