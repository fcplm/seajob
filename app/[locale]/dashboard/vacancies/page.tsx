import dynamic from 'next/dynamic'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Vacancy } from '@/lib/supabase/types'

const VacanciesPageContent = dynamic(
  () =>
    import('@/components/vacancies/vacancies-page-content').then((m) => ({
      default: m.VacanciesPageContent,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="h-8 w-48 bg-muted rounded animate-pulse mb-6" />
        <div className="flex gap-2 mb-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-8 w-20 bg-muted rounded-full animate-pulse" />
          ))}
        </div>
        <div
          className="grid gap-3"
          style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))' }}
        >
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-48 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    ),
  }
)

const PAGE_SIZE = 20

export default async function VacanciesPage({
  params: { locale },
  searchParams,
}: {
  params: { locale: string }
  searchParams: { fleet?: string; page?: string }
}) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/login`)

  const fleet = searchParams.fleet ?? ''
  const page = Math.max(1, parseInt(searchParams.page ?? '1', 10))
  const offset = (page - 1) * PAGE_SIZE

  let query = supabase
    .from('vacancies')
    .select('*', { count: 'exact' })
    .order('posted_at', { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1)

  if (fleet) {
    query = query.ilike('vessel_type', `%${fleet}%`)
  }

  const { data, count } = await query
  const vacancies = (data ?? []) as Vacancy[]
  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)

  return (
    <VacanciesPageContent
      vacancies={vacancies}
      locale={locale}
      currentFleet={fleet}
      currentPage={page}
      totalPages={totalPages}
    />
  )
}
