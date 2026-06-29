'use client'

import { useTranslations, useLocale } from 'next-intl'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'

export function Header() {
  const t = useTranslations('nav')
  const locale = useLocale()
  const pathname = usePathname()
  const router = useRouter()

  function toggleLocale() {
    const next = locale === 'en' ? 'ru' : 'en'
    const withoutLocale = pathname.replace(/^\/(en|ru)/, '')
    router.push(`/${next}${withoutLocale}`)
  }

  return (
    <header className="sticky top-0 z-50 bg-primary">
      <div
        style={{ maxWidth: 1080 }}
        className="mx-auto px-12 h-14 flex items-center"
      >
        <Link
          href={`/${locale}`}
          className="font-display text-xl text-white tracking-tight flex-shrink-0"
        >
          SeaJob
        </Link>

        <nav className="hidden md:flex items-center ml-8">
          <Link
            href={`/${locale}#vacancies`}
            className="text-white/50 hover:text-white/90 text-sm px-3.5 h-14 flex items-center transition-colors"
          >
            {t('vacancies')}
          </Link>
          <Link
            href={`/${locale}/dashboard/resume`}
            className="text-white/50 hover:text-white/90 text-sm px-3.5 h-14 flex items-center transition-colors"
          >
            {t('resume')}
          </Link>
          <Link
            href={`/${locale}/dashboard/sender`}
            className="text-white/50 hover:text-white/90 text-sm px-3.5 h-14 flex items-center transition-colors"
          >
            {t('cvSender')}
          </Link>
        </nav>

        <div className="ml-auto flex items-center gap-4">
          <button
            onClick={toggleLocale}
            className="text-white/35 hover:text-white/70 text-xs font-medium tracking-wide transition-colors"
          >
            {locale === 'en' ? 'RU' : 'EN'}
          </button>
          <Link
            href={`/${locale}/login`}
            className="text-white/80 hover:text-white text-sm font-medium border border-white/20 hover:border-white/40 px-4 py-1.5 rounded transition-colors"
          >
            {t('login')}
          </Link>
        </div>
      </div>
    </header>
  )
}
