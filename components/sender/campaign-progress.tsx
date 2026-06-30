'use client'

import { useTranslations } from 'next-intl'
import type { SendCampaign } from '@/lib/supabase/types'

type Props = {
  campaign: SendCampaign
}

export function CampaignProgress({ campaign }: Props) {
  const t = useTranslations('sender')
  const pct =
    campaign.total_count > 0
      ? Math.round((campaign.sent_count / campaign.total_count) * 100)
      : 0

  return (
    <div
      className="rounded-xl border bg-card p-4 space-y-2"
      style={{ borderColor: '#b8cce0' }}
    >
      <p className="text-sm font-medium" style={{ color: '#0c2461' }}>
        {t(`filter${campaign.fleet_type.charAt(0).toUpperCase() + campaign.fleet_type.slice(1)}` as 'filterMerchant')}
      </p>
      <p className="text-sm text-muted-foreground">
        {t('progress', { sent: campaign.sent_count, total: campaign.total_count })}
      </p>
      <div className="w-full bg-muted rounded-full h-2">
        <div
          className="h-2 rounded-full transition-all"
          style={{ width: `${pct}%`, background: '#0c2461' }}
        />
      </div>
      {campaign.status === 'done' && (
        <p className="text-sm font-medium text-green-600">{t('done')}</p>
      )}
    </div>
  )
}
