import type { Category } from '@/lib/api'
import { Check, SquarePen, Trash2, X } from 'lucide-react'
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
          className="w-36 h-36 bg-surface rounded-[22px] flex flex-col items-center justify-center border border-border/50 relative"
        >
          <span style={{ fontSize: '64px' }}>{emoji}</span>
          <span className="mt-3 inline-flex items-center justify-center size-7 rounded-full bg-muted text-muted-foreground">
            <SquarePen size={12} />
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
    <div className="flex items-center gap-3 py-4 border-b border-border">
      <span className="text-[14px] text-muted-foreground w-24 flex-shrink-0">카테고리명</span>
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
    <div className="flex items-start gap-3 py-4 border-b border-border">
      <span className="text-[14px] text-muted-foreground w-24 flex-shrink-0 mt-3">소분류</span>
      <div className="flex-1">
        <div className="rounded-[22px] bg-surface border border-border/50 overflow-hidden">
          {children.map((child, index) => {
            const isEditing = editingChildId === child.id
            return (
              <div key={child.id} className={`${index !== 0 ? 'border-t border-border/50' : ''} px-4 py-3`}>
                <div className="flex items-center justify-between gap-3">
                  {isEditing ? (
                    <input
                      type="text"
                      value={editingChildName}
                      onChange={(e) => onChangeEditingChildName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && onSaveEdit()}
                      autoFocus
                      style={{ fontSize: '16px' }}
                      className="flex-1 bg-transparent outline-none"
                    />
                  ) : (
                    <span className="text-[16px]">{child.name}</span>
                  )}

                  <div className="flex items-center gap-1">
                    {isEditing ? (
                      <>
                        <button onClick={onSaveEdit} className="flex items-center justify-center size-8 rounded-full text-accent-blue hover:bg-muted" aria-label="확인">
                          <Check size={16} />
                        </button>
                        <button onClick={() => onRemove(child)} className="flex items-center justify-center size-8 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="삭제">
                          <Trash2 size={16} />
                        </button>
                        <button onClick={onCancelEdit} className="flex items-center justify-center size-8 rounded-full text-muted-foreground hover:bg-muted" aria-label="취소">
                          <X size={16} />
                        </button>
                      </>
                    ) : (
                      <button onClick={() => onStartEdit(child)} className="flex items-center justify-center size-8 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="편집">
                        <SquarePen size={15} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}

          {addingSubCat ? (
            <div className={`${children.length ? 'border-t border-border/50' : ''} px-4 py-3`}>
              <div className="flex items-center justify-between gap-3">
                <input
                  type="text"
                  value={newSubCat}
                  onChange={(e) => onChangeNewSubCat(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
                  autoFocus
                  placeholder="이름"
                  style={{ fontSize: '16px' }}
                  className="flex-1 bg-transparent outline-none"
                />
                <button onClick={onSubmit} className="flex items-center justify-center size-8 rounded-full text-accent-blue hover:bg-muted" aria-label="확인">
                  <Check size={16} />
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={onStartAdd}
              className={`${children.length ? 'border-t border-border/50' : ''} flex w-full items-center justify-between px-4 py-3 text-left`}
            >
              <span className="text-[16px] text-muted-foreground">소분류 추가</span>
              <span className="flex items-center justify-center size-8 rounded-full text-muted-foreground">
                <SquarePen size={15} />
              </span>
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
    <div className="mt-10">
      <button onClick={onSubmit} className="w-full py-3 text-white text-[16px] font-semibold rounded-[22px] bg-accent-blue">
        수정 완료
      </button>
    </div>
  )
}
