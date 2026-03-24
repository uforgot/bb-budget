'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getCategories, addCategory, type Category } from '@/lib/api'
import { createClient } from '@/lib/supabase'

type TypeTab = 'expense' | 'income' | 'savings'
const TYPE_LABELS: { key: TypeTab; label: string }[] = [
  { key: 'expense', label: '지출' },
  { key: 'income', label: '수입' },
  { key: 'savings', label: '저축' },
]

export default function CategoriesSettings() {
  const router = useRouter()
  const [type, setType] = useState<TypeTab>('expense')
  const [categories, setCategories] = useState<Category[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [adding, setAdding] = useState<string | null>(null) // null=not adding, 'root'=1depth, parentId=2depth
  const [newCat, setNewCat] = useState('')

  const loadCategories = async () => {
    const cats = await getCategories(type)
    setCategories(cats)
  }

  useEffect(() => {
    loadCategories()
    setExpandedId(null)
  }, [type])

  const parents = categories.filter(c => !c.parent_id).sort((a, b) => a.sort_order - b.sort_order)
  const childrenOf = (parentId: string) =>
    categories.filter(c => c.parent_id === parentId).sort((a, b) => a.sort_order - b.sort_order)

  const supabase = createClient() as any

  const handleRename = async (id: string) => {
    const trimmed = editValue.trim()
    if (!trimmed) return
    await supabase.from('categories').update({ name: trimmed }).eq('id', id)
    setEditingId(null)
    setEditValue('')
    loadCategories()
  }

  const handleDelete = async (id: string) => {
    // 자식도 삭제
    await supabase.from('categories').delete().eq('parent_id', id)
    await supabase.from('categories').delete().eq('id', id)
    loadCategories()
  }

  const handleAdd = async (parentId: string | null) => {
    const trimmed = newCat.trim()
    if (!trimmed) return
    await addCategory(trimmed, type)
    // parent_id 설정이 필요하면 업데이트
    if (parentId) {
      const allCats = await getCategories(type)
      const newOne = allCats.find(c => c.name === trimmed && !c.parent_id)
      if (newOne) {
        await supabase.from('categories').update({ parent_id: parentId }).eq('id', newOne.id)
      }
    }
    setNewCat('')
    setAdding(null)
    loadCategories()
  }

  const renderEditRow = (id: string) => (
    <div className="flex items-center gap-2 px-4 py-2">
      <input
        type="text"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleRename(id)}
        autoFocus
        style={{ fontSize: '16px' }}
        className="flex-1 bg-background border border-border rounded-lg px-3 py-1.5"
      />
      <button onClick={() => handleRename(id)} className="text-sm text-accent-blue font-medium">저장</button>
      <button onClick={() => { setEditingId(null); setEditValue('') }} className="text-sm text-muted-foreground">취소</button>
    </div>
  )

  const renderAddRow = (parentId: string | null) => (
    <div className="flex items-center gap-2 px-4 py-2">
      <input
        type="text"
        placeholder="카테고리명"
        value={newCat}
        onChange={(e) => setNewCat(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleAdd(parentId)}
        autoFocus
        style={{ fontSize: '16px' }}
        className="flex-1 bg-background border border-border rounded-lg px-3 py-1.5"
      />
      <button onClick={() => handleAdd(parentId)} className="text-sm text-accent-blue font-medium">추가</button>
      <button onClick={() => { setAdding(null); setNewCat('') }} className="text-sm text-muted-foreground">취소</button>
    </div>
  )

  return (
    <div className="min-h-dvh bg-background">
      <header className="flex items-center justify-between px-4 pt-[env(safe-area-inset-top,0px)] h-14 border-b border-border">
        <button onClick={() => router.back()} className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-muted-foreground">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
        <h1 className="text-[17px] font-semibold">카테고리 관리</h1>
        <div className="w-8" />
      </header>

      <div className="max-w-lg mx-auto px-4">
        {/* Type tabs */}
        <div className="flex gap-2 mt-4 mb-4">
          {TYPE_LABELS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setType(key)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                type === key ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Category list */}
        {parents.map((parent) => {
          const children = childrenOf(parent.id)
          const isExpanded = expandedId === parent.id

          return (
            <div key={parent.id} className="mb-2">
              {/* 1depth */}
              <div className="bg-card rounded-xl overflow-hidden">
                {editingId === parent.id ? (
                  renderEditRow(parent.id)
                ) : (
                  <div className="flex items-center justify-between px-4 py-3">
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : parent.id)}
                      className="flex items-center gap-2 flex-1"
                    >
                      <span className="text-[15px]">{parent.name}</span>
                      {children.length > 0 && (
                        <span className="text-[11px] text-muted-foreground">({children.length})</span>
                      )}
                      {children.length > 0 && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                          <path d="m6 9 6 6 6-6" />
                        </svg>
                      )}
                    </button>
                    <div className="flex items-center gap-3">
                      <button onClick={() => { setEditingId(parent.id); setEditValue(parent.name) }} className="text-xs text-accent-blue">수정</button>
                      <button onClick={() => handleDelete(parent.id)} className="text-xs text-accent-coral">삭제</button>
                    </div>
                  </div>
                )}

                {/* 2depth */}
                {isExpanded && (
                  <div className="bg-muted/30">
                    {children.map((child) => (
                      <div key={child.id}>
                        {editingId === child.id ? (
                          renderEditRow(child.id)
                        ) : (
                          <div className="flex items-center justify-between pl-8 pr-4 py-2.5 border-t border-border/30">
                            <span className="text-sm">{child.name}</span>
                            <div className="flex items-center gap-3">
                              <button onClick={() => { setEditingId(child.id); setEditValue(child.name) }} className="text-xs text-accent-blue">수정</button>
                              <button onClick={() => handleDelete(child.id)} className="text-xs text-accent-coral">삭제</button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}

                    {/* 2depth 추가 */}
                    {adding === parent.id ? (
                      renderAddRow(parent.id)
                    ) : (
                      <button
                        onClick={() => setAdding(parent.id)}
                        className="w-full pl-8 pr-4 py-2.5 border-t border-border/30 text-xs text-muted-foreground text-left"
                      >
                        + 하위 카테고리 추가
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })}

        {/* 1depth 추가 */}
        <div className="mt-3">
          {adding === 'root' ? (
            <div className="bg-card rounded-xl p-3">
              {renderAddRow(null)}
            </div>
          ) : (
            <button
              onClick={() => setAdding('root')}
              className="w-full bg-card rounded-xl px-4 py-3 flex items-center gap-3 text-sm text-muted-foreground"
            >
              <span className="size-8 bg-muted rounded-full flex items-center justify-center flex-shrink-0">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
