'use client'

import { useState, useEffect } from 'react'
import { getCategories, type Category } from '@/lib/api'

interface CategoryPickerProps {
  open: boolean
  type: 'income' | 'expense' | 'savings'
  selected: string
  onSelect: (categoryId: string, categoryName: string) => void
  onTypeChange: (type: 'income' | 'expense' | 'savings') => void
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
}

const TYPE_LABELS: { key: 'income' | 'expense' | 'savings'; label: string; active: string }[] = [
  { key: 'income', label: '수입', active: 'bg-blue-400 text-white' },
  { key: 'expense', label: '지출', active: 'bg-red-400 text-white' },
  { key: 'savings', label: '저축', active: 'bg-green-400 text-white' },
]

export function CategoryPicker({ open, type, selected, onSelect, onTypeChange, onClose }: CategoryPickerProps) {
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
        <div className="px-5 pt-5 pb-3 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
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
          {/* Type tabs */}
          <div className="flex gap-2">
            {TYPE_LABELS.map(({ key, label, active }) => (
              <button
                key={key}
                onClick={() => {
                  onTypeChange(key)
                  setExpandedParent(null)
                }}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  type === key ? active : 'bg-muted text-muted-foreground'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Category grid + inline accordion */}
        <div className="overflow-y-auto px-5 pb-24">
          {(() => {
            // Split parents into rows of 4
            const rows: typeof parents[] = []
            for (let i = 0; i < parents.length; i += 4) {
              rows.push(parents.slice(i, i + 4))
            }

            return rows.map((row, rowIdx) => {
              // Check if any parent in this row is expanded
              const expandedInRow = row.find(p => p.id === expandedParent)
              const expandedChildren = expandedInRow ? childrenOf(expandedInRow.id) : []

              return (
                <div key={rowIdx}>
                  {/* Row of 4 */}
                  <div className="grid grid-cols-4 gap-2 mb-2">
                    {row.map((parent) => {
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

                  {/* 2depth inline below this row */}
                  {expandedInRow && expandedChildren.length > 0 && (
                    <div className="bg-muted/30 rounded-xl p-2 mb-2">
                      <div className="grid grid-cols-3 gap-1.5">
                        {expandedChildren.map((child) => (
                          <button
                            key={child.id}
                            onClick={() => {
                              onSelect(child.id, `${expandedInRow.name} > ${child.name}`)
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
              )
            })
          })()}
        </div>
      </div>
    </div>
  )
}
