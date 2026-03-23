'use client'

import { useState, useEffect } from 'react'
import { getCategories, type Category } from '@/lib/api'

interface CategoryPickerProps {
  open: boolean
  type: 'income' | 'expense' | 'savings'
  selected: string // category id
  onSelect: (categoryId: string, categoryName: string) => void
  onClose: () => void
}

export function CategoryPicker({ open, type, selected, onSelect, onClose }: CategoryPickerProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [expandedParent, setExpandedParent] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      getCategories(type).then(setCategories).catch(() => {})
    }
  }, [open, type])

  if (!open) return null

  // Split into parents and children
  const parents = categories
    .filter(c => !c.parent_id)
    .sort((a, b) => a.sort_order - b.sort_order)
  
  const childrenOf = (parentId: string) =>
    categories
      .filter(c => c.parent_id === parentId)
      .sort((a, b) => a.sort_order - b.sort_order)

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative w-full max-w-md bg-card rounded-t-2xl overflow-hidden flex flex-col" style={{ maxHeight: 'min(70dvh, 500px)' }}>
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
        <div className="overflow-y-auto px-5 pb-24">
          {parents.map((parent) => {
            const children = childrenOf(parent.id)
            const isExpanded = expandedParent === parent.id
            const hasChildren = children.length > 0

            return (
              <div key={parent.id}>
                {/* 1depth */}
                <button
                  onClick={() => {
                    if (hasChildren) {
                      setExpandedParent(isExpanded ? null : parent.id)
                    } else {
                      onSelect(parent.id, parent.name)
                      onClose()
                    }
                  }}
                  className={`w-full flex items-center justify-between py-3.5 border-b border-border/50 ${
                    selected === parent.id ? 'text-blue-400 font-medium' : 'text-foreground'
                  }`}
                >
                  <span className="text-sm">{parent.name}</span>
                  {hasChildren && (
                    <svg
                      width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                      className={`text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  )}
                </button>

                {/* 2depth */}
                {isExpanded && hasChildren && (
                  <div className="bg-muted/30 rounded-lg my-1">
                    {children.map((child) => (
                      <button
                        key={child.id}
                        onClick={() => {
                          onSelect(child.id, `${parent.name} > ${child.name}`)
                          onClose()
                        }}
                        className={`w-full text-left pl-8 pr-4 py-3 text-sm border-b border-border/30 last:border-b-0 ${
                          selected === child.id ? 'text-blue-400 font-medium' : 'text-foreground'
                        }`}
                      >
                        {child.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
