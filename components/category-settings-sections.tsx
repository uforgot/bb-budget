import { TextWrap } from 'lucide-react'
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
}: {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  onCancel: () => void
}) {
  return (
    <div className="flex items-center gap-2 mb-6">
      <input
        type="text"
        placeholder="새 카테고리명"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
        autoFocus
        style={{ fontSize: '16px' }}
        className="flex-1 bg-card border border-border rounded-[18px] px-4 py-2.5"
      />
      <button onClick={onSubmit} className="px-4 py-2.5 rounded-[18px] bg-surface text-[14px] font-medium text-foreground">추가</button>
      <button onClick={onCancel} className="px-4 py-2.5 rounded-[18px] bg-surface text-[14px] font-medium text-muted-foreground">취소</button>
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
}) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {parents.map((parent) => (
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
          className={`relative flex flex-col items-center gap-1 py-3 rounded-[22px] transition-all duration-200 ease-out select-none touch-none ${
            draggingId === parent.id ? 'bg-background ring-1 ring-border opacity-35' : 'bg-muted'
          }`}
        >
          {editMode && (
            <span className="absolute top-2.5 right-2.5 scale-90 text-muted-foreground/40">
              <TextWrap size={10} strokeWidth={2} />
            </span>
          )}
          <span className={`text-xl ${editMode ? 'animate-pulse' : ''}`}>{getEmoji(parent)}</span>
          <span className="text-[12px] font-medium text-muted-foreground">{parent.name}</span>
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
      <div className="flex flex-col items-center gap-1 py-3 px-4 rounded-[22px] bg-surface shadow-[0_12px_28px_rgba(0,0,0,0.18)] ring-1 ring-border opacity-95">
        <span className="text-xl">{getEmoji(active)}</span>
        <span className="text-[12px] font-medium text-muted-foreground">{active.name}</span>
      </div>
    </div>
  )
}
