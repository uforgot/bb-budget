import { CategoryPicker } from './category-picker'

type TransactionType = '수입' | '지출' | '저축'

const TYPE_MAP: Record<TransactionType, string> = { '수입': 'income', '지출': 'expense', '저축': 'savings' }

export function AddTransactionHeader({
  title,
  onClose,
  onDelete,
}: {
  title: string
  onClose: () => void
  onDelete?: () => void
}) {
  return (
    <header className="flex items-center justify-between px-5 pt-[env(safe-area-inset-top,0px)] h-14 bg-background flex-shrink-0">
      <button
        onClick={onClose}
        className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-muted-foreground"
        aria-label="취소"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m15 18-6-6 6-6" />
        </svg>
      </button>
      <h1 className="text-[17px] font-semibold">{title}</h1>
      {onDelete ? (
        <button
          onClick={onDelete}
          className="flex items-center justify-center w-8 h-8 rounded-full bg-accent-coral/10 text-accent-coral"
          aria-label="삭제"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" />
          </svg>
        </button>
      ) : (
        <div className="w-8" />
      )}
    </header>
  )
}

export function TransactionDateRow({
  date,
  onFocus,
  onChange,
}: {
  date: string
  onFocus: () => void
  onChange: (value: string) => void
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3.5">
      <span className="text-[16px]">날짜</span>
      <label className="relative cursor-pointer">
        <span className="bg-muted text-foreground px-3 py-1.5 rounded-lg text-[15px] font-medium">
          {(() => {
            const d = new Date(date + 'T00:00:00')
            const days = ['일', '월', '화', '수', '목', '금', '토']
            return `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}. (${days[d.getDay()]})`
          })()}
        </span>
        <input
          type="date"
          value={date}
          onFocus={onFocus}
          onChange={(e) => e.target.value && onChange(e.target.value)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          style={{ fontSize: '16px' }}
        />
      </label>
    </div>
  )
}

export function TransactionAmountRow({
  rawAmount,
  amountInputRef,
  formatKorean,
  onChange,
}: {
  rawAmount: string
  amountInputRef: React.RefObject<HTMLInputElement | null>
  formatKorean: (raw: string) => string
  onChange: (value: string) => void
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3.5" onClick={() => amountInputRef.current?.focus()}>
      <span className="text-[16px]">금액</span>
      <div className="flex flex-col items-end">
        <div className="flex items-baseline justify-end">
          <span className="text-[16px] font-semibold tabular-nums text-foreground">₩{rawAmount ? parseInt(rawAmount).toLocaleString() : '0'}</span>
          <input
            ref={amountInputRef}
            inputMode="numeric"
            pattern="[0-9]*"
            value={rawAmount}
            onChange={e => {
              const v = e.target.value.replace(/[^0-9]/g, '')
              if (v.length <= 10) onChange(v)
            }}
            className="sr-only"
            placeholder="0"
          />
        </div>
        {rawAmount ? (
          <span className="text-[12px] text-muted-foreground">
            {formatKorean(rawAmount)}
          </span>
        ) : null}
      </div>
    </div>
  )
}

export function TransactionCategorySection({
  type,
  categoryId,
  categoryLabel,
  categoryPickerOpen,
  typeColors,
  onTypeClick,
  onOpenPicker,
  onSelect,
  onClosePicker,
}: {
  type: TransactionType | null
  categoryId: string
  categoryLabel: string
  categoryPickerOpen: boolean
  typeColors: Record<TransactionType, { active: string; inactive: string }>
  onTypeClick: (type: TransactionType) => void
  onOpenPicker: () => void
  onSelect: (id: string, label: string) => void
  onClosePicker: () => void
}) {
  return (
    <>
      <div className="flex items-center justify-between px-4 py-3">
        <span className="text-[16px]">카테고리</span>
        <div className="flex gap-1.5">
          {(['수입', '지출', '저축'] as TransactionType[]).map((t) => (
            <button
              key={t}
              onClick={() => onTypeClick(t)}
              className={`px-3 py-1.5 rounded-lg text-[14px] font-medium transition-colors ${
                type === t ? typeColors[t].active : 'bg-[#f5f5f7] dark:bg-muted text-muted-foreground'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {type && categoryId && !categoryPickerOpen && (
        <>
          <div className="border-t border-border mx-4" />
          <button
            onClick={onOpenPicker}
            className="w-full flex items-center justify-between px-4 py-3.5"
          >
            <span className="text-[16px]">{categoryLabel}</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        </>
      )}

      {categoryPickerOpen && type !== null && (
        <div className="px-3 pb-3">
          <CategoryPicker
            open={categoryPickerOpen && type !== null}
            inline
            type={type ? TYPE_MAP[type] as 'income' | 'expense' | 'savings' : 'expense'}
            selected={categoryId}
            onSelect={onSelect}
            onClose={onClosePicker}
          />
        </div>
      )}
    </>
  )
}

export function TransactionMemoRow({
  memo,
  onChange,
  onBlur,
  onFocus,
}: {
  memo: string
  onChange: (value: string) => void
  onBlur: () => void
  onFocus: () => void
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3.5">
      <span className="text-[16px]">메모</span>
      <input
        type="text"
        placeholder="입력"
        value={memo}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        onFocus={onFocus}
        style={{ fontSize: '16px', textAlign: 'right' }}
        className="bg-transparent text-muted-foreground placeholder:text-muted-foreground/50 outline-none w-40"
      />
    </div>
  )
}

export function TransactionRepeatSection({
  repeatDropdownRef,
  repeatFrequency,
  repeatDropdownOpen,
  repeatEndDate,
  onToggleDropdown,
  onSelectFrequency,
  onChangeEndDate,
}: {
  repeatDropdownRef: React.RefObject<HTMLDivElement | null>
  repeatFrequency: 'none' | 'weekly' | 'monthly' | 'yearly'
  repeatDropdownOpen: boolean
  repeatEndDate: string
  onToggleDropdown: () => void
  onSelectFrequency: (value: 'none' | 'weekly' | 'monthly' | 'yearly') => void
  onChangeEndDate: (value: string) => void
}) {
  return (
    <div ref={repeatDropdownRef}>
      <div className="relative">
        <button
          onClick={onToggleDropdown}
          className="w-full flex items-center justify-between px-4 py-3.5"
        >
          <span className="text-[16px]">반복</span>
          <div className="flex items-center gap-1 text-muted-foreground">
            <span className="text-[16px]">
              {{ none: '안 함', weekly: '매주', monthly: '매월', yearly: '매년' }[repeatFrequency]}
            </span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </div>
        </button>
        {repeatDropdownOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-[22px] overflow-hidden z-20 shadow-lg">
            {(['none', 'weekly', 'monthly', 'yearly'] as const).map((opt, i) => (
              <button
                key={opt}
                onClick={() => onSelectFrequency(opt)}
                className={`w-full px-4 py-3.5 text-[16px] flex items-center justify-between transition-colors ${
                  i > 0 ? 'border-t border-border' : ''
                } active:bg-muted`}
              >
                <span>{{ none: '안 함', weekly: '매주', monthly: '매월', yearly: '매년' }[opt]}</span>
                {repeatFrequency === opt && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#14b8a6' }}>
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {repeatFrequency !== 'none' && (
        <>
          <div className="border-t border-border mx-4" />
          <div className="flex items-center justify-between px-4 py-3.5">
            <span className="text-[16px]">종료일</span>
            <label className="relative cursor-pointer">
              <span className="bg-muted text-foreground px-3 py-1.5 rounded-lg text-[15px] font-medium">
                {(() => {
                  const d = new Date(repeatEndDate + 'T00:00:00')
                  return `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}.`
                })()}
              </span>
              <input
                type="date"
                value={repeatEndDate}
                onChange={(e) => e.target.value && onChangeEndDate(e.target.value)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                style={{ fontSize: '16px' }}
              />
            </label>
          </div>
        </>
      )}
    </div>
  )
}

export function RecoverySection({
  recoverDate,
  recoverAmount,
  formatDateDisplay,
  onChangeDate,
  onChangeAmount,
}: {
  recoverDate: string
  recoverAmount: string
  formatDateDisplay: (dateStr: string) => string
  onChangeDate: (value: string) => void
  onChangeAmount: (value: string) => void
}) {
  return (
    <div className="bg-surface rounded-[22px] px-4 py-2">
      <div className="flex items-center justify-between py-3 border-b border-border">
        <span className="text-[15px] text-muted-foreground">회수일</span>
        <label className="text-[15px] cursor-pointer inline-flex items-center gap-1 relative">
          <span>{recoverDate ? formatDateDisplay(recoverDate) : '날짜 선택'}</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
            <path d="m6 9 6 6 6-6" />
          </svg>
          <input
            type="date"
            value={recoverDate}
            onChange={(e) => e.target.value && onChangeDate(e.target.value)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            style={{ fontSize: '16px' }}
          />
        </label>
      </div>

      <div className="flex items-center justify-between py-3">
        <span className="text-[15px] text-muted-foreground">회수 금액</span>
        <div className="flex items-baseline gap-1">
          <span className="text-[16px] font-semibold tabular-nums text-foreground">₩</span>
          <input
            type="text"
            inputMode="numeric"
            value={recoverAmount ? parseInt(recoverAmount).toLocaleString() : ''}
            onChange={(e) => onChangeAmount(e.target.value.replace(/[^0-9]/g, ''))}
            className="text-[16px] font-semibold tabular-nums bg-transparent border-none outline-none text-right w-32 text-foreground"
            style={{ fontSize: '16px' }}
          />
        </div>
      </div>
    </div>
  )
}
