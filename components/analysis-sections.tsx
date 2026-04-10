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
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-foreground/60 flex-shrink-0"><path d="m6 9 6 6 6-6"/></svg>
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
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-foreground/60 flex-shrink-0"><path d="m6 9 6 6 6-6"/></svg>
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
            className={`px-6 py-2 rounded-full text-[14px] font-semibold whitespace-nowrap transition-colors ${selectedYear === year ? 'bg-accent-blue text-white' : 'bg-surface text-muted-foreground opacity-70'}`}
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
    <div className="bg-surface rounded-[22px] px-4 py-4">
      <button type="button" onClick={() => setOpen(v => !v)} className="w-full text-left">
        <div className="mb-3 h-2 rounded-full bg-background overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{ width: `${width}%`, backgroundColor: color }} />
        </div>
        <div className="flex items-center justify-between gap-3">
          <p className="min-w-0 truncate text-[14px] font-medium text-foreground">{label}</p>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-[15px] font-semibold tracking-[-0.02em] tabular-nums text-foreground">{fmt(total)}</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`}><path d="m6 9 6 6 6-6"/></svg>
          </div>
        </div>
      </button>

      {open && (
        <div className="mt-4 border-t border-border pt-3 space-y-2">
          {months.map(({ month, amount }) => (
            <div key={month} className="flex items-center justify-between gap-3 text-[14px]">
              <span className="text-muted-foreground">{month}월</span>
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
    <div className="bg-surface rounded-[22px] px-4 py-8 text-center text-[14px] text-muted-foreground">
      아직 표시할 내역이 없어요
    </div>
  )
}
