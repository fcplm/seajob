'use client'

import { useTranslations } from 'next-intl'

export function CompletenessBar({ score }: { score: number }) {
  const t = useTranslations('resume')
  const percent = Math.round(score * 100)
  return (
    <div className="flex items-center gap-3 flex-1">
      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className="text-sm text-muted-foreground shrink-0">
        {t('completeness', { percent })}
      </span>
    </div>
  )
}
