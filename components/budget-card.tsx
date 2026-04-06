'use client'

interface BudgetCardProps {
  budget: number
  spent: number
  daysLeft: number
  onOpenSettings: () => void
}

function formatCurrency(n: number) {
  const abs = Math.abs(n).toLocaleString()
  return n < 0 ? `-₩${abs}` : `₩${abs}`
}

export function BudgetCard({ budget, spent, daysLeft, onOpenSettings }: BudgetCardProps) {
  const remaining = budget - spent
  const percent = budget > 0 ? Math.min(Math.max(Math.round((spent / budget) * 100), 0), 100) : 0
  const safeDaysLeft = Math.max(daysLeft, 1)
  const dailyBudget = remaining > 0 ? Math.floor(remaining / safeDaysLeft) : 0
  const hasBudget = budget > 0

  return (
    <div className="bg-surface rounded-[22px] px-5 pt-5 pb-4 mb-3 min-h-[190px] flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between gap-3 mb-2">
          <p className="text-[13px] font-semibold text-white/80 mb-0.5">이번 달 예산</p>
          <button
            onClick={onOpenSettings}
            className="text-[13px] font-semibold text-accent-blue"
          >
            설정
          </button>
        </div>

        <p className={`text-[24px] font-bold tabular-nums leading-tight ${hasBudget ? 'text-white' : 'text-muted-foreground'}`} style={{ letterSpacing: '-1px' }}>
          {hasBudget ? formatCurrency(remaining) : '₩0'}
        </p>

        <p className="text-[13px] font-semibold text-white/70 leading-tight mt-2">
          {hasBudget
            ? remaining > 0
              ? `앞으로 하루에 ${formatCurrency(dailyBudget)}씩 쓰면 목표를 지킬 수 있어요`
              : '이번 달 예산을 초과했어요'
            : '한 달 예산 설정하고 남은 금액을 확인하세요'}
        </p>
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
          onClick={onOpenSettings}
          className="w-full mt-4 py-3.5 rounded-[22px] bg-white/10 text-[16px] font-semibold text-white"
        >
          이번 달 예산 설정하기
        </button>
      )}
    </div>
  )
}

interface BudgetSettingsSheetProps {
  open: boolean
  value: string
  onChange: (value: string) => void
  onClose: () => void
  onSave: () => void
}

export function BudgetSettingsSheet({ open, value, onChange, onClose, onSave }: BudgetSettingsSheetProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative w-full max-w-md bg-card rounded-t-2xl overflow-hidden flex flex-col" style={{ maxHeight: '75dvh' }}>
        <div className="flex items-center justify-between px-4 pt-5 pb-3 flex-shrink-0">
          <h3 className="text-base font-semibold">이번 달 예산 설정</h3>
          <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground" aria-label="닫기">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18" /><path d="m6 6 12 12" />
            </svg>
          </button>
        </div>

        <div className="px-4" style={{ paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 0px))' }}>
          <div className="mb-3 bg-surface rounded-[22px] overflow-visible">
            <div className="flex items-center justify-between px-4 py-4 border-b border-border">
              <span className="text-[15px] text-muted-foreground">예산 금액</span>
              <div className="flex items-baseline gap-1">
                <span className="text-[15px] text-muted-foreground">₩</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={value ? parseInt(value, 10).toLocaleString() : ''}
                  onChange={(e) => onChange(e.target.value.replace(/[^0-9]/g, ''))}
                  className="text-[15px] font-semibold tabular-nums bg-transparent border-none outline-none text-right w-36"
                  style={{ fontSize: '16px' }}
                  placeholder="0"
                />
              </div>
            </div>
            <div className="px-4 py-3 text-[13px] text-muted-foreground leading-snug">
              이번 달 지출 한도를 입력하면 남은 예산과 하루 권장 사용액을 계산해드려요.
            </div>
          </div>

          <div className="flex gap-3 mb-2">
            <button onClick={onSave} className="flex-1 bg-primary text-primary-foreground rounded-[22px] py-3.5 text-[16px] font-semibold">
              저장하기
            </button>
            <button onClick={onClose} className="flex-1 bg-surface text-muted-foreground rounded-[22px] py-3.5 text-[16px] font-semibold">
              취소하기
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
