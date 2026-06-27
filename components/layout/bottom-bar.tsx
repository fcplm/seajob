'use client'

import { useTranslations, useLocale } from 'next-intl'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const mobileItems = [
  { key: 'home' as const, path: '', icon: '🏠' },
  { key: 'resume' as const, path: '/resume', icon: '📄' },
  { key: 'vacancies' as const, path: '/vacancies', icon: '🔍' },
  { key: 'sender' as const, path: '/sender', icon: '📧' },
  { key: 'profile' as const, path: '/profile', icon: '👤' },
]

export function BottomBar() {
  const t = useTranslations('dashboard')
  const locale = useLocale()
  const pathname = usePathname()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t bg-background z-50">
      <div className="flex justify-around py-2">
        {mobileItems.map((item) => {
          const href = `/${locale}/dashboard${item.path}`
          const isActive = item.path === ''
            ? pathname === `/${locale}/dashboard`
            : pathname.startsWith(href)
          return (
            <Link
              key={item.key}
              href={href}
              className={cn(
                'flex flex-col items-center gap-1 text-xs px-3 py-1',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <span className="text-xl">{item.icon}</span>
              {t(item.key)}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
