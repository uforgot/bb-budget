'use client'

import {
  Utensils, ShoppingCart, Car, Home, HeartPulse, Film, Shirt,
  Baby, Dog, Gift, Shield, Receipt, BanknoteArrowDown, Coins,
  PiggyBank, CreditCard, Laptop, Wallet, Coffee, Train, Plane,
  Dumbbell, Building, Zap, type LucideIcon
} from 'lucide-react'

const CAT_ICON_MAP: Record<string, LucideIcon> = {
  '식비': Utensils,
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
  '세금': Receipt,
  '공과금': Zap,
  '월급': BanknoteArrowDown,
  '급여': BanknoteArrowDown,
  '수입': BanknoteArrowDown,
  '부수입': Coins,
  '저축': PiggyBank,
  '예적금': PiggyBank,
  '대출': CreditCard,
  '금융': CreditCard,
  '가전': Laptop,
  '기타': Wallet,
  '관리비': Building,
}

function getCatIcon(name: string): LucideIcon {
  for (const [key, icon] of Object.entries(CAT_ICON_MAP)) {
    if (name.includes(key)) return icon
  }
  return Wallet
}

function fmt(n: number) {
  if (n >= 100000000) {
    const eok = Math.floor(n / 100000000)
    const man = Math.floor((n % 100000000) / 10000)
    return man > 0
      ? `${eok.toLocaleString()}억 ${man.toLocaleString()}만`
      : `${eok.toLocaleString()}억`
  }
  if (n >= 10000) return `${Math.floor(n / 10000).toLocaleString()}만`
  return n.toLocaleString()
}

interface TopExpenseCardProps {
  year: number
  month: number
  items: { name: string; amount: number }[]
  total: number
  type?: 'expense' | 'income'
}

export function TopExpenseCard({ year, month, items, total, type = 'expense' }: TopExpenseCardProps) {
  const maxAmount = Math.max(...items.map(i => i.amount), 1)

  return (
    <div className="bg-surface rounded-2xl px-5 pt-4 pb-4 mb-3 h-full">
      <p className="text-[16px] font-bold mb-3">{type === 'income' ? '이번 달 수입' : '이번 달 지출'}</p>
      {items.length === 0 ? (
        <p className="text-[12px] text-muted-foreground text-center py-4">지출 내역이 없어요</p>
      ) : (
        <div className="flex flex-col gap-3.5">
          {items.map((item) => {
            const Icon = getCatIcon(item.name)
            return (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#5865F220' }}>
                    <Icon size={12} color="#5865F2" strokeWidth={2.5} />
                  </span>
                  <span className="text-[13px] text-foreground">{item.name}</span>
                </div>
                <span className="text-[13px] font-semibold tabular-nums">
                  ₩{fmt(item.amount)}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
