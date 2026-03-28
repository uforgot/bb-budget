'use client'

import { useRef, useState } from 'react'

interface PullToRefreshProps {
  onRefresh: () => Promise<void>
  children: React.ReactNode
  className?: string
}

export function PullToRefresh({ onRefresh, children, className = '' }: PullToRefreshProps) {
  const pullStartY = useRef(0)
  const [pullDistance, setPullDistance] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const THRESHOLD = 80

  const onTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0) pullStartY.current = e.touches[0].clientY
  }

  const onTouchMove = (e: React.TouchEvent) => {
    if (pullStartY.current === 0 || refreshing) return
    const diff = e.touches[0].clientY - pullStartY.current
    if (diff > 0 && window.scrollY === 0) {
      setPullDistance(Math.min(diff * 0.4, 120))
    }
  }

  const onTouchEnd = async () => {
    if (pullDistance >= THRESHOLD && !refreshing) {
      setRefreshing(true)
      setPullDistance(THRESHOLD)
      await onRefresh()
      setTimeout(() => {
        setRefreshing(false)
        setPullDistance(0)
      }, 500)
    } else {
      setPullDistance(0)
    }
    pullStartY.current = 0
  }

  const rotation = Math.min((pullDistance / THRESHOLD) * 360, 360)

  return (
    <div
      className={className}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {pullDistance > 0 && (
        <div
          className="flex items-center justify-center overflow-hidden transition-all"
          style={{ height: pullDistance }}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`text-muted-foreground ${refreshing ? 'animate-spin' : ''}`}
            style={!refreshing ? { transform: `rotate(${rotation}deg)` } : {}}
          >
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
        </div>
      )}
      {children}
    </div>
  )
}
