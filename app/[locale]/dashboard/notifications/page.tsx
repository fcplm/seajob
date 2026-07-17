import { getTranslations } from 'next-intl/server'
import { Bell } from 'lucide-react'
import Link from 'next/link'

export default async function NotificationsPage({ params: { locale } }: { params: { locale: string } }) {
  const t = await getTranslations('notifications')

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold mb-6">{t('title')}</h1>
      <div className="flex flex-col items-center justify-center py-16 gap-4 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50">
        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
          <Bell className="w-6 h-6 text-slate-400" />
        </div>
        <div className="space-y-1">
          <p className="font-semibold text-slate-700">{t('emptyTitle')}</p>
          <p className="text-sm text-muted-foreground max-w-xs">{t('emptyDesc')}</p>
        </div>
        <p className="text-xs text-muted-foreground max-w-xs border-t border-slate-200 pt-4">{t('emptyHint')}</p>
        <Link
          href={`/${locale}/dashboard/resume`}
          className="text-sm font-medium text-[#0c2461] underline underline-offset-4 hover:opacity-75"
        >
          {locale === 'ru' ? 'Заполнить резюме →' : 'Complete your resume →'}
        </Link>
      </div>
    </div>
  )
}
