import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function AnalyticsWidget() {
  const t = useTranslations('dashboard')
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-muted-foreground">{t('sendAnalytics')}</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-2xl font-bold">0</p>
          <p className="text-xs text-muted-foreground">{t('emailsSent')}</p>
        </div>
        <div>
          <p className="text-2xl font-bold">0</p>
          <p className="text-xs text-muted-foreground">{t('segmentsReached')}</p>
        </div>
      </CardContent>
    </Card>
  )
}
