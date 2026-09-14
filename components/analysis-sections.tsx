import { ChevronDown } from 'lucide-react'
import { useState } from 'react'

function fmt(n: number) {
  return `₩${n.toLocaleString()}`
}

function TitleSelect({
  value,
  label,
  ariaLabel,
  options,
  onChange,
}: {
  value: string
  label: string
  ariaLabel: string
  options: { value: string; label: string }[]
  onChange: (value: string) => void
}) {
  return (
    <label className="relative flex items-center gap-1 cursor-pointer shrink-0">
      <span className="text-foreground text-[28px] font-bold" style={{ letterSpacing: '-1px' }}>
        {label}
      </span>
      <ChevronDown size={16} strokeWidth={2.5} className="text-black/20 dark:text-white/20 flex-shrink-0" />
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        aria-label={ariaLabel}
      >
        {options.map(option => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </label>
  )
}

const TYPE_OPTIONS = [
  { value: 'expense', label: '지출' },
  { value: 'income', label: '수입' },
  { value: 'savings', label: '저축' },
] as const

export function AnalysisFilters({
  monthValue,
  monthLabel,
  monthOptions,
  onChangeMonth,
  typeFilter,
  onChangeType,
}: {
  monthValue: string
  monthLabel: string
  monthOptions: { value: string; label: string }[]
  onChangeMonth: (value: string) => void
  typeFilter: 'expense' | 'income' | 'savings'
  onChangeType: (value: 'expense' | 'income' | 'savings') => void
}) {
  return (
    <div className="flex items-center gap-1 mt-1 mb-4 flex-wrap">
      <TitleSelect
        value={monthValue}
        label={monthLabel}
        ariaLabel="연월 선택"
        options={monthOptions}
        onChange={onChangeMonth}
      />
      <TitleSelect
        value={typeFilter}
        label={TYPE_OPTIONS.find(option => option.value === typeFilter)?.label ?? '지출'}
        ariaLabel="내역 종류 선택"
        options={[...TYPE_OPTIONS]}
        onChange={value => onChangeType(value as 'expense' | 'income' | 'savings')}
      />
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
            className={`px-6 py-2 rounded-full text-[14px] font-semibold whitespace-nowrap transition-colors ${selectedYear === year ? 'bg-accent-blue text-white' : 'bg-gray-100 dark:bg-gray-800 text-black/50 dark:text-white/50'}`}
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
  defaultOpen = false,
  expandable = true,
}: {
  label: string
  total: number
  months: { month: number; amount: number }[]
  maxTotal: number
  color: string
  defaultOpen?: boolean
  expandable?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  const width = maxTotal > 0 ? Math.max((total / maxTotal) * 100, total > 0 ? 8 : 0) : 0
  const isOpen = expandable && open

  return (
    <div className="bg-surface rounded-[22px] px-4 py-4">
      <button
        type="button"
        onClick={() => { if (expandable) setOpen(v => !v) }}
        className="w-full text-left"
        disabled={!expandable}
      >
        <div className="mb-3 h-2 rounded-full bg-background overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{ width: `${width}%`, backgroundColor: color }} />
        </div>
        <div className="flex items-center justify-between gap-3">
          <p className="min-w-0 truncate text-[14px] font-medium text-foreground">{label}</p>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-[15px] font-semibold tracking-[-0.02em] tabular-nums text-foreground">{fmt(total)}</span>
            {expandable && (
              <ChevronDown size={14} strokeWidth={2} className={`text-black/20 dark:text-white/20 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            )}
          </div>
        </div>
      </button>

      {isOpen && (
        <div className="mt-4 border-t border-black/10 dark:border-white/10 pt-3 space-y-2">
          {months.map(({ month, amount }) => (
            <div key={month} className="flex items-center justify-between gap-3 text-[14px]">
              <span className="text-black/50 dark:text-white/50">{month}월</span>
              <span className="font-semibold tracking-[-0.02em] tabular-nums text-black/50 dark:text-white/50">{fmt(amount)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function AnalysisMonthlyGroupCard({
  label,
  total,
  rows,
  maxTotal,
  color,
  onClick,
}: {
  label: string
  total: number
  rows: { id: string; label: string; total: number }[]
  maxTotal: number
  color: string
  onClick: () => void
}) {
  const width = maxTotal > 0 ? Math.max((total / maxTotal) * 100, total > 0 ? 8 : 0) : 0
  return (
    <button
      type="button"
      onClick={onClick}
      className="block w-full bg-surface rounded-[22px] px-4 py-4 text-left transition-transform active:scale-[0.99]"
      aria-label={`${label} 상세 내역 보기`}
    >
      <div className="mb-3 h-2 rounded-full bg-background overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${width}%`, backgroundColor: color }} />
      </div>
      <div className="flex items-center justify-between gap-3">
        <p className="min-w-0 truncate text-[14px] font-medium text-foreground">{label}</p>
        <span className="text-[15px] font-semibold tracking-[-0.02em] tabular-nums text-foreground">{fmt(total)}</span>
      </div>
      {rows.length > 0 && (
        <div className="mt-4 border-t border-black/10 dark:border-white/10 pt-3 space-y-2">
          {rows.map(row => (
            <div key={row.id} className="flex items-center justify-between gap-3 text-[14px]">
              <span className="text-black/50 dark:text-white/50 min-w-0 truncate">{row.label}</span>
              <span className="font-semibold tracking-[-0.02em] tabular-nums text-black/50 dark:text-white/50">{fmt(row.total)}</span>
            </div>
          ))}
        </div>
      )}
    </button>
  )
}

export function AnalysisEmptyState() {
  return (
    <div className="bg-surface rounded-[22px] px-4 py-8 text-center text-[14px] text-muted-foreground">
      아직 표시할 내역이 없어요
    </div>
  )
}
