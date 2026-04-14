import type { Category, Transaction } from '@/lib/api'
import { Calendar } from 'lucide-react'

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
    <div className="sticky top-0 z-30 bg-background px-5">
      <div className="flex items-center justify-between h-14" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <button onClick={onToggleCalendarView} className="relative flex items-center justify-center w-8 h-8" aria-label={forceCalendarView ? '내역 보기' : '달력 보기'}>
          {forceCalendarView && <span className="absolute inset-0 rounded-full bg-accent-blue" />}
          <Calendar size={18} className={`relative ${forceCalendarView ? 'text-white' : 'text-foreground'}`} />
        </button>
        <div className="flex items-center gap-1">
          <button onClick={onToggleSearch} className="flex items-center justify-center w-8 h-8 rounded-lg text-foreground">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
          </button>
          <button onClick={onOpenSettings} className="flex items-center justify-center w-8 h-8 rounded-lg text-foreground">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></svg>
          </button>
        </div>
      </div>
    </div>
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
              className="appearance-none bg-transparent text-foreground text-[28px] font-bold outline-none cursor-pointer"
              style={{ letterSpacing: '-1px' }}
            >
              {years.map(y => <option key={y} value={y}>{y}년</option>)}
            </select>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-foreground/60 flex-shrink-0"><path d="m6 9 6 6 6-6"/></svg>
          </label>
          <label className="flex items-center cursor-pointer">
            <select
              value={currentMonth}
              onChange={e => onChangeMonth(Number(e.target.value))}
              className="appearance-none bg-transparent text-foreground text-[28px] font-bold outline-none cursor-pointer"
              style={{ letterSpacing: '-1px' }}
            >
              {months.map(m => <option key={m} value={m}>{m}월</option>)}
            </select>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-foreground/60 flex-shrink-0 -ml-1.5"><path d="m6 9 6 6 6-6"/></svg>
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
        <div className="flex flex-1 items-center gap-2 bg-surface rounded-[22px] px-4 py-3">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground flex-shrink-0">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="text" placeholder="검색어 입력..." value={searchQuery} autoFocus
            onChange={e => onChangeQuery(e.target.value)}
            className="flex-1 min-w-0 bg-transparent outline-none text-sm" style={{ fontSize: '16px' }}
          />
          {searchQuery && (
            <button onClick={onClearQuery} className="text-muted-foreground flex-shrink-0" aria-label="검색어 지우기">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
            </button>
          )}
        </div>
        <button
          onClick={onClose}
          className="flex items-center justify-center w-12 h-12 rounded-full bg-surface text-muted-foreground flex-shrink-0"
          aria-label="검색 닫기"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
        </button>
      </div>
      <div className="mt-3">
        {searchQuery && searchResults.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">검색 결과가 없어요</p>
        )}
        {searchResults.map(tx => {
          const cat = tx.category as any
          const catName = cat?.name || ''
          const parentCat = cat?.parent_id ? categories.find((c: any) => c.id === cat.parent_id) : null
          const d = new Date(tx.date)
          return (
            <div key={tx.id} onClick={() => onSelectTransaction(tx)}
              className="flex items-center justify-between gap-3 px-2 py-2.5 cursor-pointer active:bg-muted/30 rounded-lg">
              <div className="flex flex-1 min-w-0 items-center gap-2 overflow-hidden">
                <span className="text-xs bg-muted px-2.5 py-0.5 rounded-full flex-shrink-0">
                  {parentCat ? <><span className="text-foreground">{parentCat.name}</span><span className="text-muted-foreground"> · {catName}</span></> : <span className="text-foreground">{catName || '미분류'}</span>}
                </span>
                {tx.description && <span className="text-[10px] text-muted-foreground truncate flex-shrink min-w-0">{tx.description}</span>}
                <span className="text-[10px] text-muted-foreground flex-shrink-0">{d.getFullYear()}년 {d.getMonth()+1}월 {d.getDate()}일</span>
              </div>
              <span className={`text-sm font-semibold tabular-nums flex-shrink-0 ${tx.type === 'expense' ? 'text-accent-coral' : tx.type === 'income' ? 'text-accent-blue' : 'text-accent-purple'}`}>
                ₩{tx.amount.toLocaleString()}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
