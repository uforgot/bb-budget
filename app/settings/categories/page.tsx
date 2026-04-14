'use client'

import { useState, useEffect, useRef } from 'react'
import { SquarePen } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { getCategories, addCategory, reorderParentCategories, type Category } from '@/lib/api'
import { createClient } from '@/lib/supabase'
import { AddRootCategoryRow, CategoryGrid, CategorySettingsHeader, DragGhost } from '@/components/category-settings-sections'
import { CategoryChildrenEditor, CategoryEditSubmitBar, CategoryEmojiCard, CategoryNameRow } from '@/components/category-edit-sections'
import { createDraftChild, removeDraftChild, renameDraftChild, resetCategoryEditDraft, splitDraftChildren } from '@/lib/categories'

type TypeTab = 'expense' | 'income' | 'savings'
type CategoryWithIcon = Category & { icon?: string | null }
const EMOJI_MAP: Record<string, string> = {
  '식비': '🍽️', '생활': '🏠', '주거': '🏢', '교통': '🚗', '쇼핑': '🛍️',
  '건강': '💊', '여가': '🎬', '자녀': '👶', '반려동물': '🐾', '경조사': '💐',
  '보험': '🛡️', '세금': '📋', '월급': '💰', '상여금': '🎁', '부수입': '💵',
  '예적금': '🏦', '투자': '📈',
}

function getEmoji(cat: CategoryWithIcon) {
  return cat.icon || EMOJI_MAP[cat.name] || '📁'
}

export default function CategoriesSettings() {
  const router = useRouter()
  const [type, setType] = useState<TypeTab>('expense')
  const [categories, setCategories] = useState<Category[]>([])
  const [editMode, setEditMode] = useState(false)
  const [editingParent, setEditingParent] = useState<Category | null>(null)
  const [editName, setEditName] = useState('')
  const [draftChildren, setDraftChildren] = useState<Category[]>([])
  const [newSubCat, setNewSubCat] = useState('')
  const [addingSubCat, setAddingSubCat] = useState(false)
  const [editingChildId, setEditingChildId] = useState<string | null>(null)
  const [editingChildName, setEditingChildName] = useState('')
  const [addingRoot, setAddingRoot] = useState(false)
  const [newRootName, setNewRootName] = useState('')
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [orderedParentIds, setOrderedParentIds] = useState<string[]>([])
  const [dragPosition, setDragPosition] = useState<{ x: number; y: number } | null>(null)

  const dragTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const suppressClickRef = useRef(false)
  const activeDragIdRef = useRef<string | null>(null)
  const pendingDragIdRef = useRef<string | null>(null)
  const touchStartRef = useRef<{ x: number; y: number; id: string } | null>(null)

  const supabase = createClient() as any

  const loadCategories = async () => {
    const [expenseCats, incomeCats, savingsCats] = await Promise.all([
      getCategories('expense'),
      getCategories('income'),
      getCategories('savings'),
    ])
    setCategories([...expenseCats, ...incomeCats, ...savingsCats])
  }

  useEffect(() => {
    loadCategories()
    setEditingParent(null)
    setEditMode(false)
  }, [])

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
    if (!editMode) return
    const touch = event.touches[0]
    if (!touch) return

    if (!activeDragIdRef.current) {
      const start = touchStartRef.current
      if (!start || !pendingDragIdRef.current) return
      const moved = Math.abs(touch.clientX - start.x) > 8 || Math.abs(touch.clientY - start.y) > 8
      if (moved) {
        clearDragTimer()
        pendingDragIdRef.current = null
        touchStartRef.current = null
      }
      return
    }

    setDragPosition({ x: touch.clientX, y: touch.clientY })
    const element = document.elementFromPoint(touch.clientX, touch.clientY)?.closest('[data-category-id]') as HTMLElement | null
    const overId = element?.dataset.categoryId
    if (!overId) return
    handleMoveOver(overId)
  }

  const finishDrag = async () => {
    clearDragTimer()
    pendingDragIdRef.current = null
    touchStartRef.current = null
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
    pendingDragIdRef.current = null
    activeDragIdRef.current = null
    touchStartRef.current = null
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

  const confirmDelete = async (target: { id: string; name: string; type: 'parent' | 'child' }) => {
    if (!confirm("카테고리를 삭제하면 적용된 항목이 '미분류'로 변경돼요. 계속할까요?")) return false
    if (target.type === 'parent') await handleDeleteParent(target.id)
    else await handleDeleteChild(target.id)
    setDeleteConfirm(null)
    return true
  }

  const [savingSub, setSavingSub] = useState(false)
  const handleAddSubCat = async () => {
    if (!editingParent || !newSubCat.trim() || savingSub) return
    setDraftChildren(prev => [...prev, createDraftChild(newSubCat, type, editingParent.id, prev.length + 1)])
    setNewSubCat('')
    setAddingSubCat(false)
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
    const children = draftChildren
    return (
      <div className="min-h-dvh bg-background">
        <CategorySettingsHeader
          title="카테고리 편집"
          onBack={() => {
            const reset = resetCategoryEditDraft()
            setEditingParent(null)
            setAddingSubCat(reset.addingSubCat)
            setNewSubCat(reset.newSubCat)
            setEditName(reset.editName)
            setDraftChildren(reset.draftChildren)
            setEditingChildId(null)
            setEditingChildName('')
            loadCategories()
          }}
          right={
            <button
              onClick={async () => {
                const deleted = await confirmDelete({ id: editingParent.id, name: editingParent.name, type: 'parent' })
                if (deleted) setEditingParent(null)
              }}
              className="flex items-center justify-center w-8 h-8 rounded-full bg-accent-coral/10 text-accent-coral z-10"
              aria-label="삭제"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" />
              </svg>
            </button>
          }
        />

        <div className="max-w-lg mx-auto px-5 pt-6 pb-32">
          <CategoryEmojiCard
            emoji={getEmoji(editingParent)}
            emojiPickerOpen={emojiPickerOpen}
            onOpen={() => setEmojiPickerOpen(true)}
            onSelect={async (emoji) => {
              setEditingParent({ ...editingParent, icon: emoji } as CategoryWithIcon)
            }}
            onClose={() => setEmojiPickerOpen(false)}
          />

          <div className="rounded-[22px] bg-surface border border-border/50 overflow-hidden">
            <CategoryNameRow value={editName} onChange={setEditName} />

            <CategoryChildrenEditor
              children={children}
              addingSubCat={addingSubCat}
              newSubCat={newSubCat}
              editingChildId={editingChildId}
              editingChildName={editingChildName}
              onChangeNewSubCat={setNewSubCat}
              onChangeEditingChildName={setEditingChildName}
              onSubmit={handleAddSubCat}
              onStartAdd={() => setAddingSubCat(true)}
              onStartEdit={(child) => {
                setEditingChildId(child.id)
                setEditingChildName(child.name)
              }}
              onCancelEdit={() => {
                setEditingChildId(null)
                setEditingChildName('')
              }}
              onSaveEdit={() => {
                if (!editingChildId || !editingChildName.trim()) return
                setDraftChildren(prev => renameDraftChild(prev, editingChildId, editingChildName.trim()))
                setEditingChildId(null)
                setEditingChildName('')
              }}
              onRemove={(child) => {
                setDraftChildren(prev => removeDraftChild(prev, child.id))
                if (editingChildId === child.id) {
                  setEditingChildId(null)
                  setEditingChildName('')
                }
              }}
            />
          </div>

          <CategoryEditSubmitBar
            onSubmit={async () => {
              if (!editingParent) return

              const nextName = editName.trim() || editingParent.name
              await supabase.from('categories').update({
                name: nextName,
                icon: (editingParent as CategoryWithIcon).icon || null,
              }).eq('id', editingParent.id)

              const currentChildren = childrenOf(editingParent.id)
              const { persistedIds, newDrafts } = splitDraftChildren(draftChildren)

              for (const child of currentChildren) {
                if (!persistedIds.has(child.id)) {
                  await handleDeleteChild(child.id)
                }
              }

              for (const child of newDrafts) {
                await supabase.from('categories').insert({
                  name: child.name,
                  type,
                  parent_id: editingParent.id,
                  sort_order: currentChildren.length + 1,
                })
              }

              const reset = resetCategoryEditDraft()
              setEditingParent(null)
              setAddingSubCat(reset.addingSubCat)
              setNewSubCat(reset.newSubCat)
              setEditName(reset.editName)
              setDraftChildren(reset.draftChildren)
              setEditingChildId(null)
              setEditingChildName('')
              loadCategories()
            }}
          />
        </div>

      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-background">
      <CategorySettingsHeader
        title="카테고리 관리"
        onBack={() => router.back()}
        right={
          <button
            onClick={() => {
              setAddingRoot(prev => !prev)
              setEditMode(false)
              pendingDragIdRef.current = null
              activeDragIdRef.current = null
              touchStartRef.current = null
              if (addingRoot) setNewRootName('')
            }}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-muted-foreground z-10"
            aria-label="카테고리 추가"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14" />
              <path d="M5 12h14" />
            </svg>
          </button>
        }
      />

      <div className="max-w-lg mx-auto px-5 pt-6">
        <div className="flex items-center justify-end gap-3 mb-4">
          <button
            onClick={() => {
              setEditMode(prev => !prev)
              setAddingRoot(false)
              setNewRootName('')
              pendingDragIdRef.current = null
              activeDragIdRef.current = null
              touchStartRef.current = null
              setDraggingId(null)
              setDragPosition(null)
            }}
            className={`flex items-center justify-center w-9 h-9 rounded-full transition-colors ${editMode ? 'bg-accent-blue text-white' : 'bg-muted text-muted-foreground'}`}
            aria-label="편집 모드"
          >
            <SquarePen size={18} strokeWidth={2} />
          </button>
        </div>

        {addingRoot && (
          <AddRootCategoryRow
            value={newRootName}
            onChange={setNewRootName}
            onSubmit={handleAddRoot}
            onCancel={() => { setAddingRoot(false); setNewRootName('') }}
          />
        )}

        {(['expense', 'income', 'savings'] as TypeTab[]).map(sectionType => {
          const sectionParents = orderedParents.filter(parent => parent.type === sectionType)
          if (sectionParents.length === 0) return null
          return (
            <div key={sectionType} className="mb-6 last:mb-0">
              <h2 className="text-[14px] font-medium text-muted-foreground uppercase mb-3">
                {sectionType === 'expense' ? '지출' : sectionType === 'income' ? '수입' : '저축'}
              </h2>
              <CategoryGrid
                parents={sectionParents}
                editMode={editMode}
                draggingId={draggingId}
                suppressClick={suppressClickRef.current}
                getEmoji={getEmoji}
                onSelect={(parent) => {
                  setType(parent.type as TypeTab)
                  setEditingParent(parent)
                  setEditName(parent.name)
                  setDraftChildren(childrenOf(parent.id))
                  setAddingSubCat(false)
                  setNewSubCat('')
                }}
                onTouchStart={(parent, event) => {
                  if (!editMode) return
                  clearDragTimer()
                  const touch = event.touches[0]
                  if (!touch) return
                  pendingDragIdRef.current = parent.id
                  touchStartRef.current = { x: touch.clientX, y: touch.clientY, id: parent.id }
                  dragTimerRef.current = setTimeout(() => {
                    if (pendingDragIdRef.current !== parent.id || !touchStartRef.current) return
                    activeDragIdRef.current = parent.id
                    setDraggingId(parent.id)
                    setDragPosition({ x: touchStartRef.current.x, y: touchStartRef.current.y })
                  }, 350)
                }}
                onTouchMove={handleTouchMove}
                onTouchEnd={() => {
                  if (!editMode) return
                  if (!activeDragIdRef.current) {
                    clearDragTimer()
                    pendingDragIdRef.current = null
                    touchStartRef.current = null
                    return
                  }
                  finishDrag()
                }}
                onTouchCancel={cancelDrag}
              />
            </div>
          )
        })}

        {editMode && (
          <div className="flex mt-8 pb-10">
            <button
              onClick={async () => {
                await persistOrder(orderedParentIds)
                setEditMode(false)
                activeDragIdRef.current = null
                pendingDragIdRef.current = null
                touchStartRef.current = null
                setDraggingId(null)
                setDragPosition(null)
              }}
              className="flex-1 py-3.5 rounded-[22px] bg-accent-blue text-white text-[16px] font-semibold"
            >
              완료
            </button>
          </div>
        )}
      </div>

      <DragGhost
        active={orderedParents.find(parent => parent.id === draggingId) || parents.find(parent => parent.id === draggingId) || null}
        dragPosition={dragPosition}
        getEmoji={getEmoji}
      />

      {deleteConfirm && null}
    </div>
  )
}
