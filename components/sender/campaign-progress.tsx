'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { getActiveCampaign } from '@/actions/sender'
import type { SendCampaign } from '@/lib/supabase/types'

type Props = {
  campaign: SendCampaign
}

export function CampaignProgress({ campaign: initial }: Props) {
  const t = useTranslations('sender')
  const [campaign, setCampaign] = useState<SendCampaign>(initial)

  useEffect(() => {
    if (campaign.status === 'done' || campaign.status === 'failed') return

    const interval = setInterval(async () => {
      const updated = await getActiveCampaign()
      if (updated) setCampaign(updated)
      else {
        // Campaign completed — update status
        setCampaign(prev => ({ ...prev, status: 'done' }))
        clearInterval(interval)
      }
    }, 10_000) // poll every 10 seconds

    return () => clearInterval(interval)
  }, [campaign.status])

  const pct = campaign.total_count > 0
    ? Math.round((campaign.sent_count / campaign.total_count) * 100)
    : 0

  return (
    <div className="rounded-xl border bg-card p-5 space-y-3" style={{ borderColor: '#b8cce0' }}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold capitalize" style={{ color: '#0c2461' }}>
          {campaign.fleet_type}
        </p>
        <span className="text-xs text-muted-foreground capitalize">{campaign.status}</span>
      </div>
      <p className="text-sm text-muted-foreground">
        {t('progress', { sent: campaign.sent_count, total: campaign.total_count })}
      </p>
      <div className="w-full bg-muted rounded-full h-2">
        <div
          className="h-2 rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: '#0c2461' }}
        />
      </div>
      {campaign.status === 'done' && (
        <p className="text-sm font-medium text-green-600">{t('done')}</p>
      )}
      {campaign.status === 'failed' && (
        <p className="text-sm font-medium text-red-600">{t('failed')}</p>
      )}
    </div>
  )
}
