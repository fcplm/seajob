'use client'

import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type Props = {
  lastCampaignFleet?: string | null
  lastCampaignStatus?: string | null
  lastCampaignSent?: number | null
}

export function ActivityWidget({ lastCampaignFleet, lastCampaignStatus, lastCampaignSent }: Props) {
  const t = useTranslations('dashboard')
  const ts = useTranslations('sender')

  const hasActivity = !!lastCampaignFleet

  const fleetLabel = lastCampaignFleet
    ? ts(`filter${lastCampaignFleet.charAt(0).toUpperCase() + lastCampaignFleet.slice(1)}` as Parameters<typeof ts>[0])
    : null

  const statusLabel = lastCampaignStatus === 'done'
    ? ts('done')
    : lastCampaignStatus === 'failed'
      ? ts('failed')
      : lastCampaignStatus === 'running' || lastCampaignStatus === 'pending'
        ? ts('launching')
        : null

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-muted-foreground">{t('recentActivity')}</CardTitle>
      </CardHeader>
      <CardContent>
        {hasActivity ? (
          <div className="space-y-1">
            <p className="text-sm font-medium" style={{ color: '#0c2461' }}>
              {fleetLabel} — {statusLabel}
            </p>
            {lastCampaignSent != null && lastCampaignSent > 0 && (
              <p className="text-xs text-muted-foreground">
                {ts('progress', { sent: lastCampaignSent, total: lastCampaignSent })}
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{t('noActivity')}</p>
        )}
      </CardContent>
    </Card>
  )
}
