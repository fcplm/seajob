import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/admin'
import { EmployerTable } from '@/components/sender/employer-table'
import type { Employer } from '@/lib/supabase/types'

export default async function EmployersPage({
  params: { locale },
}: {
  params: { locale: string }
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!isAdmin(user?.email)) redirect(`/${locale}/dashboard/sender`)

  const t = await getTranslations('sender')

  const { data: employers } = await supabase
    .from('employers')
    .select('*')
    .order('fleet_type')
    .order('company')
    .returns<Employer[]>()

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <h1 className="font-display text-2xl" style={{ color: '#0c2461' }}>
        {t('managersTitle')}
      </h1>
      <EmployerTable employers={employers ?? []} />
    </div>
  )
}
