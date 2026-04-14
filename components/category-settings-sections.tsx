import { Check, Plus, TextAlignJustify, X } from 'lucide-react'
import type { Category } from '@/lib/api'

type TypeTab = 'expense' | 'income' | 'savings'

const TYPE_LABELS: { key: TypeTab; label: string }[] = [
  { key: 'expense', label: '지출' },
  { key: 'income', label: '수입' },
  { key: 'savings', label: '저축' },
]

export function CategorySettingsHeader({
  title,
  onBack,
  right,
}: {
  title: string
  onBack: () => void
  right: React.ReactNode
}) {
  return (
    <header className="relative flex items-center justify-between px-5 pt-[env(safe-area-inset-top,0px)] h-14">
      <button onClick={onBack} className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-muted-foreground z-10">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m15 18-6-6 6-6" />
        </svg>
      </button>
      <h1 className="absolute left-1/2 -translate-x-1/2 text-[16px] font-semibold text-center pointer-events-none">{title}</h1>
      {right}
    </header>
  )
}

export function CategoryTypeTabs({
  type,
  onChange,
}: {
  type: TypeTab
  onChange: (type: TypeTab) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {TYPE_LABELS.map(({ key, label }) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={`px-4 py-2 rounded-[18px] text-[14px] font-medium transition-colors ${
            type === key
              ? key === 'income'
                ? 'bg-[#14b8a6] text-white'
                : key === 'expense'
                  ? 'bg-[#5865F2] text-white'
                  : 'bg-accent-purple text-white'
              : 'bg-muted text-muted-foreground'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

export function AddRootCategoryRow({
  value,
  onChange,
  onSubmit,
  onCancel,
  inline = false,
}: {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  onCancel: () => void
  inline?: boolean
}) {
  return (
    <div className={`flex items-center gap-3 px-4 py-3 ${inline ? '' : 'mb-6 rounded-[22px] bg-surface border border-border/50'}`}>
      <span className="text-[24px] flex-shrink-0 opacity-0">•</span>
      <input
        type="text"
        placeholder="새 카테고리명"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
        autoFocus
        style={{ fontSize: '16px' }}
        className="flex-1 min-w-0 bg-transparent text-[16px] text-foreground placeholder:text-muted-foreground/70 outline-none"
      />
      <div className="flex items-center justify-end gap-2 min-w-[88px] flex-shrink-0 overflow-visible">
        <button onClick={onSubmit} className="flex items-center justify-center w-8 h-8 rounded-full text-foreground flex-shrink-0" aria-label="추가">
          <Check size={18} />
        </button>
        <button onClick={onCancel} className="flex items-center justify-center w-8 h-8 rounded-full text-muted-foreground flex-shrink-0" aria-label="취소">
          <X size={18} />
        </button>
      </div>
    </div>
  )
}

export function CategoryGrid({
  parents,
  editMode,
  draggingId,
  suppressClick,
  getEmoji,
  onSelect,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  onTouchCancel,
  onAdd,
  addRow,
}: {
  parents: Category[]
  editMode: boolean
  draggingId: string | null
  suppressClick: boolean
  getEmoji: (parent: Category) => string
  onSelect: (parent: Category) => void
  onTouchStart: (parent: Category, event: React.TouchEvent<HTMLButtonElement>) => void
  onTouchMove: (event: React.TouchEvent<HTMLButtonElement>) => void
  onTouchEnd: () => void
  onTouchCancel: () => void
  onAdd?: () => void
  addRow?: React.ReactNode
}) {
  return (
    <div className="rounded-[22px] bg-surface border border-border/50 overflow-hidden">
      {parents.map((parent, index) => (
        <>
          {index > 0 && <div className="ml-[52px] mr-4 h-px bg-border/50" />}
          <button
          key={parent.id}
          data-category-id={parent.id}
          onClick={() => {
            if (editMode || draggingId || suppressClick) return
            onSelect(parent)
          }}
          onTouchStart={(event) => onTouchStart(parent, event)}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onTouchCancel={onTouchCancel}
          className={`relative w-full flex items-center gap-3 px-4 py-2 transition-all duration-200 ease-out select-none ${draggingId === parent.id ? 'bg-background opacity-35' : ''}`}
        >
          <span className={`text-[24px] flex-shrink-0 ${editMode ? 'animate-pulse' : ''}`}>{getEmoji(parent)}</span>
          <span className="flex-1 min-w-0 text-left text-[16px] text-foreground truncate">{parent.name}</span>
          {editMode ? (
            <span className="flex items-center justify-center w-11 self-stretch -my-1 text-muted-foreground/55 flex-shrink-0">
              <TextAlignJustify size={18} strokeWidth={2} />
            </span>
          ) : (
            <span className="text-muted-foreground flex-shrink-0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
            </span>
          )}
        </button>
        </>
      ))}
      {onAdd && parents.length > 0 && <div className="ml-[52px] mr-4 h-px bg-border/50" />}
      {onAdd && (addRow ?? (
        <button
          type="button"
          onClick={onAdd}
          className="w-full flex items-center justify-center px-4 py-3 text-muted-foreground"
        >
          <Plus size={18} strokeWidth={2.2} />
        </button>
      ))}
    </div>
  )
}

export function DragGhost({
  active,
  dragPosition,
  getEmoji,
}: {
  active: Category | null
  dragPosition: { x: number; y: number } | null
  getEmoji: (parent: Category) => string
}) {
  if (!active || !dragPosition) return null

  return (
    <div
      className="fixed pointer-events-none z-[90] -translate-x-1/2 -translate-y-1/2"
      style={{ left: dragPosition.x, top: dragPosition.y }}
    >
      <div className="flex items-center gap-3 py-4 px-4 rounded-[22px] bg-surface shadow-[0_12px_28px_rgba(0,0,0,0.18)] ring-1 ring-border opacity-95 min-w-[220px]">
        <span className="text-[24px]">{getEmoji(active)}</span>
        <span className="text-[16px] font-medium text-foreground">{active.name}</span>
      </div>
    </div>
  )
}
