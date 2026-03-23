'use client'

import { useState } from 'react'
import { BottomNav } from '@/components/bottom-nav'
import { TopHeader } from '@/components/top-header'
import { AddTransactionModal } from '@/components/add-transaction-modal'

type TabType = '지출' | '수입'
type ViewMode = 'monthly' | 'weekly'

interface Transaction {
  date: string
  category: string
  description: string
  amount: number
}

const dummyExpenses: Transaction[] = [
  { date: '2026-03-01', category: '생활용품', description: '레이디가구 침대', amount: 835080 },
  { date: '2026-03-02', category: '식비', description: '파파노다이닝 배달', amount: 26500 },
  { date: '2026-03-05', category: '식비', description: '홍루이젠', amount: 2800 },
  { date: '2026-03-07', category: '여가', description: '마술쇼 공연 예매', amount: 88000 },
  { date: '2026-03-10', category: '대출', description: '원금', amount: 940000 },
  { date: '2026-03-10', category: '대출', description: '이자', amount: 1376748 },
  { date: '2026-03-12', category: '구독', description: 'AI 구독', amount: 140557 },
  { date: '2026-03-14', category: '여가', description: '위시캣 전시', amount: 45000 },
  { date: '2026-03-15', category: '식비', description: '이마트 장', amount: 124070 },
  { date: '2026-03-17', category: '여가', description: '뽀로로 공연', amount: 138000 },
  { date: '2026-03-18', category: '식비', description: '진심장인 배달', amount: 34900 },
  { date: '2026-03-23', category: '식비', description: '참새방앗간 배달', amount: 23000 },
]

const dummyIncome: Transaction[] = [
  { date: '2026-03-06', category: '부수입', description: '용돈(피버)', amount: 30000 },
  { date: '2026-03-10', category: '월급', description: '신형주 월급', amount: 9540370 },
  { date: '2026-03-10', category: '부수입', description: 'AI', amount: 120785 },
]

function getWeekLabel(dateStr: string): string {
  const d = new Date(dateStr)
  const weekNum = Math.ceil(d.getDate() / 7)
  return `${d.getMonth() + 1}월 ${weekNum}주차`
}

function getMonthLabel(dateStr: string): string {
  const d = new Date(dateStr)
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월`
}

function groupBy(items: Transaction[], mode: ViewMode): Record<string, Transaction[]> {
  const groups: Record<string, Transaction[]> = {}
  for (const item of items) {
    const key = mode === 'weekly' ? getWeekLabel(item.date) : getMonthLabel(item.date)
    if (!groups[key]) groups[key] = []
    groups[key].push(item)
  }
  return groups
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

export default function History() {
  const [activeTab, setActiveTab] = useState<TabType>('지출')
  const [viewMode, setViewMode] = useState<ViewMode>('weekly')
  const [modalOpen, setModalOpen] = useState(false)
  const transactions = activeTab === '지출' ? dummyExpenses : dummyIncome
  const grouped = groupBy(transactions, viewMode)

  return (
    <div className="min-h-dvh bg-background pb-20">
      <div className="px-5">
        <TopHeader title="상세 내역" />

        {/* Tabs */}
        <div className="flex border-b border-border">
          {(['지출', '수입'] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 pb-2.5 text-sm font-medium text-center transition-colors ${
                activeTab === tab
                  ? tab === '지출'
                    ? 'text-red-400 border-b-2 border-red-400'
                    : 'text-blue-400 border-b-2 border-blue-400'
                  : 'text-muted-foreground'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* View mode toggle */}
        <div className="flex items-center justify-end py-2">
          <div className="flex bg-muted rounded-lg p-0.5">
            {(['weekly', 'monthly'] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1 text-[11px] rounded-md transition-colors ${
                  viewMode === mode
                    ? 'bg-card text-foreground font-medium shadow-sm'
                    : 'text-muted-foreground'
                }`}
              >
                {mode === 'weekly' ? '주간' : '월간'}
              </button>
            ))}
          </div>
        </div>

        {/* Grouped list */}
        <div className="flex flex-col gap-3">
          {Object.entries(grouped).map(([label, items]) => {
            const groupTotal = items.reduce((sum, t) => sum + t.amount, 0)
            return (
              <div key={label} className="bg-card rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 bg-muted/50">
                  <span className="text-xs font-medium text-muted-foreground">{label}</span>
                  <span className={`text-xs font-medium tabular-nums ${
                    activeTab === '지출' ? 'text-red-400' : 'text-blue-400'
                  }`}>
                    ₩{groupTotal.toLocaleString()}
                  </span>
                </div>
                {items.map((tx, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between px-4 py-3 border-t border-border/50"
                  >
                    <div className="flex flex-col">
                      <span className="text-sm">{tx.description}</span>
                      <span className="text-[11px] text-muted-foreground">{formatDate(tx.date)} · {tx.category}</span>
                    </div>
                    <span className={`text-sm font-medium tabular-nums ${
                      activeTab === '지출' ? 'text-red-400' : 'text-blue-400'
                    }`}>
                      ₩{tx.amount.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      </div>

      <AddTransactionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={(data) => {
          console.log('저장:', data)
        }}
      />

      <BottomNav onAdd={() => setModalOpen(true)} />
    </div>
  )
}
