import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/admin'
import { getActiveCampaign } from '@/actions/sender'
import { SenderClient } from '@/components/sender/sender-client'
import type { Employer } from '@/lib/supabase/types'
import Link from 'next/link'

export default async function SenderPage({
  params: { locale },
}: {
  params: { locale: string }
}) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/login`)

  const t = await getTranslations('sender')

  // Check if user has a resume
  const { data: resume } = await supabase
    .from('resumes')
    .select('id')
    .eq('user_id', user.id)
    .single()

  const activeCampaign = await getActiveCampaign()

  // Fetch all active employers (filtered client-side by fleet type)
  const { data: employers } = await supabase
    .from('employers')
    .select('*')
    .eq('is_active', true)
    .order('fleet_type')
    .returns<Employer[]>()

  const admin = isAdmin(user.email)

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

      {!resume ? (
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
          employers={employers ?? []}
          activeCampaign={activeCampaign}
          locale={locale}
        />
      )}
    </div>
  )
}
