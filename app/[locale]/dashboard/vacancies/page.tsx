import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { VacancyCard } from '@/components/vacancies/vacancy-card'
import { VacancyFilters } from '@/components/vacancies/vacancy-filters'
import type { Vacancy } from '@/lib/supabase/types'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 20

export default async function VacanciesPage({
  params: { locale },
  searchParams,
}: {
  params: { locale: string }
  searchParams: { fleet?: string; page?: string }
}) {
  const t = await getTranslations('vacancies')
  const fleet = searchParams.fleet ?? ''
  const page = Math.max(1, parseInt(searchParams.page ?? '1', 10))
  const offset = (page - 1) * PAGE_SIZE

  const supabase = createClient()

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
    <div className="p-6 max-w-5xl mx-auto">
      <h1
        className="font-display text-2xl font-bold mb-6"
        style={{ color: '#0c2461' }}
      >
        {t('title')}
      </h1>

      <VacancyFilters currentFleet={fleet} locale={locale} />

      {vacancies.length === 0 ? (
        <p className="text-muted-foreground text-sm mt-12 text-center">
          {t('noVacancies')}
        </p>
      ) : (
        <div
          className="grid gap-3 mt-6"
          style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))' }}
        >
          {vacancies.map((v) => (
            <VacancyCard key={v.id} vacancy={v} locale={locale} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <a
              key={p}
              href={`/${locale}/dashboard/vacancies?fleet=${fleet}&page=${p}`}
              className="px-3 py-1 rounded text-sm font-medium border transition-colors"
              style={
                p === page
                  ? { background: '#0c2461', color: '#fff', borderColor: '#0c2461' }
                  : { background: '#fff', color: '#0c2461', borderColor: '#b8cce0' }
              }
            >
              {p}
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
