'use client'

import { useState } from 'react'

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
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative w-full max-w-md bg-card rounded-t-2xl overflow-hidden flex flex-col" style={{ maxHeight: '60dvh' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 flex-shrink-0">
          <h3 className="text-base font-semibold">이모지 선택</h3>
          <button onClick={onClose} className="p-1 text-muted-foreground">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18" /><path d="m6 6 12 12" />
            </svg>
          </button>
        </div>

        {/* Emoji grid */}
        <div className="overflow-y-auto px-5 pb-24">
          {EMOJI_SECTIONS.map((section) => (
            <div key={section.label} className="mb-4">
              <p className="text-[11px] text-muted-foreground mb-2 font-medium">{section.label}</p>
              <div className="grid grid-cols-8 gap-1">
                {section.emojis.map((emoji, i) => (
                  <button
                    key={i}
                    onClick={() => { onSelect(emoji); onClose() }}
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
