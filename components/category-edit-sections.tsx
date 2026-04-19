import type { Category } from '@/lib/api'
import { Check, SquarePen, Trash, X } from 'lucide-react'
import { EmojiPicker } from '@/components/emoji-picker'

export function CategoryEmojiCard({
  emoji,
  emojiPickerOpen,
  onOpen,
  onSelect,
  onClose,
}: {
  emoji: string
  emojiPickerOpen: boolean
  onOpen: () => void
  onSelect: (emoji: string) => void
  onClose: () => void
}) {
  return (
    <>
      <div className="flex justify-center mb-8">
        <button
          onClick={onOpen}
          className="w-36 h-36 bg-surface rounded-[22px] flex items-center justify-center relative"
        >
          <span className="-translate-y-2" style={{ fontSize: '64px' }}>{emoji}</span>
          <span className="absolute left-1/2 bottom-3 -translate-x-1/2 text-black/20 dark:text-white/20">
            <SquarePen size={14} />
          </span>
        </button>
      </div>
      <EmojiPicker open={emojiPickerOpen} onSelect={onSelect} onClose={onClose} />
    </>
  )
}

export function CategoryNameRow({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-4">
      <span className="text-[16px] text-foreground w-24 flex-shrink-0">카테고리명</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ fontSize: '16px' }}
        className="flex-1 bg-transparent outline-none"
      />
    </div>
  )
}

export function CategoryChildrenEditor({
  children,
  addingSubCat,
  newSubCat,
  editingChildId,
  editingChildName,
  onChangeNewSubCat,
  onChangeEditingChildName,
  onSubmit,
  onStartAdd,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onRemove,
}: {
  children: Category[]
  addingSubCat: boolean
  newSubCat: string
  editingChildId: string | null
  editingChildName: string
  onChangeNewSubCat: (value: string) => void
  onChangeEditingChildName: (value: string) => void
  onSubmit: () => void
  onStartAdd: () => void
  onStartEdit: (child: Category) => void
  onCancelEdit: () => void
  onSaveEdit: () => void
  onRemove: (child: Category) => void
}) {
  return (
    <div className="relative flex items-start gap-3 px-4 py-4">
      <div className="absolute left-4 right-4 top-0 h-px bg-black/10 dark:bg-white/10" />
      <span className="text-[16px] text-foreground w-24 flex-shrink-0 mt-1.5">소분류</span>
      <div className="flex-1">
        <div className="flex flex-wrap gap-2">
          {children.map((child) => {
            const isEditing = editingChildId === child.id
            return isEditing ? (
              <span key={child.id} className="inline-flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full text-[16px]">
                <input
                  type="text"
                  value={editingChildName}
                  onChange={(e) => onChangeEditingChildName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && onSaveEdit()}
                  autoFocus
                  style={{ fontSize: '16px' }}
                  className="bg-transparent px-1 py-0.5 rounded-full text-sm w-28 outline-none"
                />
                <button onClick={onSaveEdit} className="flex items-center justify-center size-7 rounded-full text-accent-blue hover:bg-background/60" aria-label="확인">
                  <Check size={14} />
                </button>
                <button onClick={() => onRemove(child)} className="flex items-center justify-center size-7 rounded-full text-black/20 dark:text-white/20 hover:bg-background/60 hover:text-foreground" aria-label="삭제">
                  <Trash size={14} />
                </button>
                <button onClick={onCancelEdit} className="flex items-center justify-center size-7 rounded-full text-black/20 dark:text-white/20 hover:bg-background/60" aria-label="취소">
                  <X size={14} />
                </button>
              </span>
            ) : (
              <span key={child.id} className="inline-flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-full text-[16px]">
                {child.name}
                <button onClick={() => onStartEdit(child)} className="flex items-center justify-center size-6 rounded-full text-black/20 dark:text-white/20 hover:text-foreground" aria-label="편집">
                  <SquarePen size={13} />
                </button>
              </span>
            )
          })}

          {addingSubCat ? (
              <span className="inline-flex items-center gap-1">
                <input
                  type="text"
                  value={newSubCat}
                  onChange={(e) => onChangeNewSubCat(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
                  autoFocus
                  placeholder="이름"
                  style={{ fontSize: '16px' }}
                  className="bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-full text-sm w-20 outline-none"
                />
                <button onClick={onSubmit} className="text-xs text-accent-blue">확인</button>
              </span>
            ) : (
              <button
                onClick={onStartAdd}
                className="inline-flex items-center bg-gray-100 dark:bg-gray-700 text-muted-foreground px-3 py-1.5 rounded-full text-sm font-medium"
              >
                추가
              </button>
            )}
            </div>
          </div>
    </div>
  )
}

export function CategoryEditSubmitBar({
  onSubmit,
}: {
  onSubmit: () => void
}) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 bg-background">
      <div className="w-full max-w-lg mx-auto px-5 pt-3" style={{ paddingBottom: 'max(28px, env(safe-area-inset-bottom, 28px))' }}>
        <button onClick={onSubmit} className="w-full py-3.5 text-white text-[16px] font-semibold rounded-[22px] bg-accent-blue">
          수정 완료하기
        </button>
      </div>
    </div>
  )
}
