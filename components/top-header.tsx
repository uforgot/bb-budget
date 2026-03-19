import { SettingsButton } from './settings-button'

export function TopHeader({ title }: { title: string }) {
  return (
    <header className="flex items-center justify-between pt-[env(safe-area-inset-top,0px)] h-14 flex-shrink-0">
      <span className="text-lg font-bold">{title}</span>
      <SettingsButton />
    </header>
  )
}
