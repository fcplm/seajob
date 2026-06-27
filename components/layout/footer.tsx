'use client'

import { useTranslations, useLocale } from 'next-intl'

export function Footer() {
  const t = useTranslations('footer')
  const locale = useLocale()

  return (
    <footer className="border-t bg-muted/40">
      <div className="container mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <p className="font-bold text-lg">SeaJob</p>
          <p className="text-sm text-muted-foreground mt-1">{t('tagline')}</p>
        </div>
        <div>
          <p className="font-semibold mb-2">{t('links')}</p>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li><a href={`/${locale}#features`} className="hover:underline">{t('featuresLink')}</a></li>
            <li><a href={`/${locale}#pricing`} className="hover:underline">{t('pricingLink')}</a></li>
          </ul>
        </div>
        <div>
          <p className="font-semibold mb-2">{t('contact')}</p>
          <p className="text-sm text-muted-foreground">{t('email')}</p>
        </div>
      </div>
      <div className="border-t py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} SeaJob. {t('rights')}
      </div>
    </footer>
  )
}
