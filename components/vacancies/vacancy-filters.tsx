'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'

const FILTERS = [
  { key: '', labelKey: 'filterAll' },
  { key: 'container', labelKey: 'filterContainer' },
  { key: 'tanker', labelKey: 'filterTanker' },
  { key: 'offshore', labelKey: 'filterOffshore' },
  { key: 'bulk', labelKey: 'filterBulk' },
  { key: 'cruise', labelKey: 'filterCruise' },
] as const

type LabelKey = (typeof FILTERS)[number]['labelKey']

export function VacancyFilters({
  currentFleet,
  locale,
}: {
  currentFleet: string
  locale: string
}) {
  const t = useTranslations('vacancies')

  return (
    <div className="flex flex-wrap gap-2">
      {FILTERS.map(({ key, labelKey }) => {
        const isActive = currentFleet === key
        const href = key
          ? `/${locale}/dashboard/vacancies?fleet=${key}`
          : `/${locale}/dashboard/vacancies`

        return (
          <Link
            key={key}
            href={href}
            className="px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
            style={{
              background: isActive ? '#0c2461' : '#dce6f4',
              color: isActive ? '#ffffff' : '#0c2461',
            }}
          >
            {t(labelKey as LabelKey)}
          </Link>
        )
      })}
    </div>
  )
}
