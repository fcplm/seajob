import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import type { Profile } from '@/lib/supabase/types'
import { ProfileCard } from '@/components/dashboard/profile-card'
import { SubscriptionWidget } from '@/components/dashboard/subscription-widget'
import { ResumeWidget } from '@/components/dashboard/resume-widget'
import { ActivityWidget } from '@/components/dashboard/activity-widget'
import { AnalyticsWidget } from '@/components/dashboard/analytics-widget'

export default async function DashboardPage({ params: { locale } }: { params: { locale: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/login`)

  const { data: rawProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const profile = rawProfile as Profile | null
  if (!profile) redirect(`/${locale}/login`)

  const tProfile = await getTranslations('profile')
  const knownFleetTypes = ['merchant', 'tanker', 'offshore', 'bulk', 'cruise'] as const
  const fleetLabel = profile.fleet_type && (knownFleetTypes as readonly string[]).includes(profile.fleet_type)
    ? tProfile(profile.fleet_type as typeof knownFleetTypes[number])
    : (profile.fleet_type ?? '—')

  const { data: resumeRow } = await supabase
    .from('resumes')
    .select('id')
    .eq('user_id', user.id)
    .single()

  const hasResume = !!resumeRow

  const { data: analyticsData } = await supabase
    .from('send_campaigns')
    .select('sent_count, status, fleet_type, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const emailsSent = (analyticsData ?? []).reduce((sum, c) => sum + (c.sent_count ?? 0), 0)
  const campaignsDone = (analyticsData ?? []).filter(c => c.status === 'done').length
  const lastCampaign = analyticsData?.[0] ?? null

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <ProfileCard profile={profile} fleetLabel={fleetLabel} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SubscriptionWidget status={profile.subscription_status} />
        <ResumeWidget hasResume={hasResume} />
        <ActivityWidget
          lastCampaignFleet={lastCampaign?.fleet_type}
          lastCampaignStatus={lastCampaign?.status}
          lastCampaignSent={lastCampaign?.sent_count}
        />
        <AnalyticsWidget emailsSent={emailsSent} campaigns={campaignsDone} />
      </div>
    </div>
  )
}
