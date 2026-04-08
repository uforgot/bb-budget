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
  inline?: boolean
}

const TYPE_COLOR: Record<'income' | 'expense' | 'savings', string> = {
  income: 'bg-[#ccfbf1] dark:bg-[#14b8a6]',
  expense: 'bg-[#eef2ff] dark:bg-[#5865F2]',
  savings: 'bg-[#f3e8ff] dark:bg-accent-purple',
}
const TYPE_CHILD_COLOR: Record<'income' | 'expense' | 'savings', string> = {
  income: 'bg-[#14b8a6] text-white',
  expense: 'bg-[#5865F2] text-white',
  savings: 'bg-accent-purple text-white',
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

export function CategoryPicker({ open, type, selected, onSelect, onClose, inline = false }: CategoryPickerProps) {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [expandedParent, setExpandedParent] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      getCategories(type).then(cats => {
        setCategories(cats)
        // 수정 모드: 선택된 카테고리의 부모를 자동 펼침
        if (selected) {
          const selectedCat = cats.find(c => c.id === selected)
          if (selectedCat?.parent_id) {
            setExpandedParent(selectedCat.parent_id)
          } else {
            setExpandedParent(null)
          }
        } else {
          setExpandedParent(null)
        }
      }).catch(() => {})
    }
  }, [open, type, selected])

  if (!open) return null

  const parents = categories
    .filter(c => !c.parent_id)
    .sort((a, b) => a.sort_order - b.sort_order)

  const childrenOf = (parentId: string) =>
    categories
      .filter(c => c.parent_id === parentId)
      .sort((a, b) => a.sort_order - b.sort_order)

  const gridContent = (
    <>
      {(() => {
        const rows: typeof parents[] = []
        for (let i = 0; i < parents.length; i += 4) {
          rows.push(parents.slice(i, i + 4))
        }
        return rows.map((row, rowIdx) => {
          const expandedInRow = row.find(p => p.id === expandedParent)
          const expandedChildren = expandedInRow ? childrenOf(expandedInRow.id) : []
          return (
            <div key={rowIdx}>
              <div className="grid grid-cols-4 gap-2 mb-2">
                {row.map((parent) => {
                  const isExpanded = expandedParent === parent.id
                  const children = childrenOf(parent.id)
                  const hasChildren = children.length > 0
                  const hasSelectedChild = children.some(c => c.id === selected)
                  const isSelected = selected === parent.id || hasSelectedChild
                  return (
                    <button
                      key={parent.id}
                      onClick={() => {
                        if (hasChildren) {
                          // 수정 모드에서 이미 해당 부모가 펜츼 상태일 때: 사용자가 다른 부모를 변경하려는 게 아니면 철원다 닫지 말고 유지
                          const selectedInThisParent = selected === parent.id || children.some(c => c.id === selected)
                          if (isExpanded && selectedInThisParent) {
                            // 이미 선택된 부모 클릭 시 그냥 유지
                            return
                          }
                          setExpandedParent(isExpanded ? null : parent.id)
                        } else {
                          onSelect(parent.id, parent.name)
                          if (!inline) onClose()
                        }
                      }}
                      className={`flex flex-col items-center gap-1 py-3 rounded-[22px] transition-colors ${
                        isSelected ? TYPE_COLOR[type] : isExpanded ? 'bg-[#eceef8] dark:bg-muted' : 'bg-[#f5f5f7] dark:bg-muted'
                      }`}
                    >
                      <span className="text-xl">{(parent as any).icon || CATEGORY_EMOJI[parent.name] || '📁'}</span>
                      <span className={`text-[12px] font-medium ${
                        isSelected ? 'text-foreground dark:text-white' : isExpanded ? 'text-foreground' : 'text-muted-foreground'
                      }`}>
                        {parent.name}
                      </span>
                    </button>
                  )
                })}
              </div>
              {expandedInRow && expandedChildren.length > 0 && (
                <div className="bg-white/10 rounded-[22px] p-2 mb-2">
                  <div className="grid grid-cols-4 gap-1.5">
                    {expandedChildren.map((child) => (
                      <button
                        key={child.id}
                        onClick={() => {
                          onSelect(child.id, `${expandedInRow.name} > ${child.name}`)
                          if (!inline) onClose()
                        }}
                        className={`py-2 rounded-lg text-[12px] transition-colors ${
                          selected === child.id
                            ? TYPE_CHILD_COLOR[type] + ' font-medium'
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
      <button
        onClick={() => {
          if (!inline) onClose()
          router.push('/settings/categories')
        }}
        className="w-full mt-2 mb-2 py-3.5 rounded-[22px] bg-[#f5f5f7] dark:bg-muted text-[16px] font-medium text-muted-foreground"
      >
        카테고리 관리하기
      </button>
    </>
  )

  // 인라인 모드 — 바텀시트 없이 그대로 렌더
  if (inline) {
    return (
      <div className="mt-3 mb-3">
        {gridContent}
      </div>
    )
  }

  // 바텀시트 모드 (기존)
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-md bg-card rounded-t-2xl overflow-hidden flex flex-col" style={{ maxHeight: '75dvh' }}>
        <div className="flex items-center justify-between px-5 pt-5 pb-3 flex-shrink-0">
          <h3 className="text-base font-semibold">카테고리</h3>
          <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground" aria-label="닫기">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18" /><path d="m6 6 12 12" />
            </svg>
          </button>
        </div>
        <div className="overflow-y-auto px-5" style={{ paddingBottom: 'calc(40px + env(safe-area-inset-bottom, 0px))' }}>
          {gridContent}
        </div>
      </div>
    </div>
  )
}
