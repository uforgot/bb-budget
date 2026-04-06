'use client'

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
  const remaining = budget - spent
  const percent = budget > 0 ? Math.min(Math.max(Math.round((spent / budget) * 100), 0), 100) : 0
  const safeDaysLeft = Math.max(daysLeft, 1)
  const dailyBudget = remaining > 0 ? Math.floor(remaining / safeDaysLeft) : 0
  const hasBudget = budget > 0

  return (
    <div className="bg-surface rounded-[22px] px-5 pt-5 pb-4 mb-3 min-h-[190px] flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between gap-3 mb-0.5">
          <p className="text-[13px] font-semibold text-white/80 mb-0.5">이번 달 예산</p>
          {hasBudget && !isEditing && (
            <button
              onClick={onStartEdit}
              className="text-[13px] font-semibold text-accent-blue"
            >
              설정
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 mt-0.5">
          <div className={`flex items-center gap-0 text-[24px] font-bold tabular-nums leading-tight ${hasBudget ? 'text-white' : 'text-muted-foreground'}`} style={{ letterSpacing: '-1px' }}>
            <span>₩</span>
            {isEditing ? (
              <input
                type="text"
                inputMode="numeric"
                value={editValue || ''}
                onChange={(e) => onEditChange(e.target.value.replace(/[^0-9]/g, ''))}
                className="w-[140px] text-[24px] font-bold tabular-nums text-current bg-transparent outline-none"
                placeholder="0"
              />
            ) : (
              <span>{hasBudget ? Math.abs(remaining).toLocaleString() : '0'}</span>
            )}
          </div>

          {!hasBudget && !isEditing && (
            <button onClick={onStartEdit} className="text-white/35" aria-label="예산 수정">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9"/>
                <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4Z"/>
              </svg>
            </button>
          )}
        </div>

        {!isEditing && (
          <p className="text-[13px] font-semibold text-white/70 leading-tight mt-1">
            {hasBudget
              ? remaining > 0
                ? `앞으로 하루에 ${formatCurrency(dailyBudget)}씩 쓰면 목표를 지킬 수 있어요`
                : '이번 달 예산을 초과했어요'
              : '한 달 예산 설정하고 남은 금액을 확인하세요'}
          </p>
        )}

        {isEditing && (
          <div className="flex gap-2 mt-4">
            <button onClick={onSaveEdit} className="flex-1 py-3 rounded-[22px] bg-primary text-primary-foreground text-[15px] font-semibold">저장</button>
            <button onClick={onCancelEdit} className="flex-1 py-3 rounded-[22px] bg-white/10 text-white text-[15px] font-semibold">취소</button>
          </div>
        )}
      </div>

      {hasBudget ? (
        <div>
          <div className="h-[6px] rounded-full overflow-hidden mb-3 bg-white/10">
            <div
              className="h-full rounded-full"
              style={{
                width: `${percent}%`,
                backgroundColor: remaining >= 0 ? '#14F195' : '#5865F2',
              }}
            />
          </div>

          <div className="flex items-start justify-between">
            <div>
              <p className="text-[12px] text-white/70 mb-0.5">지출</p>
              <p className="text-[14px] font-semibold tabular-nums text-white">{formatCurrency(spent)}</p>
            </div>
            <div className="text-right">
              <p className="text-[12px] text-white/70 mb-0.5">총 예산</p>
              <p className="text-[14px] font-semibold tabular-nums text-white">{formatCurrency(budget)}</p>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={onStartEdit}
          className="w-full mt-4 py-3.5 rounded-[22px] bg-white/10 text-[16px] font-semibold text-white"
        >
          이번 달 예산 설정하기
        </button>
      )}
    </div>
  )
}

