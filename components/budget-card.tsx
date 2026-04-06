'use client'

import {
  DashboardCard,
  DashboardCardFooter,
  DashboardCardFooterLabel,
  DashboardCardFooterValue,
  DashboardCardHeader,
  DashboardCardTitle,
} from '@/components/dashboard-card'

interface BudgetCardProps {
  budget: number
  spent: number
  daysLeft: number
  isEditing: boolean
  editValue: string
  onEditChange: (value: string) => void
  onStartEdit: () => void
  onCancelEdit: () => void
  onSaveEdit: () => void
}

function formatCurrency(n: number) {
  const abs = Math.abs(n).toLocaleString()
  return n < 0 ? `-₩${abs}` : `₩${abs}`
}

function BudgetAmount({
  budget,
  spent,
  isEditing,
  editValue,
  onEditChange,
  onStartEdit,
}: {
  budget: number
  spent: number
  isEditing: boolean
  editValue: string
  onEditChange: (value: string) => void
  onStartEdit: () => void
}) {
  const hasBudget = budget > 0
  const remaining = budget - spent

  return (
    <div className="flex items-center gap-0 text-[24px] font-bold tabular-nums text-white leading-tight mb-6" style={{ letterSpacing: '-1px' }}>
      <span className={(hasBudget || isEditing) ? 'text-white' : 'text-muted-foreground'}>₩</span>
      {isEditing ? (
        <input
          type="text"
          inputMode="numeric"
          value={editValue ? parseInt(editValue, 10).toLocaleString() : ''}
          onChange={(e) => onEditChange(e.target.value.replace(/[^0-9]/g, ''))}
          className="w-[140px] text-[24px] font-bold tabular-nums text-white bg-transparent outline-none"
          placeholder="0"
        />
      ) : (
        <>
          <span className={(hasBudget || isEditing) ? 'text-white' : 'text-muted-foreground'}>
            {hasBudget
              ? remaining >= 0
                ? `${Math.abs(remaining).toLocaleString()} 남음`
                : `${Math.abs(remaining).toLocaleString()} 초과`
              : '0'}
          </span>
          {!hasBudget && (
            <button onClick={onStartEdit} className="text-white flex items-center justify-center self-center" aria-label="예산 수정">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4Z" />
              </svg>
            </button>
          )}
        </>
      )}
    </div>
  )
}

function BudgetHeader({
  budget,
  spent,
  isEditing,
  editValue,
  onEditChange,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
}: {
  budget: number
  spent: number
  isEditing: boolean
  editValue: string
  onEditChange: (value: string) => void
  onStartEdit: () => void
  onCancelEdit: () => void
  onSaveEdit: () => void
}) {
  return (
    <DashboardCardHeader>
      <DashboardCardTitle>한 달 예산</DashboardCardTitle>
      <BudgetAmount
        budget={budget}
        spent={spent}
        isEditing={isEditing}
        editValue={editValue}
        onEditChange={onEditChange}
        onStartEdit={onStartEdit}
      />

      {isEditing && (
        <div className="flex gap-2">
          <button onClick={onSaveEdit} className="flex-1 py-3 rounded-[22px] bg-primary text-primary-foreground text-[15px] font-semibold">저장</button>
          <button onClick={onCancelEdit} className="flex-1 py-3 rounded-[22px] bg-white/10 text-white text-[15px] font-semibold">취소</button>
        </div>
      )}
    </DashboardCardHeader>
  )
}

function BudgetFooter({
  budget,
  spent,
  onStartEdit,
}: {
  budget: number
  spent: number
  onStartEdit: () => void
}) {
  const percent = budget > 0 ? Math.max(Math.round((spent / budget) * 100), 0) : 0

  return (
    <DashboardCardFooter>
      <div className="flex h-[6px] rounded-full overflow-hidden gap-[2px] mb-3 bg-white/10">
        <div className="h-full rounded-full" style={{ width: `${percent}%`, backgroundColor: '#5865F2' }} />
      </div>
      <div className="flex items-start justify-between">
        <div>
          <DashboardCardFooterLabel>지출</DashboardCardFooterLabel>
          <DashboardCardFooterValue className="text-[#5865F2]">{formatCurrency(spent)} ({percent}%)</DashboardCardFooterValue>
        </div>
        <div className="text-right">
          <DashboardCardFooterLabel>총예산</DashboardCardFooterLabel>
          <div className="flex items-center justify-end gap-1.5">
            <DashboardCardFooterValue className="text-white">{formatCurrency(budget)}</DashboardCardFooterValue>
            <button onClick={onStartEdit} className="text-white/70 flex items-center justify-center self-center" aria-label="예산 수정">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4Z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </DashboardCardFooter>
  )
}

export function BudgetCard({
  budget,
  spent,
  daysLeft,
  isEditing,
  editValue,
  onEditChange,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
}: BudgetCardProps) {
  const hasBudget = budget > 0

  return (
    <DashboardCard>
      <BudgetHeader
        budget={budget}
        spent={spent}
        isEditing={isEditing}
        editValue={editValue}
        onEditChange={onEditChange}
        onStartEdit={onStartEdit}
        onCancelEdit={onCancelEdit}
        onSaveEdit={onSaveEdit}
      />

      {hasBudget && !isEditing ? (
        <BudgetFooter budget={budget} spent={spent} onStartEdit={onStartEdit} />
      ) : !hasBudget && !isEditing ? (
        <p className="text-[13px] font-semibold text-white/70 leading-tight">
          한 달 예산 설정하고 남은 금액을 확인하세요
        </p>
      ) : null}
    </DashboardCard>
  )
}
