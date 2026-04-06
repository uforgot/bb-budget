export const typography = {
  cardTitle: 'text-foreground/20 dark:text-white/80',
  cardBody: 'text-foreground dark:text-white',
  cardBodyInverse: 'text-white',
  cardSubtle: 'text-muted-foreground',
  cardSubtleStrong: 'text-foreground/20 dark:text-white/80',
  cardSubtleInverse: 'text-gray-200 dark:text-white/70',
  badgeText: 'text-white',
  iconStrong: 'text-foreground',
  iconToolbar: 'text-foreground',
  lightGrayStrong: '#9CA3AF',
} as const

export const surfaces = {
  selectedDay: 'bg-black/75 dark:bg-[#3A3A3C]',
  selectedDayLight: '#E5E7EB',
  chartBarMuted: '#9CA3AF',
  chartBarMutedDark: '#2C2C2E',
} as const

export const semanticColors = {
  expense: '#5865F2',
  income: '#14b8a6',
  savings: '#8b5cf6',
  balanceNegative: '#FF6B9D',
} as const
