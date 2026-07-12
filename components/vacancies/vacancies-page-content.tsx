'use client'

import { useTranslations } from 'next-intl'
import { VacancyCard } from './vacancy-card'
import { VacancyFilters } from './vacancy-filters'
import type { Vacancy } from '@/lib/supabase/types'

export function VacanciesPageContent({
  vacancies,
  locale,
  currentFleet,
  currentPage,
  totalPages,
}: {
  vacancies: Vacancy[]
  locale: string
  currentFleet: string
  currentPage: number
  totalPages: number
}) {
  const t = useTranslations('vacancies')

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="font-display text-2xl font-bold mb-6" style={{ color: '#0c2461' }}>
        {t('title')}
      </h1>

      <VacancyFilters currentFleet={currentFleet} locale={locale} />

      {vacancies.length === 0 ? (
        <p className="text-muted-foreground text-sm mt-12 text-center">{t('noVacancies')}</p>
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
              href={`/${locale}/dashboard/vacancies?fleet=${currentFleet}&page=${p}`}
              className="px-3 py-1 rounded text-sm font-medium border transition-colors"
              style={
                p === currentPage
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
