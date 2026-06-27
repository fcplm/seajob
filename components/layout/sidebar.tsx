'use client'

import { useTranslations, useLocale } from 'next-intl'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { logout } from '@/actions/auth'
import { Button } from '@/components/ui/button'

const navItems = [
  { key: 'home' as const, path: '', icon: '🏠' },
  { key: 'profile' as const, path: '/profile', icon: '👤' },
  { key: 'resume' as const, path: '/resume', icon: '📄' },
  { key: 'vacancies' as const, path: '/vacancies', icon: '🔍' },
  { key: 'sender' as const, path: '/sender', icon: '📧' },
  { key: 'notifications' as const, path: '/notifications', icon: '🔔' },
  { key: 'settings' as const, path: '/settings', icon: '⚙️' },
]

export function Sidebar() {
  const t = useTranslations('dashboard')
  const locale = useLocale()
  const pathname = usePathname()

  return (
    <aside className="hidden md:flex flex-col w-60 border-r h-screen sticky top-0 bg-background">
      <div className="p-4 border-b">
        <Link href={`/${locale}`} className="font-bold text-lg">SeaJob</Link>
      </div>
      <nav className="flex flex-col gap-1 p-2 flex-1">
        {navItems.map((item) => {
          const href = `/${locale}/dashboard${item.path}`
          const isActive = item.path === ''
            ? pathname === `/${locale}/dashboard`
            : pathname.startsWith(href)
          return (
            <Link
              key={item.key}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <span>{item.icon}</span>
              {t(item.key)}
            </Link>
          )
        })}
      </nav>
      <div className="p-2 border-t">
        <form action={() => logout(locale)}>
          <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground" type="submit">
            <span>🚪</span> {t('logout')}
          </Button>
        </form>
      </div>
    </aside>
  )
}
