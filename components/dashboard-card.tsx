'use client'

import type { CSSProperties, ReactNode } from 'react'
import { typography } from '@/components/ui-colors'

export const DASHBOARD_CARD_BASE_CLASS = 'bg-surface rounded-[22px] px-5 pt-5 pb-4 mb-3 min-h-[150px] flex flex-col justify-between'
export const DASHBOARD_CARD_TITLE_CLASS = `text-[13px] font-semibold ${typography.cardTitle} mb-0.5`
export const DASHBOARD_CARD_AMOUNT_CLASS = `text-[24px] font-bold tabular-nums ${typography.cardBody} leading-tight`
export const DASHBOARD_CARD_FOOTER_LABEL_CLASS = `text-[14px] ${typography.cardBody} mb-0.5`
export const DASHBOARD_CARD_FOOTER_VALUE_CLASS = `text-[14px] font-semibold tabular-nums ${typography.cardBody}`

export function DashboardCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`${DASHBOARD_CARD_BASE_CLASS} ${className}`.trim()}>{children}</div>
}

export function DashboardCardHeader({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={className}>{children}</div>
}

export function DashboardCardTitle({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <p className={`${DASHBOARD_CARD_TITLE_CLASS} ${className}`.trim()}>{children}</p>
}

export function DashboardCardAmount({ children, className = '', style }: { children: ReactNode; className?: string; style?: CSSProperties }) {
  return <div className={`${DASHBOARD_CARD_AMOUNT_CLASS} ${className}`.trim()} style={style}>{children}</div>
}

export function DashboardCardFooter({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={className}>{children}</div>
}

export function DashboardCardFooterLabel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <p className={`${DASHBOARD_CARD_FOOTER_LABEL_CLASS} ${className}`.trim()}>{children}</p>
}

export function DashboardCardFooterValue({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <p className={`${DASHBOARD_CARD_FOOTER_VALUE_CLASS} ${className}`.trim()}>{children}</p>
}
