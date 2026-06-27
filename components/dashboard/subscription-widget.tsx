'use client'

import { useTranslations, useLocale } from 'next-intl'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import type { Profile } from '@/lib/supabase/types'

export function SubscriptionWidget({ status }: { status: Profile['subscription_status'] }) {
  const t = useTranslations('dashboard')
  const locale = useLocale()

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-muted-foreground">{t('subscriptionStatus')}</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-between">
        <Badge variant={status === 'free' ? 'secondary' : 'default'} className="capitalize text-base px-3 py-1">
          {t(status)}
        </Badge>
        {status === 'free' && (
          <Link href={`/${locale}#pricing`}>
            <Button size="sm">{t('upgrade')}</Button>
          </Link>
        )}
      </CardContent>
    </Card>
  )
}
