import { getTranslations } from 'next-intl/server'

export default async function SenderPage() {
  const t = await getTranslations('dashboard')
  return (
    <div className="flex flex-col items-center justify-center h-64 text-muted-foreground gap-2">
      <span className="text-4xl">📧</span>
      <p className="font-medium">{t('sender')}</p>
      <p className="text-sm">{t('comingSoon')}</p>
    </div>
  )
}
