'use client'

import { useState, useEffect } from 'react'
import { getCategories, type Category } from '@/lib/api'

interface CategoryPickerProps {
  open: boolean
  type: 'income' | 'expense' | 'savings'
  selected: string
  onSelect: (categoryId: string, categoryName: string) => void
  onClose: () => void
}

const CATEGORY_EMOJI: Record<string, string> = {
  '식비': '🍽️',
  '생활': '🏠',
  '주거': '🏢',
  '교통': '🚗',
  '쇼핑': '🛍️',
  '건강': '💊',
  '여가': '🎬',
  '자녀': '👶',
  '반려동물': '🐾',
  '경조사': '💐',
  '보험': '🛡️',
  '세금': '📋',
  '월급': '💰',
  '상여금': '🎁',
  '부수입': '💵',
  '예적금': '🏦',
  '투자': '📈',
  '보험': '🛡️',
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

      <div className="relative w-full max-w-md bg-card rounded-t-2xl overflow-hidden flex flex-col" style={{ maxHeight: '75dvh' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 flex-shrink-0">
          <h3 className="text-base font-semibold">카테고리</h3>
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

        {/* Category grid + accordion */}
        <div className="overflow-y-auto px-5 pb-24">
          {/* 1depth grid */}
          <div className="grid grid-cols-4 gap-2 mb-2">
            {parents.map((parent) => {
              const isExpanded = expandedParent === parent.id
              const children = childrenOf(parent.id)
              const hasChildren = children.length > 0
              const isSelected = selected === parent.id || children.some(c => c.id === selected)

              return (
                <button
                  key={parent.id}
                  onClick={() => {
                    if (hasChildren) {
                      setExpandedParent(isExpanded ? null : parent.id)
                    } else {
                      onSelect(parent.id, parent.name)
                      onClose()
                    }
                  }}
                  className={`flex flex-col items-center gap-1 py-3 rounded-xl transition-colors ${
                    isExpanded || isSelected
                      ? 'bg-blue-400/15 ring-1 ring-blue-400/30'
                      : 'bg-muted/50'
                  }`}
                >
                  <span className="text-xl">{CATEGORY_EMOJI[parent.name] || '📁'}</span>
                  <span className={`text-[11px] font-medium ${
                    isExpanded || isSelected ? 'text-blue-400' : 'text-muted-foreground'
                  }`}>
                    {parent.name}
                  </span>
                </button>
              )
            })}
          </div>

          {/* 2depth - expanded children */}
          {expandedParent && (
            <div className="bg-muted/30 rounded-xl p-2 mt-1">
              <div className="grid grid-cols-3 gap-1.5">
                {childrenOf(expandedParent).map((child) => (
                  <button
                    key={child.id}
                    onClick={() => {
                      const parent = parents.find(p => p.id === expandedParent)
                      onSelect(child.id, `${parent?.name} > ${child.name}`)
                      onClose()
                    }}
                    className={`py-2.5 rounded-lg text-sm transition-colors ${
                      selected === child.id
                        ? 'bg-blue-400 text-white font-medium'
                        : 'bg-card text-foreground'
                    }`}
                  >
                    {child.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
