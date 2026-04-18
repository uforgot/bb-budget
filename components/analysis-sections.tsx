import { ChevronDown } from 'lucide-react'
import { useState } from 'react'
import type { Category } from '@/lib/api'

function fmt(n: number) {
  return `₩${n.toLocaleString()}`
}

export function AnalysisFilters({
  typeFilter,
  parentCategoryId,
  parentCategories,
  onChangeType,
  onChangeParent,
}: {
  typeFilter: 'expense' | 'income' | 'savings'
  parentCategoryId: string
  parentCategories: Category[]
  onChangeType: (value: 'expense' | 'income' | 'savings') => void
  onChangeParent: (value: string) => void
}) {
  return (
    <div className="flex items-center gap-3 mt-1 mb-4 overflow-x-auto scrollbar-hide">
      <label className="flex items-center gap-1 cursor-pointer shrink-0">
        <select
          value={typeFilter}
          onChange={e => onChangeType(e.target.value as 'expense' | 'income' | 'savings')}
          className="appearance-none bg-transparent text-foreground text-[28px] font-bold outline-none cursor-pointer"
          style={{ letterSpacing: '-1px' }}
        >
          <option value="expense">지출</option>
          <option value="income">수입</option>
          <option value="savings">저축</option>
        </select>
        <ChevronDown size={16} strokeWidth={2.5} className="text-foreground/60 flex-shrink-0" />
      </label>

      <label className="flex items-center gap-1 cursor-pointer min-w-0">
        <select
          value={parentCategoryId}
          onChange={e => onChangeParent(e.target.value)}
          className="appearance-none bg-transparent text-foreground text-[28px] font-bold outline-none cursor-pointer max-w-[240px] truncate"
          style={{ letterSpacing: '-1px' }}
        >
          {parentCategories.map(category => (
            <option key={category.id} value={category.id}>{category.name}</option>
          ))}
        </select>
        <ChevronDown size={16} strokeWidth={2.5} className="text-foreground/60 flex-shrink-0" />
      </label>
    </div>
  )
}

export function AnalysisYearPills({
  years,
  selectedYear,
  onSelect,
}: {
  years: number[]
  selectedYear: number
  onSelect: (year: number) => void
}) {
  if (years.length === 0) return null

  return (
    <div className="overflow-x-auto scrollbar-hide -mx-1 px-1 mb-4">
      <div className="flex gap-2" style={{ width: 'max-content' }}>
        {years.map(year => (
          <button
            key={year}
            type="button"
            onClick={() => onSelect(year)}
            className={`px-6 py-2 rounded-full text-[14px] font-semibold whitespace-nowrap transition-colors ${selectedYear === year ? 'bg-accent-blue text-white' : 'bg-white dark:bg-gray-900 text-gray-300 dark:text-gray-600'}`}
          >
            {year}년
          </button>
        ))}
      </div>
    </div>
  )
}

export function AnalysisRow({
  label,
  total,
  months,
  maxTotal,
  color,
}: {
  label: string
  total: number
  months: { month: number; amount: number }[]
  maxTotal: number
  color: string
}) {
  const [open, setOpen] = useState(false)
  const width = maxTotal > 0 ? Math.max((total / maxTotal) * 100, total > 0 ? 8 : 0) : 0

  return (
    <div className="bg-surface dark:bg-gray-900 rounded-[22px] px-4 py-4">
      <button type="button" onClick={() => setOpen(v => !v)} className="w-full text-left">
        <div className="mb-3 h-2 rounded-full bg-background overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{ width: `${width}%`, backgroundColor: color }} />
        </div>
        <div className="flex items-center justify-between gap-3">
          <p className="min-w-0 truncate text-[14px] font-medium text-foreground">{label}</p>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-[15px] font-semibold tracking-[-0.02em] tabular-nums text-foreground">{fmt(total)}</span>
            <ChevronDown size={14} strokeWidth={2} className={`text-gray-500 dark:text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`} />
          </div>
        </div>
      </button>

      {open && (
        <div className="mt-4 border-t border-gray-200 dark:border-gray-800 pt-3 space-y-2">
          {months.map(({ month, amount }) => (
            <div key={month} className="flex items-center justify-between gap-3 text-[14px]">
              <span className="text-gray-500 dark:text-gray-500">{month}월</span>
              <span className="font-semibold tracking-[-0.02em] tabular-nums text-foreground">{fmt(amount)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function AnalysisEmptyState() {
  return (
    <div className="bg-surface dark:bg-gray-900 rounded-[22px] px-4 py-8 text-center text-[14px] text-muted-foreground">
      아직 표시할 내역이 없어요
    </div>
  )
}
