'use client'

import { useRef, useState } from 'react'

interface SwipeToDeleteProps {
  children: React.ReactNode
  onDelete: () => void
}

export function SwipeToDelete({ children, onDelete }: SwipeToDeleteProps) {
  const startX = useRef<number | null>(null)
  const [offset, setOffset] = useState(0)
  const [swiping, setSwiping] = useState(false)
  const DELETE_THRESHOLD = 80

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX
    setSwiping(false)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startX.current === null) return
    const diff = startX.current - e.touches[0].clientX
    if (diff > 10) {
      setSwiping(true)
      setOffset(Math.min(diff, DELETE_THRESHOLD))
    } else {
      setOffset(0)
    }
  }

  const handleTouchEnd = () => {
    startX.current = null
    if (offset >= DELETE_THRESHOLD) {
      setOffset(DELETE_THRESHOLD)
    } else {
      setOffset(0)
      setSwiping(false)
    }
  }

  const handleDelete = () => {
    setOffset(0)
    setSwiping(false)
    onDelete()
  }

  return (
    <div className="relative overflow-hidden">
      {/* Delete button behind */}
      <div
        className="absolute right-0 top-0 bottom-0 flex items-center justify-center bg-accent-coral text-white font-medium text-sm"
        style={{ width: DELETE_THRESHOLD }}
      >
        <button onClick={handleDelete} className="w-full h-full">
          삭제
        </button>
      </div>

      {/* Content */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="relative bg-card transition-transform"
        style={{
          transform: `translateX(-${offset}px)`,
          transition: swiping ? 'none' : 'transform 0.2s ease',
        }}
      >
        {children}
      </div>
    </div>
  )
}
