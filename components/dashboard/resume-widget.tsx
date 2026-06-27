'use client'

import { useTranslations, useLocale } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export function ResumeWidget({ hasResume }: { hasResume: boolean }) {
  const t = useTranslations('dashboard')
  const locale = useLocale()

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-muted-foreground">{t('resume')}</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {hasResume ? t('resumeCreated') : t('noResume')}
        </p>
        <Link href={`/${locale}/dashboard/resume`}>
          <Button size="sm" variant={hasResume ? 'outline' : 'default'}>
            {hasResume ? t('editResume') : t('createResume')}
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}
