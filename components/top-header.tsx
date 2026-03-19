import { SettingsButton } from './settings-button'

export function TopHeader() {
  return (
    <div className="flex items-center justify-between pt-8 pb-4">
      <span className="text-xl font-bold">빵계부</span>
      <SettingsButton />
    </div>
  )
}
