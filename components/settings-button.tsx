import { Settings } from 'lucide-react'
import Link from 'next/link'

export function SettingsButton() {
  return (
    <Link
      href="/settings"
      className="p-2 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
      aria-label="설정"
    >
      <Settings size={20} strokeWidth={2} />
    </Link>
  )
}
