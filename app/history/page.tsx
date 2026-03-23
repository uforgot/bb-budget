'use client'

import { useState } from 'react'
import { BottomNav } from '@/components/bottom-nav'
import { TopHeader } from '@/components/top-header'
import { AddTransactionFab } from '@/components/add-transaction-fab'

type TabType = '지출' | '수입'

interface Transaction {
  date: string
  category: string
  amount: number
}

const dummyExpenses: Transaction[] = [
  { date: '3/1', category: '식비', amount: 0 },
  { date: '3/2', category: '배달', amount: 0 },
  { date: '3/3', category: '마트', amount: 0 },
  { date: '3/5', category: '외식', amount: 0 },
  { date: '3/7', category: '생활용품', amount: 0 },
  { date: '3/8', category: '여가', amount: 0 },
  { date: '3/10', category: '대출', amount: 0 },
  { date: '3/10', category: '보험', amount: 0 },
  { date: '3/12', category: '구독', amount: 0 },
  { date: '3/14', category: '건강', amount: 0 },
]

const dummyIncome: Transaction[] = [
  { date: '3/6', category: '부수입', amount: 0 },
  { date: '3/10', category: '월급', amount: 0 },
  { date: '3/11', category: '부수입', amount: 0 },
]

export default function History() {
  const [activeTab, setActiveTab] = useState<TabType>('지출')
  const transactions = activeTab === '지출' ? dummyExpenses : dummyIncome

  return (
    <div className="min-h-dvh bg-background pb-20">
      <div className="max-w-md mx-auto px-4">
        <TopHeader title="내역" />

        {/* Tabs */}
        <div className="flex border-b border-border mb-4">
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
              {tab === '지출' ? '⊖ ' : '⊕ '}
              {tab}
            </button>
          ))}
        </div>

        {/* Table header */}
        <div className="grid grid-cols-[60px_1fr_100px] px-2 pb-2 border-b border-border">
          <span className="text-[11px] text-muted-foreground">일자</span>
          <span className="text-[11px] text-muted-foreground">카테고리</span>
          <span className="text-[11px] text-muted-foreground text-right">금액</span>
        </div>

        {/* Table rows */}
        <div>
          {transactions.map((tx, i) => (
            <div
              key={i}
              className="grid grid-cols-[60px_1fr_100px] px-2 py-3 border-b border-border/50"
            >
              <span className="text-sm tabular-nums text-muted-foreground">{tx.date}</span>
              <span className="text-sm">{tx.category}</span>
              <span className={`text-sm tabular-nums text-right ${
                activeTab === '지출' ? 'text-red-400' : 'text-blue-400'
              }`}>
                ₩{tx.amount.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>

      <AddTransactionFab />
      <BottomNav />
    </div>
  )
}
