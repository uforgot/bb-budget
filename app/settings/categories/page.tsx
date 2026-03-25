'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getCategories, addCategory, type Category } from '@/lib/api'
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
  const childrenOf = (parentId: string) =>
    categories.filter(c => c.parent_id === parentId).sort((a, b) => a.sort_order - b.sort_order)

  const handleDeleteParent = async (id: string) => {
    const children = childrenOf(id)
    // 자식 + 부모의 연관 transaction category_id null 처리
    for (const child of children) {
      await supabase.from('transactions').update({ category_id: null }).eq('category_id', child.id)
    }
    await supabase.from('transactions').update({ category_id: null }).eq('category_id', id)
    await supabase.from('categories').delete().eq('parent_id', id)
    await supabase.from('categories').delete().eq('id', id)
    loadCategories()
  }

  const handleDeleteChild = async (id: string) => {
    // 연관 transaction category_id를 null로
    await supabase.from('transactions').update({ category_id: null }).eq('category_id', id)
    await supabase.from('categories').delete().eq('id', id)
    loadCategories()
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

  // 편집 상세 페이지
  if (editingParent) {
    const children = childrenOf(editingParent.id)
    return (
      <div className="min-h-dvh bg-background">
        <header className="flex items-center justify-between px-4 pt-[env(safe-area-inset-top,0px)] h-14 border-b border-border">
          <button onClick={() => { setEditingParent(null); loadCategories() }} className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-muted-foreground">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
          <h1 className="text-[17px] font-semibold">카테고리 편집</h1>
          <button onClick={() => { setEditingParent(null); loadCategories() }} className="text-sm text-accent-blue font-medium">완료</button>
        </header>

        <div className="max-w-lg mx-auto px-5 pt-8">
          {/* 이모지 */}
          <div className="flex justify-center mb-8">
            <button
              onClick={() => setEmojiPickerOpen(true)}
              className="w-36 h-36 bg-surface rounded-3xl flex flex-col items-center justify-center border border-border/50 relative"
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

          {/* 카테고리명 */}
          <div className="flex items-center gap-3 py-4 border-b border-border">
            <span className="text-xs text-muted-foreground w-16 flex-shrink-0">카테고리명</span>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={handleRenameSave}
              style={{ fontSize: '16px' }}
              className="flex-1 bg-transparent outline-none"
            />
          </div>

          {/* 소분류 */}
          <div className="flex items-start gap-3 py-4 border-b border-border">
            <span className="text-xs text-muted-foreground w-16 flex-shrink-0 mt-1.5">소분류</span>
            <div className="flex-1">
              <div className="flex flex-wrap gap-2">
                {children.map((child) => (
                  <span key={child.id} className="inline-flex items-center gap-1 bg-muted px-3 py-1.5 rounded-full text-sm">
                    {child.name}
                    <button onClick={() => handleDeleteChild(child.id)} className="text-muted-foreground hover:text-foreground">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" /><path d="m15 9-6 6" /><path d="m9 9 6 6" />
                      </svg>
                    </button>
                  </span>
                ))}

                {/* 추가 */}
                {addingSubCat ? (
                  <span className="inline-flex items-center gap-1">
                    <input
                      type="text"
                      value={newSubCat}
                      onChange={(e) => setNewSubCat(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddSubCat()}
                      autoFocus
                      placeholder="이름"
                      style={{ fontSize: '14px' }}
                      className="bg-muted px-3 py-1.5 rounded-full text-sm w-20 outline-none"
                    />
                    <button onClick={handleAddSubCat} className="text-xs text-accent-blue">확인</button>
                  </span>
                ) : (
                  <button
                    onClick={() => setAddingSubCat(true)}
                    className="inline-flex items-center bg-surface text-muted-foreground px-3 py-1.5 rounded-full text-sm font-medium"
                  >
                    추가
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 삭제 */}
          <div className="mt-10">
            <button
              onClick={async () => {
                await handleDeleteParent(editingParent.id)
                setEditingParent(null)
              }}
              className="w-full py-3 text-accent-coral text-sm font-medium rounded-xl bg-accent-coral/10"
            >
              카테고리 삭제
            </button>
          </div>
        </div>
      </div>
    )
  }

  // 목록 페이지
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

      <div className="max-w-lg mx-auto px-5">
        {/* Segment control */}
        <div className="flex bg-muted rounded-xl p-1 mt-4 mb-6">
          {TYPE_LABELS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setType(key)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                type === key ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* 4-column grid */}
        <div className="grid grid-cols-4 gap-y-5 gap-x-2">
          {parents.map((parent) => {
            const children = childrenOf(parent.id)
            return (
              <button
                key={parent.id}
                onClick={() => {
                  setEditingParent(parent)
                  setEditName(parent.name)
                }}
                className="flex flex-col items-center gap-1.5"
              >
                <span className="text-3xl">{getEmoji(parent)}</span>
                <span className="text-sm font-medium">{parent.name}</span>
                <span className="text-xs text-muted-foreground">소분류 {children.length}개</span>
              </button>
            )
          })}
        </div>

        {/* 하단 버튼 */}
        <div className="flex gap-3 mt-8 pb-10">
          {addingRoot ? (
            <div className="flex items-center gap-2 flex-1">
              <input
                type="text"
                placeholder="카테고리명"
                value={newRootName}
                onChange={(e) => setNewRootName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddRoot()}
                autoFocus
                style={{ fontSize: '16px' }}
                className="flex-1 bg-card border border-border rounded-xl px-4 py-3"
              />
              <button onClick={handleAddRoot} className="px-4 py-3 bg-surface text-muted-foreground rounded-xl text-sm font-medium">추가</button>
              <button onClick={() => { setAddingRoot(false); setNewRootName('') }} className="text-sm text-muted-foreground">취소</button>
            </div>
          ) : (
            <>
              <button
                onClick={() => setAddingRoot(true)}
                className="flex-1 py-3 rounded-xl bg-surface text-sm font-medium text-muted-foreground"
              >
                추가
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
