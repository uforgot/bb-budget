'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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
}

export function CategoryPicker({ open, type, selected, onSelect, onClose }: CategoryPickerProps) {
  const router = useRouter()
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

        {/* Category grid + inline accordion */}
        <div className="overflow-y-auto px-5" style={{ paddingBottom: 'calc(40px + env(safe-area-inset-bottom, 0px))' }}>
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
                      const isSelected = selected === parent.id || (expandedParent === parent.id && children.some(c => c.id === selected))

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
                          className={`flex flex-col items-center gap-1 py-3 rounded-[18px] transition-colors ${
                            isExpanded
                              ? 'bg-white/10'
                              : isSelected
                                ? 'bg-white/10'
                                : 'bg-muted'
                          }`}
                        >
                          <span className="text-xl">{(parent as any).icon || CATEGORY_EMOJI[parent.name] || '📁'}</span>
                          <span className={`text-[11px] font-medium ${
                            isExpanded || isSelected ? 'text-foreground' : 'text-muted-foreground'
                          }`}>
                            {parent.name}
                          </span>
                        </button>
                      )
                    })}
                  </div>

                  {/* 2depth inline below this row */}
                  {expandedInRow && expandedChildren.length > 0 && (
                    <div className="bg-white/10 rounded-[18px] p-2 mb-2">
                      <div className="grid grid-cols-4 gap-1.5">
                        {expandedChildren.map((child) => (
                          <button
                            key={child.id}
                            onClick={() => {
                              onSelect(child.id, `${expandedInRow.name} > ${child.name}`)
                              onClose()
                            }}
                            className={`py-2 rounded-lg text-[11px] transition-colors ${
                              selected === child.id
                                ? 'bg-accent-blue text-white font-medium'
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

          {/* 카테고리 관리 */}
          <button
            onClick={() => {
              onClose()
              router.push('/settings/categories')
            }}
            className="w-full mt-4 mb-4 py-3.5 rounded-[18px] bg-muted text-[16px] font-medium text-muted-foreground"
          >
            카테고리 관리하기
          </button>
        </div>
      </div>
    </div>
  )
}
