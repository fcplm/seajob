'use client'

import { useTranslations, useLocale } from 'next-intl'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const mobileItems = [
  {
    key: 'home' as const, path: '',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  },
  {
    key: 'resume' as const, path: '/resume',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  },
  {
    key: 'vacancies' as const, path: '/vacancies',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  },
  {
    key: 'sender' as const, path: '/sender',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
  },
  {
    key: 'profile' as const, path: '/profile',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  },
]

export function BottomBar() {
  const t = useTranslations('dashboard')
  const locale = useLocale()
  const pathname = usePathname()

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50"
      style={{ background: '#0c2461', borderTop: '1px solid rgba(255,255,255,0.08)' }}
    >
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
                'flex flex-col items-center gap-1 text-[10px] font-medium px-3 py-1 transition-colors',
                isActive ? 'text-white' : 'text-white/40'
              )}
            >
              {item.icon}
              {t(item.key)}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
