'use client'

import { useState } from 'react'

interface CategoryPickerProps {
  open: boolean
  categories: string[]
  selected: string
  onSelect: (cat: string) => void
  onClose: () => void
}

export function CategoryPicker({ open, categories, selected, onSelect, onClose }: CategoryPickerProps) {
  const [adding, setAdding] = useState(false)
  const [newCat, setNewCat] = useState('')

  if (!open) return null

  const handleAdd = () => {
    const trimmed = newCat.trim()
    if (trimmed) {
      onSelect(trimmed)
      setNewCat('')
      setAdding(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative w-full max-w-md bg-card border-t border-border rounded-t-2xl overflow-hidden max-h-[70dvh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 pb-3 flex-shrink-0">
          <h3 className="text-lg font-bold">카테고리 선택</h3>
          <button
            onClick={onClose}
            className="p-1 text-muted-foreground hover:text-foreground"
            aria-label="닫기"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18" /><path d="m6 6 12 12" />
            </svg>
          </button>
        </div>

        {/* Category list */}
        <div className="flex-1 overflow-y-auto px-5">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => { onSelect(cat); onClose() }}
              className={`w-full text-left py-3.5 border-b border-border/50 text-sm ${
                selected === cat ? 'text-primary font-medium' : 'text-foreground'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Add category */}
        <div className="flex-shrink-0 p-5 pt-3 border-t border-border">
          {adding ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="카테고리명 입력"
                value={newCat}
                onChange={(e) => setNewCat(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                autoFocus
                className="flex-1 bg-background border border-border rounded-lg px-3 py-2.5 text-sm"
              />
              <button
                onClick={handleAdd}
                className="px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium flex-shrink-0"
              >
                추가
              </button>
            </div>
          ) : (
            <button
              onClick={() => setAdding(true)}
              className="flex items-center gap-3 w-full text-sm text-muted-foreground"
            >
              <span className="size-10 bg-muted rounded-full flex items-center justify-center flex-shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5v14" /><path d="M5 12h14" />
                </svg>
              </span>
              카테고리 추가
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
