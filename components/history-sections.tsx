import type { Category, Transaction } from '@/lib/api'
import { Calendar, ChevronDown, Search, X } from 'lucide-react'
import { TopToolbar } from './top-toolbar'

export function HistoryTopBar({
  forceCalendarView,
  onToggleCalendarView,
  onToggleSearch,
  onOpenSettings,
}: {
  forceCalendarView: boolean
  onToggleCalendarView: () => void
  onToggleSearch: () => void
  onOpenSettings: () => void
}) {
  return (
    <TopToolbar
      left={
        <button
          onClick={onToggleCalendarView}
          className={`relative flex items-center justify-center w-11 h-11 rounded-full transition-colors ${forceCalendarView ? 'bg-accent-blue text-white' : 'bg-gray-100 dark:bg-gray-900 text-black dark:text-white'}`}
          aria-label={forceCalendarView ? '내역 보기' : '달력 보기'}
        >
          <Calendar size={20} strokeWidth={2.2} className="relative" />
        </button>
      }
      onSearch={onToggleSearch}
      onSettings={onOpenSettings}
    />
  )
}

export function HistoryMonthSelector({
  currentYear,
  currentMonth,
  years,
  months,
  onChangeYear,
  onChangeMonth,
  onResetToday,
}: {
  currentYear: number
  currentMonth: number
  years: number[]
  months: number[]
  onChangeYear: (year: number) => void
  onChangeMonth: (month: number) => void
  onResetToday: () => void
}) {
  return (
    <div className="px-5">
      <div className="flex items-center justify-between mt-1 mb-4">
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1 cursor-pointer">
            <select
              value={currentYear}
              onChange={e => onChangeYear(Number(e.target.value))}
              className="appearance-none bg-transparent text-foreground text-[30px] font-bold outline-none cursor-pointer"
              style={{ letterSpacing: '-1px' }}
            >
              {years.map(y => <option key={y} value={y}>{y}년</option>)}
            </select>
            <ChevronDown size={16} strokeWidth={2.5} className="text-black/20 dark:text-white/20 flex-shrink-0" />
          </label>
          <label className={`flex items-center cursor-pointer ${currentMonth >= 10 ? 'gap-1.5' : 'gap-1'}`}>
            <select
              value={currentMonth}
              onChange={e => onChangeMonth(Number(e.target.value))}
              className="appearance-none bg-transparent text-foreground text-[30px] font-bold outline-none cursor-pointer text-right"
              style={{ letterSpacing: '-1px' }}
            >
              {months.map(m => <option key={m} value={m}>{m}월</option>)}
            </select>
            <ChevronDown size={16} strokeWidth={2.5} className="text-black/20 dark:text-white/20 flex-shrink-0 mt-0.5" />
          </label>
        </div>
        <button onClick={onResetToday} className="px-4 py-2 rounded-full bg-accent-blue text-white text-[14px] font-semibold" aria-label="오늘">
          오늘
        </button>
      </div>
    </div>
  )
}

export function HistorySearchPanel({
  searchQuery,
  searchResults,
  categories,
  onChangeQuery,
  onClearQuery,
  onClose,
  onSelectTransaction,
}: {
  searchQuery: string
  searchResults: Transaction[]
  categories: Category[]
  onChangeQuery: (value: string) => void
  onClearQuery: () => void
  onClose: () => void
  onSelectTransaction: (tx: Transaction) => void
}) {
  return (
    <div className="px-4 py-3">
      <div className="flex items-center gap-2">
        <div className="flex h-11 flex-1 items-center gap-2 bg-white dark:bg-gray-800 rounded-[22px] px-4">
          <Search size={20} strokeWidth={2.2} className="text-black dark:text-white flex-shrink-0" />
          <input
            type="text" placeholder="검색어 입력..." value={searchQuery} autoFocus
            onChange={e => onChangeQuery(e.target.value)}
            className="flex-1 min-w-0 bg-transparent outline-none text-sm" style={{ fontSize: '16px' }}
          />
          {searchQuery && (
            <button onClick={onClearQuery} className="text-black dark:text-white flex-shrink-0" aria-label="검색어 지우기">
              <X size={20} strokeWidth={2.2} />
            </button>
          )}
        </div>
        <button
          onClick={onClose}
          className="flex items-center justify-center w-11 h-11 rounded-full bg-white dark:bg-gray-800 text-black dark:text-white flex-shrink-0"
          aria-label="검색 닫기"
        >
          <X size={20} strokeWidth={2.2} />
        </button>
      </div>
      <div className="mt-3">
        {searchQuery && searchResults.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">검색 결과가 없어요</p>
        )}
        {Object.entries(searchResults.reduce((acc, tx) => {
          const key = tx.date
          if (!acc[key]) acc[key] = []
          acc[key].push(tx)
          return acc
        }, {} as Record<string, Transaction[]>)).map(([dateKey, items]) => {
          const d = new Date(`${dateKey}T00:00:00`)
          const dayNames = ['일', '월', '화', '수', '목', '금', '토']
          return (
            <div key={dateKey} className="mb-3 rounded-[22px] bg-surface">
              <div className="px-4 pt-4 pb-3">
                <p className="text-[14px] font-semibold text-foreground">
                  {d.getFullYear()}. {d.getMonth() + 1}. {d.getDate()}. ({dayNames[d.getDay()]})
                </p>
              </div>
              <div className="mx-4 border-t border-black/10 dark:border-white/10" />
              <div className="px-4 pb-5 pt-3 space-y-4">
                {items.map(tx => {
                  const cat = tx.category as any
                  const catName = cat?.name || ''
                  const parentCat = cat?.parent_id ? categories.find((c: any) => c.id === cat.parent_id) : null
                  return (
                    <button
                      key={tx.id}
                      onClick={() => onSelectTransaction(tx)}
                      className="flex w-full items-center justify-between gap-3 text-left"
                    >
                      <div className="min-w-0 flex flex-1 items-center gap-3 overflow-hidden">
                        <span className="size-2.5 flex-shrink-0 rounded-full bg-accent-blue" />
                        <div className="min-w-0 flex flex-1 items-center gap-3 overflow-hidden text-[14px] text-foreground">
                          <span className="flex-shrink-0 font-medium text-foreground">
                            {parentCat ? `${parentCat.name} · ${catName}` : (catName || '미분류')}
                          </span>
                          {tx.description && <span className="truncate text-[10px] text-black/50 dark:text-white/50">{tx.description}</span>}
                        </div>
                      </div>
                      <span className={`flex-shrink-0 text-[14px] font-semibold tracking-[-0.02em] tabular-nums ${tx.type === 'expense' ? 'text-accent-coral' : tx.type === 'income' ? 'text-[#14b8a6]' : 'text-accent-purple'}`}>
                        ₩{tx.amount.toLocaleString()}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
