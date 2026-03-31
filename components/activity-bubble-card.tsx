'use client'

interface DayActivity {
  day: number
  income: number
  expense: number
}

interface ActivityBubbleCardProps {
  year: number
  month: number
  activities: DayActivity[]
}

export function ActivityBubbleCard({ year, month, activities }: ActivityBubbleCardProps) {
  const daysInMonth = new Date(year, month, 0).getDate()
  const firstDow = new Date(year, month - 1, 1).getDay() // 0=일
  // 월요일 시작 기준
  const startOffset = (firstDow + 6) % 7

  const maxVal = Math.max(...activities.map(a => a.expense + a.income), 1)

  const today = new Date()
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() + 1 === month
  const todayDay = today.getDate()

  const weeks: (number | null)[][] = []
  let week: (number | null)[] = Array(startOffset).fill(null)
  for (let d = 1; d <= daysInMonth; d++) {
    week.push(d)
    if (week.length === 7) {
      weeks.push(week)
      week = []
    }
  }
  if (week.length > 0) {
    while (week.length < 7) week.push(null)
    weeks.push(week)
  }

  const DOW_LABELS = ['월', '화', '수', '목', '금', '토', '일']

  return (
    <div className="bg-surface rounded-2xl px-3 py-4 mb-3">
      <p className="text-xs text-muted-foreground mb-3">{month}월 활동</p>

      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 mb-1">
        {DOW_LABELS.map(d => (
          <div key={d} className="text-center text-[10px] text-muted-foreground">{d}</div>
        ))}
      </div>

      {/* 버블 그리드 */}
      {weeks.map((w, wi) => (
        <div key={wi} className="grid grid-cols-7 mb-1">
          {w.map((day, di) => {
            if (!day) return <div key={di} />
            const act = activities.find(a => a.day === day)
            const val = act ? (act.expense + act.income) : 0
            const hasActivity = val > 0
            const ratio = hasActivity ? val / maxVal : 0
            // 버블 크기: 최소 20px, 최대 셀 크기
            const size = hasActivity ? 14 + Math.round(ratio * 14) : 0
            const isToday = isCurrentMonth && day === todayDay
            const hasExpense = act && act.expense > 0
            const hasIncome = act && act.income > 0 && act.expense === 0

            return (
              <div key={di} className="flex items-center justify-center aspect-square">
                {hasActivity ? (
                  <div
                    className="rounded-full flex items-center justify-center transition-all"
                    style={{
                      width: size,
                      height: size,
                      backgroundColor: hasIncome
                        ? 'rgba(67, 181, 129, 0.5)'
                        : 'rgba(255, 99, 71, 0.45)',
                    }}
                  />
                ) : (
                  <div
                    className={`rounded-full ${isToday ? 'border border-accent-blue' : ''}`}
                    style={{ width: 4, height: 4, backgroundColor: isToday ? 'transparent' : '#374151' }}
                  />
                )}
              </div>
            )
          })}
        </div>
      ))}

      {/* 범례 */}
      <div className="flex gap-3 mt-2">
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'rgba(67,181,129,0.6)' }} />
          <span className="text-[10px] text-muted-foreground">수입</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'rgba(255,99,71,0.6)' }} />
          <span className="text-[10px] text-muted-foreground">지출</span>
        </div>
      </div>
    </div>
  )
}
