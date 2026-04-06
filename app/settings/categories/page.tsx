'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { getCategories, addCategory, reorderParentCategories, type Category } from '@/lib/api'
import { createClient } from '@/lib/supabase'
import { EmojiPicker } from '@/components/emoji-picker'

type TypeTab = 'expense' | 'income' | 'savings'
const TYPE_LABELS: { key: TypeTab; label: string }[] = [
  { key: 'income', label: '수입' },
  { key: 'expense', label: '지출' },
  { key: 'savings', label: '저축' },
]

const EMOJI_MAP: Record<string, string> = {
  '식비': '🍽️', '생활': '🏠', '주거': '🏢', '교통': '🚗', '쇼핑': '🛍️',
  '건강': '💊', '여가': '🎬', '자녀': '👶', '반려동물': '🐾', '경조사': '💐',
  '보험': '🛡️', '세금': '📋', '월급': '💰', '상여금': '🎁', '부수입': '💵',
  '예적금': '🏦', '투자': '📈',
}

function getEmoji(cat: Category) {
  return (cat as any).icon || EMOJI_MAP[cat.name] || '📁'
}

export default function CategoriesSettings() {
  const router = useRouter()
  const [type, setType] = useState<TypeTab>('expense')
  const [categories, setCategories] = useState<Category[]>([])
  const [editMode, setEditMode] = useState(false)
  const [editingParent, setEditingParent] = useState<Category | null>(null)
  const [editName, setEditName] = useState('')
  const [newSubCat, setNewSubCat] = useState('')
  const [addingSubCat, setAddingSubCat] = useState(false)
  const [addingRoot, setAddingRoot] = useState(false)
  const [newRootName, setNewRootName] = useState('')
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [orderedParentIds, setOrderedParentIds] = useState<string[]>([])
  const [dragPosition, setDragPosition] = useState<{ x: number; y: number } | null>(null)

  const dragTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const suppressClickRef = useRef(false)
  const activeDragIdRef = useRef<string | null>(null)

  const supabase = createClient() as any

  const loadCategories = async () => {
    const cats = await getCategories(type)
    setCategories(cats)
  }

  useEffect(() => {
    loadCategories()
    setEditingParent(null)
    setEditMode(false)
  }, [type])

  const parents = categories.filter(c => !c.parent_id).sort((a, b) => a.sort_order - b.sort_order)
  const orderedParents = orderedParentIds.length
    ? orderedParentIds.map(id => parents.find(parent => parent.id === id)).filter(Boolean) as Category[]
    : parents

  useEffect(() => {
    setOrderedParentIds(parents.map(parent => parent.id))
  }, [categories])

  const childrenOf = (parentId: string) =>
    categories.filter(c => c.parent_id === parentId).sort((a, b) => a.sort_order - b.sort_order)

  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string; type: 'parent' | 'child' } | null>(null)

  const clearDragTimer = () => {
    if (dragTimerRef.current) {
      clearTimeout(dragTimerRef.current)
      dragTimerRef.current = null
    }
  }

  const persistOrder = async (nextIds: string[]) => {
    const prevCategories = categories
    setCategories(prev => {
      const parentMap = new Map(prev.filter(c => !c.parent_id).map(c => [c.id, c]))
      const reorderedParents = nextIds
        .map((id, index) => {
          const parent = parentMap.get(id)
          return parent ? { ...parent, sort_order: index + 1 } : null
        })
        .filter(Boolean) as Category[]
      const children = prev.filter(c => c.parent_id)
      return [...reorderedParents, ...children]
    })

    try {
      await reorderParentCategories(type, nextIds)
      await loadCategories()
    } catch (error) {
      setCategories(prevCategories)
      throw error
    }
  }

  const handleMoveOver = (overId: string) => {
    const activeId = activeDragIdRef.current
    if (!activeId || activeId === overId) return

    setOrderedParentIds(prev => {
      const fromIndex = prev.indexOf(activeId)
      const toIndex = prev.indexOf(overId)
      if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return prev
      const next = [...prev]
      next.splice(fromIndex, 1)
      next.splice(toIndex, 0, activeId)
      return next
    })
  }

  const handleTouchMove = (event: React.TouchEvent<HTMLButtonElement>) => {
    if (!editMode || !activeDragIdRef.current) return
    const touch = event.touches[0]
    if (!touch) return
    setDragPosition({ x: touch.clientX, y: touch.clientY })
    const element = document.elementFromPoint(touch.clientX, touch.clientY)?.closest('[data-category-id]') as HTMLElement | null
    const overId = element?.dataset.categoryId
    if (!overId) return
    handleMoveOver(overId)
  }

  const finishDrag = async () => {
    clearDragTimer()
    const activeId = activeDragIdRef.current
    if (!activeId) return
    const nextIds = [...orderedParentIds]
    activeDragIdRef.current = null
    setDraggingId(null)
    setDragPosition(null)
    suppressClickRef.current = true
    setTimeout(() => {
      suppressClickRef.current = false
    }, 250)
    await persistOrder(nextIds)
  }

  const cancelDrag = () => {
    clearDragTimer()
    activeDragIdRef.current = null
    setDraggingId(null)
    setDragPosition(null)
    setOrderedParentIds(parents.map(parent => parent.id))
  }

  const handleDeleteParent = async (id: string) => {
    const children = childrenOf(id)
    for (const child of children) {
      await supabase.from('transactions').update({ category_id: null }).eq('category_id', child.id)
    }
    await supabase.from('transactions').update({ category_id: null }).eq('category_id', id)
    await supabase.from('categories').delete().eq('parent_id', id)
    await supabase.from('categories').delete().eq('id', id)
    loadCategories()
  }

  const handleDeleteChild = async (id: string) => {
    await supabase.from('transactions').update({ category_id: null }).eq('category_id', id)
    await supabase.from('categories').delete().eq('id', id)
    loadCategories()
  }

  const confirmDelete = () => {
    if (!deleteConfirm) return
    if (deleteConfirm.type === 'parent') handleDeleteParent(deleteConfirm.id)
    else handleDeleteChild(deleteConfirm.id)
    setDeleteConfirm(null)
  }

  const handleRenameSave = async () => {
    if (!editingParent || !editName.trim()) return
    await supabase.from('categories').update({ name: editName.trim() }).eq('id', editingParent.id)
    setEditingParent({ ...editingParent, name: editName.trim() })
    loadCategories()
  }

  const [savingSub, setSavingSub] = useState(false)
  const handleAddSubCat = async () => {
    if (!editingParent || !newSubCat.trim() || savingSub) return
    setSavingSub(true)
    try {
      await supabase.from('categories').insert({
        name: newSubCat.trim(),
        type,
        parent_id: editingParent.id,
        sort_order: childrenOf(editingParent.id).length + 1,
      })
      setNewSubCat('')
      setAddingSubCat(false)
      await loadCategories()
    } finally {
      setSavingSub(false)
    }
  }

  const [savingRoot, setSavingRoot] = useState(false)
  const handleAddRoot = async () => {
    if (!newRootName.trim() || savingRoot) return
    setSavingRoot(true)
    try {
      await addCategory(newRootName.trim(), type)
      setNewRootName('')
      setAddingRoot(false)
      await loadCategories()
    } finally {
      setSavingRoot(false)
    }
  }

  if (editingParent) {
    const children = childrenOf(editingParent.id)
    return (
      <div className="min-h-dvh bg-background">
        <header className="relative flex items-center justify-between px-4 pt-[env(safe-area-inset-top,0px)] h-14">
          <button onClick={() => { setEditingParent(null); setAddingSubCat(false); setNewSubCat(''); setEditName(''); loadCategories() }} className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-muted-foreground z-10">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
          <h1 className="absolute left-1/2 -translate-x-1/2 text-[16px] font-semibold text-center">카테고리 편집</h1>
          <button onClick={() => { setEditingParent(null); setAddingSubCat(false); setNewSubCat(''); setEditName(''); loadCategories() }} className="text-[14px] text-accent-blue font-medium z-10">완료</button>
        </header>

        <div className="max-w-lg mx-auto px-5 pt-6">
          <div className="flex justify-center mb-8">
            <button
              onClick={() => setEmojiPickerOpen(true)}
              className="w-36 h-36 bg-surface rounded-[22px] flex flex-col items-center justify-center border border-border/50 relative"
            >
              <span style={{ fontSize: '64px' }}>{getEmoji(editingParent)}</span>
              <span className="text-xs text-muted-foreground mt-3">변경</span>
            </button>
          </div>
          <EmojiPicker
            open={emojiPickerOpen}
            onSelect={async (emoji) => {
              await supabase.from('categories').update({ icon: emoji }).eq('id', editingParent.id)
              setEditingParent({ ...editingParent, icon: emoji } as any)
              loadCategories()
            }}
            onClose={() => setEmojiPickerOpen(false)}
          />

          <div className="flex items-center gap-3 py-4 border-b border-border">
            <span className="text-[14px] text-muted-foreground w-24 flex-shrink-0">카테고리명</span>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={handleRenameSave}
              style={{ fontSize: '16px' }}
              className="flex-1 bg-transparent outline-none"
            />
          </div>

          <div className="flex items-start gap-3 py-4 border-b border-border">
            <span className="text-[14px] text-muted-foreground w-24 flex-shrink-0 mt-1.5">소분류</span>
            <div className="flex-1">
              <div className="flex flex-wrap gap-2">
                {children.map((child) => (
                  <span key={child.id} className="inline-flex items-center gap-1 bg-muted px-3 py-1.5 rounded-full text-sm">
                    {child.name}
                    <button onClick={() => setDeleteConfirm({ id: child.id, name: child.name, type: 'child' })} className="text-muted-foreground hover:text-foreground">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" /><path d="m15 9-6 6" /><path d="m9 9 6 6" />
                      </svg>
                    </button>
                  </span>
                ))}

                {addingSubCat ? (
                  <span className="inline-flex items-center gap-1">
                    <input
                      type="text"
                      value={newSubCat}
                      onChange={(e) => setNewSubCat(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddSubCat()}
                      autoFocus
                      placeholder="이름"
                      style={{ fontSize: '16px' }}
                      className="bg-muted px-3 py-1.5 rounded-full text-sm w-20 outline-none"
                    />
                    <button onClick={handleAddSubCat} className="text-xs text-accent-blue">확인</button>
                  </span>
                ) : (
                  <button
                    onClick={() => setAddingSubCat(true)}
                    className="inline-flex items-center bg-muted text-muted-foreground px-3 py-1.5 rounded-full text-sm font-medium"
                  >
                    추가
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="mt-10">
            <button
              onClick={() => setDeleteConfirm({ id: editingParent.id, name: editingParent.name, type: 'parent' })}
              className="w-full py-3 text-accent-coral text-[16px] font-medium rounded-[22px] bg-accent-coral/10"
            >
              카테고리 삭제
            </button>
          </div>
        </div>

        {deleteConfirm && (
          <>
            <div className="fixed inset-0 bg-black/50 z-[70]" onClick={() => setDeleteConfirm(null)} />
            <div className="fixed inset-0 z-[80] flex items-center justify-center px-8">
              <div className="bg-card rounded-[22px] px-6 py-5 w-full max-w-sm">
                <p className="text-sm font-semibold mb-2">{deleteConfirm.name} 카테고리를 정말 삭제하시겠습니까?</p>
                <p className="text-xs text-muted-foreground mb-4">삭제하면 해당 카테고리의 내역이 미분류로 변경됩니다.</p>
                <div className="flex gap-3">
                  <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-3.5 rounded-[22px] bg-background text-[16px] font-medium text-muted-foreground">취소하기</button>
                  <button onClick={() => { const isParent = deleteConfirm.type === 'parent'; confirmDelete(); if (isParent) setEditingParent(null) }} className="flex-1 py-3.5 rounded-[22px] bg-accent-coral/10 text-accent-coral text-[16px] font-semibold">삭제하기</button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-background">
      <header className="relative flex items-center justify-between px-4 pt-[env(safe-area-inset-top,0px)] h-14">
        <button onClick={() => router.back()} className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-muted-foreground">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
        <h1 className="absolute left-1/2 -translate-x-1/2 text-[16px] font-semibold pointer-events-none">카테고리 관리</h1>
        <div className="w-8" />
      </header>

      <div className="max-w-lg mx-auto px-5 pt-6">
        <div className="flex gap-1.5 mb-6">
          {TYPE_LABELS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setType(key)}
              className={`flex-1 py-2.5 rounded-[22px] text-[14px] font-medium transition-colors ${
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

        <div className="grid grid-cols-4 gap-2">
          {orderedParents.map((parent) => (
            <button
              key={parent.id}
              data-category-id={parent.id}
              onClick={() => {
                if (editMode || draggingId || suppressClickRef.current) return
                setEditingParent(parent)
                setEditName(parent.name)
                setAddingSubCat(false)
                setNewSubCat('')
              }}
              onTouchStart={(event) => {
                if (!editMode) return
                clearDragTimer()
                activeDragIdRef.current = parent.id
                setDraggingId(parent.id)
                const touch = event.touches[0]
                if (touch) setDragPosition({ x: touch.clientX, y: touch.clientY })
              }}
              onTouchMove={handleTouchMove}
              onTouchEnd={() => {
                if (!editMode) return
                finishDrag()
              }}
              onTouchCancel={cancelDrag}
              className={`relative flex flex-col items-center gap-1 py-3 rounded-[22px] transition-colors select-none touch-none ${
                draggingId === parent.id ? 'bg-background ring-1 ring-border opacity-35' : 'bg-muted'
              }`}
            >
              {editMode && <span className="absolute top-1.5 right-1.5 text-[10px] text-muted-foreground">⋮⋮</span>}
              <span className={`text-xl ${editMode ? 'animate-pulse' : ''}`}>{getEmoji(parent)}</span>
              <span className="text-[12px] font-medium text-muted-foreground">{parent.name}</span>
            </button>
          ))}
        </div>

        <div className="flex gap-3 mt-8 pb-10">
          {editMode ? (
            <button
              onClick={async () => {
                await persistOrder(orderedParentIds)
                setEditMode(false)
                activeDragIdRef.current = null
                setDraggingId(null)
                setDragPosition(null)
              }}
              className="flex-1 py-3.5 rounded-[22px] bg-accent-blue text-white text-[16px] font-semibold"
            >
              편집 완료
            </button>
          ) : addingRoot ? (
            <div className="flex flex-col gap-2 flex-1">
              <input
                type="text"
                placeholder="카테고리명"
                value={newRootName}
                onChange={(e) => setNewRootName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddRoot()}
                autoFocus
                style={{ fontSize: '16px' }}
                className="w-full bg-card border border-border rounded-[22px] px-4 py-3"
              />
              <div className="flex gap-2">
                <button onClick={handleAddRoot} className="flex-1 py-3.5 bg-surface text-muted-foreground rounded-[22px] text-[16px] font-medium">추가하기</button>
                <button onClick={() => { setAddingRoot(false); setNewRootName('') }} className="flex-1 py-3.5 bg-surface text-muted-foreground rounded-[22px] text-[16px] font-medium">취소하기</button>
              </div>
            </div>
          ) : (
            <div className="flex gap-3 flex-1">
              <button
                onClick={() => setAddingRoot(true)}
                className="flex-1 py-3.5 rounded-[22px] bg-surface text-[16px] font-medium text-muted-foreground"
              >
                카테고리 추가하기
              </button>
              <button
                onClick={() => {
                  setEditMode(true)
                  setAddingRoot(false)
                }}
                className="flex-1 py-3.5 rounded-[22px] bg-surface text-[16px] font-medium text-muted-foreground"
              >
                편집
              </button>
            </div>
          )}
        </div>
      </div>

      {draggingId && dragPosition && (() => {
        const active = orderedParents.find(parent => parent.id === draggingId) || parents.find(parent => parent.id === draggingId)
        return active ? (
          <div
            className="fixed pointer-events-none z-[90] -translate-x-1/2 -translate-y-1/2"
            style={{ left: dragPosition.x, top: dragPosition.y }}
          >
            <div className="flex flex-col items-center gap-1 py-3 px-4 rounded-[22px] bg-surface shadow-[0_12px_28px_rgba(0,0,0,0.18)] ring-1 ring-border opacity-95">
              <span className="text-xl">{getEmoji(active)}</span>
              <span className="text-[12px] font-medium text-muted-foreground">{active.name}</span>
            </div>
          </div>
        ) : null
      })()}

      {deleteConfirm && (
        <>
          <div className="fixed inset-0 bg-black/50 z-[70]" onClick={() => setDeleteConfirm(null)} />
          <div className="fixed inset-0 z-[80] flex items-center justify-center px-8">
            <div className="bg-card rounded-[22px] px-6 py-5 w-full max-w-sm">
              <p className="text-sm font-semibold mb-2">{deleteConfirm.name} 카테고리를 정말 삭제하시겠습니까?</p>
              <p className="text-xs text-muted-foreground mb-4">삭제하면 해당 카테고리의 내역이 미분류로 변경됩니다.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 py-3.5 rounded-[22px] bg-surface text-sm font-medium text-muted-foreground"
                >
                  취소하기
                </button>
                <button
                  onClick={() => {
                    const isParent = deleteConfirm?.type === 'parent'
                    confirmDelete()
                    if (isParent) setEditingParent(null)
                  }}
                  className="flex-1 py-3.5 rounded-[22px] bg-accent-coral/10 text-accent-coral text-[16px] font-semibold"
                >
                  삭제하기
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
