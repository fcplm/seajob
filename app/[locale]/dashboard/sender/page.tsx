import { redirect } from 'next/navigation'
import dynamic from 'next/dynamic'
import { createClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/admin'
import { getActiveCampaign } from '@/actions/sender'
import type { Employer } from '@/lib/supabase/types'

const SenderPageContent = dynamic(
  () => import('@/components/sender/sender-page-content').then(m => ({ default: m.SenderPageContent })),
  {
    ssr: false,
    loading: () => (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="h-8 w-48 bg-muted rounded animate-pulse mb-6" />
        <div className="space-y-4">
          <div className="h-10 bg-muted rounded animate-pulse" />
          <div className="h-32 bg-muted rounded animate-pulse" />
          <div className="h-10 bg-muted rounded animate-pulse" />
        </div>
      </div>
    ),
  }
)

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

  const [{ data: resume }, activeCampaign, { data: employers }] = await Promise.all([
    supabase.from('resumes').select('id').eq('user_id', user.id).single(),
    getActiveCampaign(),
    supabase
      .from('employers')
      .select('id, email, company, fleet_type, is_active')
      .eq('is_active', true)
      .order('fleet_type')
      .returns<Employer[]>(),
  ])

  const admin = isAdmin(user.email)

  return (
    <SenderPageContent
      employers={employers ?? []}
      activeCampaign={activeCampaign}
      locale={locale}
      admin={admin}
      hasResume={!!resume}
    />
  )
}
