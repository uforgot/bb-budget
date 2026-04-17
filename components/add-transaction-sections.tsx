import { Check, ChevronDown, ChevronRight, Trash, X } from 'lucide-react'
import { CategoryPicker } from './category-picker'

type TransactionType = '지출' | '수입' | '저축'

const TYPE_MAP: Record<TransactionType, string> = { '지출': 'expense', '수입': 'income', '저축': 'savings' }

export function AddTransactionHeader({
  title,
  onClose,
  onConfirm,
}: {
  title: string
  onClose: () => void
  onConfirm: () => void
}) {
  return (
    <header className="flex items-center justify-between px-5 pt-[env(safe-area-inset-top,0px)] h-16 bg-background flex-shrink-0">
      <button
        onClick={onClose}
        className="flex items-center justify-center w-11 h-11 rounded-full bg-muted text-muted-foreground"
        aria-label="닫기"
      >
        <X size={22} strokeWidth={2} />
      </button>
      <h1 className="text-[17px] font-semibold">{title}</h1>
      <button
        onClick={onConfirm}
        className="flex items-center justify-center w-11 h-11 rounded-full bg-muted text-foreground"
        aria-label="확인"
      >
        <Check size={22} strokeWidth={2.4} />
      </button>
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
          {(['지출', '수입', '저축'] as TransactionType[]).map((t) => (
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
            <span className="text-[16px]">소분류</span>
            <div className="flex items-center gap-2 min-w-0 ml-4">
              <span className="text-[16px] text-right truncate">{categoryLabel}</span>
              <ChevronRight size={16} strokeWidth={2} className="text-muted-foreground flex-shrink-0" />
            </div>
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
            <ChevronDown size={14} strokeWidth={2} />
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
                  <Check size={16} strokeWidth={2.5} style={{ color: '#14b8a6' }} />
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
  formatKorean,
  onChangeDate,
  onChangeAmount,
}: {
  recoverDate: string
  recoverAmount: string
  formatDateDisplay: (dateStr: string) => string
  formatKorean: (raw: string) => string
  onChangeDate: (value: string) => void
  onChangeAmount: (value: string) => void
}) {
  return (
    <div className="bg-surface rounded-[22px] px-4 py-1">
      <div className="flex items-center justify-between py-3.5 border-b border-border">
        <span className="text-[16px]">회수일</span>
        <label className="relative cursor-pointer">
          <span className="bg-muted text-foreground px-3 py-1.5 rounded-lg text-[15px] font-medium">
            {recoverDate ? formatDateDisplay(recoverDate) : '날짜 선택'}
          </span>
          <input
            type="date"
            value={recoverDate}
            onChange={(e) => e.target.value && onChangeDate(e.target.value)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            style={{ fontSize: '16px' }}
          />
        </label>
      </div>

      <div className="flex items-center justify-between py-3.5">
        <span className="text-[16px]">회수 금액</span>
        <div className="flex flex-col items-end">
          <div className="flex items-baseline justify-end">
            <span className="text-[16px] font-semibold tabular-nums text-foreground">₩{recoverAmount ? parseInt(recoverAmount).toLocaleString() : '0'}</span>
            <input
              type="text"
              inputMode="numeric"
              value={recoverAmount}
              onChange={(e) => onChangeAmount(e.target.value.replace(/[^0-9]/g, ''))}
              className="sr-only"
              style={{ fontSize: '16px' }}
            />
          </div>
          {recoverAmount ? (
            <span className="text-[12px] text-muted-foreground">{formatKorean(recoverAmount)}</span>
          ) : null}
        </div>
      </div>
    </div>
  )
}
