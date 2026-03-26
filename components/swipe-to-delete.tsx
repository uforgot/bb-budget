'use client'

import { useRef, useState } from 'react'

interface SwipeToDeleteProps {
  children: React.ReactNode
  onDelete: () => void
}

export function SwipeToDelete({ children, onDelete }: SwipeToDeleteProps) {
  const startX = useRef<number | null>(null)
  const startY = useRef<number | null>(null)
  const isScrolling = useRef(false)
  const [offset, setOffset] = useState(0)
  const [swiping, setSwiping] = useState(false)
  const DELETE_THRESHOLD = 80

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX
    startY.current = e.touches[0].clientY
    isScrolling.current = false
    setSwiping(false)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startX.current === null || startY.current === null) return
    if (isScrolling.current) return

    const diffX = startX.current - e.touches[0].clientX
    const diffY = Math.abs(e.touches[0].clientY - startY.current)

    // Y축 이동이 X축보다 크면 스크롤로 판단
    if (diffY > Math.abs(diffX) && diffY > 10) {
      isScrolling.current = true
      setOffset(0)
      return
    }

    if (diffX > 10) {
      setSwiping(true)
      setOffset(Math.min(diffX, DELETE_THRESHOLD))
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
      {offset > 0 && (
        <div
          className="absolute right-0 top-0 bottom-0 z-0 flex items-center justify-center bg-accent-coral text-white font-medium text-sm"
          style={{ width: DELETE_THRESHOLD }}
        >
          <button onClick={handleDelete} className="w-full h-full">
            삭제
          </button>
        </div>
      )}

      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="relative z-10"
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
