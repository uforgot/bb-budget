'use client'

import { deleteTransaction, type Transaction, type Category } from '@/lib/api'
import { SwipeToDelete } from '@/components/swipe-to-delete'

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토']

interface TxRowProps {
  tx: Transaction
  categories: Category[]
  showDate: boolean
  dateLabel?: string
  showDescription?: boolean
  onEdit: (tx: Transaction) => void
  onDeleted: () => void
}

export function TxRow({ tx, categories, showDate, dateLabel, showDescription = true, onEdit, onDeleted }: TxRowProps) {
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
                <span className="text-sm font-medium tabular-nums">{d.getDate()}일</span>
                <span className="text-xs text-muted-foreground">{DAY_NAMES[d.getDay()]}</span>
              </div>
            ) : dateLabel ? (
              <span className="text-sm font-medium">{dateLabel}</span>
            ) : null}
          </div>
          <div className="flex-1 min-w-0">
            <span className={`text-xs text-white px-3 py-1 rounded-full inline-block ${tx.end_date ? 'line-through' : ''}`} style={{ backgroundColor: tx.type === 'expense' ? '#FF4D8A' : tx.type === 'income' ? '#6A7BFF' : '#2CE6D6',  }}>
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
            'text-muted-foreground'
          }`}>
            ₩{tx.amount.toLocaleString()}
          </span>
        </div>
        {showDescription && tx.description && (
          <p className={`text-[10px] text-muted-foreground line-clamp-1 mt-1 pl-[68px] ${tx.end_date ? 'line-through' : ''}`}>
            {tx.description}
          </p>
        )}
      </div>
    </SwipeToDelete>
  )
}
