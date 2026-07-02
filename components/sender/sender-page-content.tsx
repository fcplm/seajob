'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { SenderClient } from './sender-client'
import type { Employer, SendCampaign } from '@/lib/supabase/types'

type Props = {
  employers: Employer[]
  activeCampaign: SendCampaign | null
  locale: string
  admin: boolean
  hasResume: boolean
}

export function SenderPageContent({ employers, activeCampaign, locale, admin, hasResume }: Props) {
  const t = useTranslations('sender')

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl" style={{ color: '#0c2461' }}>
          {t('title')}
        </h1>
        {admin && (
          <Link
            href={`/${locale}/dashboard/sender/employers`}
            className="text-sm underline"
            style={{ color: '#0c2461' }}
          >
            {t('managersTitle')}
          </Link>
        )}
      </div>

      {!hasResume ? (
        <div
          className="rounded-xl border bg-card p-6 text-center space-y-2"
          style={{ borderColor: '#b8cce0' }}
        >
          <p className="text-muted-foreground">{t('noResume')}</p>
          <Link
            href={`/${locale}/dashboard/resume`}
            className="text-sm underline"
            style={{ color: '#0c2461' }}
          >
            {t('noResumeLink')}
          </Link>
        </div>
      ) : (
        <SenderClient
          employers={employers}
          activeCampaign={activeCampaign}
          locale={locale}
        />
      )}
    </div>
  )
}
