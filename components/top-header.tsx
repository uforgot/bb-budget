import { SettingsButton } from './settings-button'

export function TopHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="flex items-center justify-between pt-[env(safe-area-inset-top,0px)] h-14 flex-shrink-0">
      <div className="flex items-baseline gap-2">
        <span className="text-lg font-semibold">{title}</span>
        {subtitle && (
          <span className="text-xs text-muted-foreground">{subtitle}</span>
        )}
      </div>
      <SettingsButton />
    </header>
  )
}
