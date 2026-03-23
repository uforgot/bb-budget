'use client'

import { useRef, useState } from 'react'
import { AddTransactionModal } from './add-transaction-modal'

interface AddTransactionFabProps {
  selectedDate?: string // YYYY-MM-DD
}

export function AddTransactionFab({ selectedDate }: AddTransactionFabProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleOpen = () => {
    setModalOpen(true)
    // Focus synchronously within user gesture chain for iOS keyboard
    requestAnimationFrame(() => {
      inputRef.current?.focus()
    })
  }

  return (
    <>
      <button
        onClick={handleOpen}
        className="fixed bottom-24 right-5 size-10 bg-primary text-primary-foreground rounded-full shadow-lg flex items-center justify-center z-40"
        aria-label="내역 추가"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 5v14" /><path d="M5 12h14" />
        </svg>
      </button>

      <AddTransactionModal
        open={modalOpen}
        initialDate={selectedDate}
        amountInputRef={inputRef}
        onClose={() => setModalOpen(false)}
        onSave={(data) => {
          console.log('저장:', data)
        }}
      />
    </>
  )
}
