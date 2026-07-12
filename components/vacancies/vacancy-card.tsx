'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { applyToVacancy } from '@/actions/vacancies'
import type { Vacancy } from '@/lib/supabase/types'

export function VacancyCard({
  vacancy,
  locale,
}: {
  vacancy: Vacancy
  locale: string
}) {
  const t = useTranslations('vacancies')
  const [loading, setLoading] = useState(false)

  async function handleApply() {
    setLoading(true)
    const result = await applyToVacancy(vacancy.id)
    setLoading(false)
    if (result.ok) {
      toast.success(t('applied'))
    } else if (result.error === 'no_resume') {
      toast.error(t('noResume'))
    } else {
      toast.error(t('applyError'))
    }
  }

  const descPreview =
    vacancy.description && vacancy.description.length > 120
      ? vacancy.description.slice(0, 120) + '…'
      : (vacancy.description ?? '')

  // Use UTC-based formatting to avoid server/client timezone mismatch
  const postedDate = vacancy.posted_at
    ? (() => {
        const d = new Date(vacancy.posted_at)
        const day = d.getUTCDate()
        const month = d.getUTCMonth()
        const year = d.getUTCFullYear()
        const months = locale === 'ru'
          ? ['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек']
          : ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
        return `${day} ${months[month]} ${year}`
      })()
    : ''

  return (
    <div
      className="bg-card rounded-xl p-5 flex flex-col gap-3"
      style={{ border: '1px solid #b8cce0' }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {vacancy.is_urgent && (
              <span
                className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded"
                style={{ background: '#fee2e2', color: '#dc2626' }}
              >
                {t('urgent')}
              </span>
            )}
            <span
              className="text-[15px] font-bold tracking-tight"
              style={{ color: '#0c2461' }}
            >
              {vacancy.rank ?? '—'}
            </span>
          </div>
          <div className="text-xs mt-0.5 text-muted-foreground">
            {[vacancy.company, vacancy.vessel_type].filter(Boolean).join(' · ')}
          </div>
        </div>
        {vacancy.salary && (
          <span
            className="text-[13px] font-bold shrink-0"
            style={{ color: '#0c2461' }}
          >
            {vacancy.salary}
          </span>
        )}
      </div>

      {/* Description preview */}
      {descPreview && (
        <p className="text-xs leading-relaxed text-muted-foreground line-clamp-2">
          {descPreview}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-auto pt-1">
        <span className="text-[11px] text-muted-foreground">{postedDate}</span>

        <Button
          size="sm"
          onClick={handleApply}
          disabled={loading}
          className="text-xs h-8 px-3"
        >
          {loading ? '…' : t('apply')}
        </Button>
      </div>
    </div>
  )
}
