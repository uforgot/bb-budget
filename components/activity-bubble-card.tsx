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
    <div className="bg-surface rounded-2xl px-3 py-4 mb-3 h-full">
      <p className="text-[11px] text-muted-foreground">{year}년 {month}월</p>
      <p className="text-[16px] font-bold mb-2">활동</p>

      {/* 버블 그리드 */}
      {weeks.map((w, wi) => (
        <div key={wi} className="grid grid-cols-7" style={{ marginBottom: '2px' }}>
          {w.map((day, di) => {
            if (!day) return <div key={di} />
            const act = activities.find(a => a.day === day)
            const val = act ? (act.expense + act.income) : 0
            const hasActivity = val > 0
            const ratio = hasActivity ? val / maxVal : 0
            // 로그 스케일로 위계 강조
            const logRatio = hasActivity ? Math.log1p(ratio * 9) / Math.log1p(9) : 0
            const size = hasActivity ? Math.round(5 + logRatio * 22) : 0
            const opacity = hasActivity ? 0.3 + logRatio * 0.7 : 1
            const isToday = isCurrentMonth && day === todayDay
            const hasIncome = act && act.income > 0 && act.expense === 0

            return (
              <div key={di} className="flex items-center justify-center aspect-square">
                {hasActivity ? (
                  <div
                    className="rounded-full transition-all"
                    style={{
                      width: size,
                      height: size,
                      backgroundColor: hasIncome
                        ? `rgba(67,181,129,${opacity})`
                        : `rgba(88,101,242,${opacity})`,
                    }}
                  />
                ) : (
                  <div
                    className="rounded-full"
                    style={{
                      width: isToday ? 5 : 3,
                      height: isToday ? 5 : 3,
                      backgroundColor: isToday ? '#6366F1' : '#374151',
                    }}
                  />
                )}
              </div>
            )
          })}
        </div>
      ))}

      {/* 요일 헤더 (하단) */}
      <div className="grid grid-cols-7 mt-1">
        {DOW_LABELS.map(d => (
          <div key={d} className="text-center text-[9px] text-muted-foreground font-medium">{d}</div>
        ))}
      </div>
    </div>
  )
}
