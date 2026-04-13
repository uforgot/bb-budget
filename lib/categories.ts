import type { Category } from '@/lib/api'

export function createDraftChild(name: string, type: 'expense' | 'income' | 'savings', parentId: string, sortOrder: number): Category {
  return {
    id: `draft-${Date.now()}`,
    name: name.trim(),
    type,
    sort_order: sortOrder,
    parent_id: parentId,
    created_at: new Date().toISOString(),
    icon: null,
  } as Category
}

export function removeDraftChild(children: Category[], childId: string) {
  return children.filter(item => item.id !== childId)
}

export function renameDraftChild(children: Category[], childId: string, name: string) {
  return children.map(item => item.id === childId ? { ...item, name } : item)
}

export function splitDraftChildren(draftChildren: Category[]) {
  const persistedIds = new Set(draftChildren.filter(child => !child.id.startsWith('draft-')).map(child => child.id))
  const newDrafts = draftChildren.filter(child => child.id.startsWith('draft-'))
  return { persistedIds, newDrafts }
}

export function resetCategoryEditDraft() {
  return {
    addingSubCat: false,
    newSubCat: '',
    editName: '',
    draftChildren: [] as Category[],
  }
}
