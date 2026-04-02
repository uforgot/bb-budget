'use client'

import { deleteTransaction, type Transaction, type Category } from '@/lib/api'
import { SwipeToDelete } from '@/components/swipe-to-delete'

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토']

interface TxRowProps {
  tx: Transaction
  categories: Category[]
  showDate: boolean
  dateLabel?: string
  onEdit: (tx: Transaction) => void
  onDeleted: () => void
}

export function TxRow({ tx, categories, showDate, dateLabel, onEdit, onDeleted }: TxRowProps) {
  const cat = tx.category as any
  const catName = cat?.name || ''
  const d = new Date(tx.date)

  return (
    <SwipeToDelete onDelete={async () => { await deleteTransaction(tx.id); onDeleted() }}>
      <div
        onClick={() => onEdit(tx)}
        className={`px-5 py-2 cursor-pointer active:bg-muted/30 ${tx.end_date ? 'opacity-40' : ''}`}
      >
        <div className="flex items-center gap-3">
          <div className="w-14 flex-shrink-0">
            {showDate ? (
              <div className="flex items-baseline gap-1.5">
                <span className="text-sm font-medium">{DAY_NAMES[d.getDay()]}</span>
                <span className="text-sm text-muted-foreground tabular-nums">{d.getDate()}일</span>
              </div>
            ) : dateLabel ? (
              <span className="text-sm font-medium">{dateLabel}</span>
            ) : null}
          </div>
          <div className="flex-1 min-w-0">
            <span className={`text-xs text-foreground px-3 py-1 rounded-full inline-block ${tx.end_date ? 'line-through' : ''}`} style={{ backgroundColor: '#1C1C1E' }}>
              {!cat
                ? <span className="text-muted-foreground">미분류</span>
                : cat.parent_id
                  ? (() => {
                      const parent = categories.find((c: any) => c.id === cat.parent_id)
                      return parent
                        ? <><span className="text-foreground">{parent.name}</span><span className="text-muted-foreground"> · {catName}</span></>
                        : <span className="text-foreground">{catName}</span>
                    })()
                  : <span className="text-foreground">{catName}</span>
              }
            </span>
          </div>
          <span className={`text-sm font-semibold tabular-nums flex-shrink-0 ${tx.end_date ? 'line-through ' : ''}${
            tx.type === 'expense' ? 'text-accent-coral' : tx.type === 'income' ? 'text-accent-blue' : 'text-accent-mint'
          }`}>
            ₩{tx.amount.toLocaleString()}
          </span>
        </div>
        {tx.description && (
          <p className={`text-[10px] text-muted-foreground truncate mt-1 pl-[68px] ${tx.end_date ? 'line-through' : ''}`}>
            {tx.description}
          </p>
        )}
      </div>
    </SwipeToDelete>
  )
}
