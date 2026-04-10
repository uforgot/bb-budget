export function resolveYearMonthFromOffset(monthOffset: number, now = new Date()) {
  const tm = now.getMonth() + 1 + monthOffset
  const currentYear = now.getFullYear() + Math.floor((tm - 1) / 12)
  const currentMonth = ((tm - 1) % 12 + 12) % 12 + 1
  return { currentYear, currentMonth }
}

export function getMonthOffsetForYearMonth(year: number, month: number, now = new Date()) {
  return (year - now.getFullYear()) * 12 + (month - (now.getMonth() + 1))
}
