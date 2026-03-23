'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const DEFAULT_CATEGORIES = ['식비', '교통', '쇼핑', '주거', '의료']

export default function CategoriesSettings() {
  const router = useRouter()
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES)
  const [editingIdx, setEditingIdx] = useState<number | null>(null)
  const [editValue, setEditValue] = useState('')
  const [adding, setAdding] = useState(false)
  const [newCat, setNewCat] = useState('')

  const handleEdit = (idx: number) => {
    setEditingIdx(idx)
    setEditValue(categories[idx])
  }

  const handleSaveEdit = () => {
    if (editingIdx === null) return
    const trimmed = editValue.trim()
    if (trimmed && !categories.some((c, i) => c === trimmed && i !== editingIdx)) {
      const updated = [...categories]
      updated[editingIdx] = trimmed
      setCategories(updated)
    }
    setEditingIdx(null)
    setEditValue('')
  }

  const handleDelete = (idx: number) => {
    setCategories(categories.filter((_, i) => i !== idx))
  }

  const handleAdd = () => {
    const trimmed = newCat.trim()
    if (trimmed && !categories.includes(trimmed)) {
      setCategories([...categories, trimmed])
      setNewCat('')
      setAdding(false)
    }
  }

  return (
    <div className="min-h-dvh bg-background">
      {/* 헤더 */}
      <header className="flex items-center justify-between px-4 pt-[env(safe-area-inset-top,0px)] h-14 border-b border-border">
        <button
          onClick={() => router.back()}
          className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-muted-foreground"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
        <h1 className="text-[17px] font-semibold">카테고리 관리</h1>
        <div className="w-8" />
      </header>

      <div className="max-w-lg mx-auto px-4">

        {/* Category list */}
        <div className="mt-4 bg-card border border-border rounded-xl overflow-hidden">
          {categories.map((cat, idx) => (
            <div key={idx} className="flex items-center justify-between px-4 py-3 border-b border-border/50 last:border-b-0">
              {editingIdx === idx ? (
                <div className="flex items-center gap-2 flex-1">
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
                    autoFocus
                    className="flex-1 bg-background border border-border rounded-lg px-3 py-1.5 text-sm"
                  />
                  <button
                    onClick={handleSaveEdit}
                    className="text-sm text-blue-400 font-medium flex-shrink-0"
                  >
                    저장
                  </button>
                  <button
                    onClick={() => { setEditingIdx(null); setEditValue('') }}
                    className="text-sm text-muted-foreground flex-shrink-0"
                  >
                    취소
                  </button>
                </div>
              ) : (
                <>
                  <span className="text-sm">{cat}</span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleEdit(idx)}
                      className="text-xs text-blue-400"
                    >
                      수정
                    </button>
                    <button
                      onClick={() => handleDelete(idx)}
                      className="text-xs text-red-400"
                    >
                      삭제
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        {/* Add category */}
        <div className="mt-4">
          {adding ? (
            <div className="bg-card border border-border rounded-xl p-4">
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
                <button
                  onClick={() => { setAdding(false); setNewCat('') }}
                  className="text-sm text-muted-foreground flex-shrink-0"
                >
                  취소
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setAdding(true)}
              className="w-full bg-card border border-border rounded-xl px-4 py-3 flex items-center gap-3 text-sm text-muted-foreground"
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
