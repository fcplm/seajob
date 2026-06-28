import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
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

  const { data: resumeRow } = await supabase
    .from('resumes')
    .select('id')
    .eq('user_id', user.id)
    .single()

  const hasResume = !!resumeRow

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <ProfileCard profile={profile} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SubscriptionWidget status={profile.subscription_status} />
        <ResumeWidget hasResume={hasResume} />
        <ActivityWidget />
        <AnalyticsWidget />
      </div>
    </div>
  )
}
