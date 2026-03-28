import { SettingsButton } from './settings-button'

export function TopHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="flex items-center justify-between h-14 flex-shrink-0">
      <div className="flex items-baseline gap-2">
        <span className="text-[18px] font-semibold">{title}</span>
        {subtitle && (
          <span className="text-xs text-muted-foreground">{subtitle}</span>
        )}
      </div>
      <SettingsButton />
    </header>
  )
}
