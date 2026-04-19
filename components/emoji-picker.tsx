'use client'

import { X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

interface EmojiPickerProps {
  open: boolean
  onSelect: (emoji: string) => void
  onClose: () => void
}

const EMOJI_SECTIONS: { label: string; emojis: string[] }[] = [
  {
    label: '음식',
    emojis: ['🍽️', '🍚', '🍜', '🍕', '🍔', '🍣', '🍱', '🍖', '🥗', '🍰', '☕', '🍺', '🥤', '🧁', '🍩', '🌮', '🥐', '🍗', '🥘', '🍝', '🥩', '🍙', '🥟', '🧇', '🍞', '🥞', '🍮', '🍫', '🍿', '🥂', '🍷', '🧃'],
  },
  {
    label: '생활/주거',
    emojis: ['🏠', '🏢', '🛒', '🧹', '🛋️', '💡', '🚿', '🧺', '🔑', '📦', '🪴', '🛏️', '🧊', '🧴', '🪥', '🧽', '🏗️', '🔨', '🪜', '🧲', '🪣', '💧', '🔌', '🧯', '🪟', '🚪', '🛁', '🪑', '🗑️', '📫', '🏘️', '🧱'],
  },
  {
    label: '교통',
    emojis: ['🚗', '🚌', '🚇', '🚕', '⛽', '🅿️', '🚲', '✈️', '🛫', '🚢', '🏍️', '🚶', '🛴', '🚁', '🛤️', '🚚', '🚃', '🛵', '🚀', '🛻', '⛴️', '🚂', '🛶', '🚠', '🚤', '🛞', '🛣️', '⚓', '🛳️', '🚒', '🚑', '🚜'],
  },
  {
    label: '쇼핑/패션',
    emojis: ['🛍️', '👗', '👟', '💄', '💍', '👜', '🧥', '👓', '⌚', '🎀', '💎', '🧢', '👔', '🩴', '🧤', '🧣', '👠', '👢', '🩱', '👙', '🎒', '💼', '🧳', '🪮', '💅', '👑', '🕶️', '🩲', '🧦', '🧵', '✂️', '🪡'],
  },
  {
    label: '건강/운동',
    emojis: ['💊', '🏥', '💉', '🩹', '🏋️', '🧘', '🏃', '🩺', '🦷', '👁️', '❤️‍🩹', '🧬', '🫁', '🏊', '⚽', '🎾', '🏀', '🏈', '⛳', '🥊', '🏄', '🤸', '🧗', '🚴', '🏇', '🤽', '🏸', '🥋', '🏓', '🤺', '⛷️', '🏌️'],
  },
  {
    label: '여가/문화',
    emojis: ['🎬', '🎭', '🎵', '🎮', '📚', '🎨', '🏖️', '⛺', '🎯', '🎳', '🎪', '📸', '🎤', '🎹', '🧩', '🎲', '🎻', '🎧', '📺', '🎸', '🎷', '🪘', '🎺', '📻', '🎥', '🪄', '🎴', '🎠', '🎡', '🎢', '📖', '🖌️'],
  },
  {
    label: '가족/사람',
    emojis: ['👶', '👨‍👩‍👧', '🐾', '🐶', '🐱', '🎁', '💐', '💒', '🙏', '🎂', '🧸', '🍼', '🎓', '👨‍💻', '👩‍🏫', '🤝', '👨‍👩‍👧‍👦', '🧑‍🍼', '👴', '👵', '🤰', '🧒', '👦', '👧', '🐰', '🐹', '🐠', '🐦', '🐈', '🦜', '🐕', '🦮'],
  },
  {
    label: '금융/업무',
    emojis: ['💰', '💵', '💳', '🏦', '📈', '📉', '🧾', '📋', '🛡️', '🔒', '🪙', '💹', '📊', '🏛️', '⚖️', '💼', '🖥️', '💻', '📱', '⌨️', '🖨️', '📡', '🔧', '📌', '🗂️', '🌐', '🧰', '✏️', '📎', '🔖', '🗃️', '📑'],
  },
  {
    label: '기기/통신',
    emojis: ['📱', '📲', '☎️', '📞', '📟', '📠', '🔋', '🔌', '💻', '🖥️', '🖨️', '⌨️', '🖱️', '💾', '💿', '📀', '🎙️', '📷', '📹', '🔦', '🔭', '🔬', '⏰', '🕹️', '📡', '📺', '📻', '🎚️', '🎛️', '🧭', '🔊', '📢'],
  },
  {
    label: '기타',
    emojis: ['📁', '⭐', '🔥', '💡', '🎯', '🏷️', '🗂️', '✅', '❌', '⚠️', '💬', '🔔', '🏆', '🎖️', '🌈', '☀️', '🌙', '❄️', '🌊', '🍀', '🌸', '🎃', '🎄', '🕊️', '✨', '💫', '🌟', '♻️', '🔗', '🪧', '🏴', '🚩'],
  },
]

export function EmojiPicker({ open, onSelect, onClose }: EmojiPickerProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const dragStartYRef = useRef(0)
  const dragTranslateYRef = useRef(0)
  const draggingSheetRef = useRef(false)
  const [dragTranslateY, setDragTranslateY] = useState(0)
  const [sheetAnimating, setSheetAnimating] = useState(false)
  const [sheetVisible, setSheetVisible] = useState(false)
  const [shouldRender, setShouldRender] = useState(false)

  useEffect(() => {
    if (!open) return
    setShouldRender(true)
    setSheetVisible(true)
    setDragTranslateY(window.innerHeight)
    setSheetAnimating(true)
    const raf = requestAnimationFrame(() => setDragTranslateY(0))
    const t = window.setTimeout(() => setSheetAnimating(false), 220)
    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(t)
    }
  }, [open])

  const handleClose = () => {
    setSheetAnimating(true)
    setDragTranslateY(window.innerHeight)
    window.setTimeout(() => {
      setSheetAnimating(false)
      setSheetVisible(false)
      setShouldRender(false)
      setDragTranslateY(0)
      onClose()
    }, 220)
  }

  const handleSheetTouchStart = (e: React.TouchEvent) => {
    dragStartYRef.current = e.touches[0].clientY
    dragTranslateYRef.current = dragTranslateY
    draggingSheetRef.current = false
  }

  const handleSheetTouchMove = (e: React.TouchEvent) => {
    const diff = e.touches[0].clientY - dragStartYRef.current
    const scrollTop = scrollRef.current?.scrollTop ?? 0
    if (diff <= 0) return
    if (scrollTop > 0) return
    draggingSheetRef.current = true
    const next = Math.max(0, diff + dragTranslateYRef.current)
    setDragTranslateY(next)
  }

  const handleSheetTouchEnd = () => {
    if (!draggingSheetRef.current) return
    draggingSheetRef.current = false
    if (dragTranslateY > 140) {
      handleClose()
      return
    }
    setSheetAnimating(true)
    setDragTranslateY(0)
    window.setTimeout(() => setSheetAnimating(false), 220)
  }

  if (!open && !shouldRender) return null

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center">
      <div className="absolute inset-0 bg-black/50" style={{ visibility: sheetVisible ? 'visible' : 'hidden' }} onClick={handleClose} />

      <div
        className="relative w-full max-w-md bg-card rounded-t-2xl overflow-hidden flex flex-col"
        style={{
          maxHeight: '60dvh',
          transform: `translateY(${dragTranslateY}px)`,
          transition: sheetAnimating ? 'transform 220ms cubic-bezier(0.22, 1, 0.36, 1)' : 'none',
          visibility: sheetVisible ? 'visible' : 'hidden',
        }}
      >
        <div className="flex flex-col px-5 pt-3 pb-3 flex-shrink-0" onTouchStart={handleSheetTouchStart} onTouchMove={handleSheetTouchMove} onTouchEnd={handleSheetTouchEnd}>
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-black/15 dark:bg-white/15" />
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold">이모지 선택</h3>
            <button onClick={handleClose} className="flex items-center justify-center w-11 h-11 rounded-full bg-white dark:bg-gray-800 text-black dark:text-white">
              <X size={20} strokeWidth={2.2} />
            </button>
          </div>
        </div>

        <div ref={scrollRef} className="overflow-y-auto px-5 pb-24">
          {EMOJI_SECTIONS.map((section) => (
            <div key={section.label} className="mb-4">
              <p className="text-[11px] text-muted-foreground mb-2 font-medium">{section.label}</p>
              <div className="grid grid-cols-8 gap-1">
                {section.emojis.map((emoji, i) => (
                  <button
                    key={i}
                    onClick={() => { onSelect(emoji); handleClose() }}
                    className="text-2xl p-1.5 rounded-lg active:bg-muted transition-colors text-center"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
