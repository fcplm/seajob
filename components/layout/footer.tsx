'use client'

import { useTranslations, useLocale } from 'next-intl'
import Link from 'next/link'

export function Footer() {
  const t = useTranslations('footer')
  const locale = useLocale()

  return (
    <footer className="bg-primary">
      <div
        style={{ maxWidth: 1080 }}
        className="mx-auto px-12 py-7 flex items-center"
      >
        <span className="font-display text-lg text-white/80">SeaJob</span>

        <div className="flex items-center gap-6 ml-10">
          <Link href={`/${locale}#vacancies`} className="text-white/35 hover:text-white/65 text-sm transition-colors">
            {t('vacanciesLink')}
          </Link>
          <Link href={`/${locale}#how-it-works`} className="text-white/35 hover:text-white/65 text-sm transition-colors">
            {t('howItWorksLink')}
          </Link>
          <a href={`mailto:${t('email')}`} className="text-white/35 hover:text-white/65 text-sm transition-colors">
            {t('contact')}
          </a>
        </div>

        <span className="ml-auto text-white/20 text-xs">
          © {new Date().getFullYear()} SeaJob
        </span>
      </div>
    </footer>
  )
}
