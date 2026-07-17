import { getTranslations } from 'next-intl/server'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'

export default async function SettingsPage({ params: { locale } }: { params: { locale: string } }) {
  const t = await getTranslations('settings')

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-2xl font-bold">{t('title')}</h1>
      <Separator />

      <div className="space-y-2">
        <p className="font-medium">{t('language')}</p>
        <div className="flex gap-2">
          <a href={`/en/dashboard/settings`}>
            <Button variant={locale === 'en' ? 'default' : 'outline'} size="sm">EN</Button>
          </a>
          <a href={`/ru/dashboard/settings`}>
            <Button variant={locale === 'ru' ? 'default' : 'outline'} size="sm">RU</Button>
          </a>
        </div>
      </div>

      <Separator />

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <p className="font-medium">{t('emailNotifications')}</p>
          <Badge variant="secondary" className="text-xs">{t('emailNotificationsComingSoon')}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">{t('emailNotificationsDesc')}</p>
      </div>

      <Separator />

      <div className="space-y-2">
        <p className="font-medium text-red-500">{t('deleteAccount')}</p>
        <p className="text-sm text-muted-foreground">{t('deleteWarning')}</p>
        <Button variant="destructive" size="sm" disabled>{t('deleteAccount')}</Button>
      </div>
    </div>
  )
}
