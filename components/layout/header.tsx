'use client'

import { useTranslations, useLocale } from 'next-intl'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

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
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href={`/${locale}`} className="text-xl font-bold">
          SeaJob
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm">
          <Link href={`/${locale}#vacancies`} className="text-muted-foreground hover:text-foreground">
            {t('vacancies')}
          </Link>
          <Link href={`/${locale}#pricing`} className="text-muted-foreground hover:text-foreground">
            {t('pricing')}
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={toggleLocale}>
            {locale === 'en' ? 'RU' : 'EN'}
          </Button>
          <Link href={`/${locale}/login`}>
            <Button variant="ghost" size="sm">{t('login')}</Button>
          </Link>
          <Link href={`/${locale}/signup`}>
            <Button size="sm">{t('getStarted')}</Button>
          </Link>
        </div>
      </div>
    </header>
  )
}
