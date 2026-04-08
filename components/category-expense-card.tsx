'use client'

import {
  Utensils, ShoppingCart, Car, Home, HeartPulse, Film, Shirt,
  Baby, Dog, Gift, Shield, CreditCard, Laptop, Wallet, Coffee, Train, Plane,
  Dumbbell, Building, Zap, Tag, HandCoins, Package, Banknote,
  CircleDollarSign, BookOpen, UtensilsCrossed, type LucideIcon
} from 'lucide-react'

const CAT_ICON_MAP: Record<string, LucideIcon> = {
  '식비': Utensils,
  '외식': UtensilsCrossed,
  '카페': Coffee,
  '마트': ShoppingCart,
  '생활': ShoppingCart,
  '쇼핑': ShoppingCart,
  '의류': Shirt,
  '교통': Car,
  '대중교통': Train,
  '항공': Plane,
  '주거': Home,
  '건강': HeartPulse,
  '의료': HeartPulse,
  '운동': Dumbbell,
  '여가': Film,
  '문화': Film,
  '자녀': Baby,
  '반려동물': Dog,
  '경조사': Gift,
  '보험': Shield,
  '세금': Building,
  '재산': Building,
  '공과금': Zap,
  '월급': Banknote,
  '급여': Banknote,
  '수입': Banknote,
  '부수입': HandCoins,
  '수당': HandCoins,
  '중고': Tag,
  '판매': Tag,
  '용돈': CircleDollarSign,
  '저축': CreditCard,
  '예적금': CreditCard,
  '대출': CreditCard,
  '금융': CircleDollarSign,
  '가전': Laptop,
  '교육': BookOpen,
  '기타': Package,
  '관리비': Building,
  '이체': Banknote,
}

function getCatIcon(name: string): LucideIcon {
  for (const [key, icon] of Object.entries(CAT_ICON_MAP)) {
    if (name.includes(key)) return icon
  }
  return Wallet
}

function fmt(n: number) {
  return n.toLocaleString()
}

function fmtPct(n: number) {
  if (n >= 10) return `${Math.round(n)}%`
  if (n >= 1) return `${n.toFixed(1)}%`
  return '1% 미만'
}

interface CategoryExpenseItem {
  name: string
  amount: number
  prevAmount: number
}

export function CategoryExpenseCard({ items }: { items: CategoryExpenseItem[] }) {
  const total = items.reduce((sum, item) => sum + item.amount, 0)

  return (
    <div className="bg-surface rounded-[22px] px-5 pt-4 pb-4 mb-3">
      <p className="text-[14px] font-bold mb-3">카테고리별 지출</p>
      {items.length === 0 ? (
        <p className="text-[12px] text-muted-foreground text-center py-4">이번 달 지출 내역이 없어요</p>
      ) : (
        <div className="flex flex-col gap-4">
          {items.map((item) => {
            const Icon = getCatIcon(item.name)
            const diff = item.amount - item.prevAmount
            const diffText = item.prevAmount > 0
              ? `지난달 대비 ${diff >= 0 ? '+' : '-'}₩${fmt(Math.abs(diff))}`
              : '전월 없음'
            const pct = total > 0 ? (item.amount / total) * 100 : 0

            return (
              <div key={item.name} className="flex flex-col gap-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex items-start gap-2.5">
                    <span className="mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#5865F220' }}>
                      <Icon size={14} color="#5865F2" strokeWidth={2.5} />
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-[14px] font-medium text-foreground leading-tight">{item.name}</p>
                        <span className="text-[12px] text-muted-foreground">{fmtPct(pct)}</span>
                      </div>
                      <p className="mt-1 text-[12px] text-muted-foreground leading-tight">
                        지난달 ₩{fmt(item.prevAmount)} · {diffText}
                      </p>
                    </div>
                  </div>
                  <span className="flex-shrink-0 text-[14px] font-semibold tabular-nums text-foreground">
                    ₩{fmt(item.amount)}
                  </span>
                </div>
                <div className="h-[6px] rounded-full bg-muted overflow-hidden ml-[38px]">
                  <div className="h-full rounded-full bg-[#5865F2]" style={{ width: `${Math.max(pct, item.amount > 0 ? 4 : 0)}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
