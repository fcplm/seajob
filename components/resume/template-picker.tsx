'use client'

import { useTranslations } from 'next-intl'
import { Lock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { updateResumeTemplate } from '@/actions/resume'

type Template = 'classic' | 'modern' | 'compact'

type Props = {
  selected: Template
  subscriptionStatus: 'free' | 'pro' | 'enterprise'
  onSelect: (t: Template) => void
}

const TEMPLATES: { id: Template; labelKey: 'templateClassic' | 'templateModern' | 'templateCompact' }[] = [
  { id: 'classic', labelKey: 'templateClassic' },
  { id: 'modern', labelKey: 'templateModern' },
  { id: 'compact', labelKey: 'templateCompact' },
]

export function TemplatePicker({ selected, subscriptionStatus, onSelect }: Props) {
  const t = useTranslations('resume')
  const isPro = subscriptionStatus === 'pro' || subscriptionStatus === 'enterprise'

  async function handleSelect(template: Template) {
    if (!isPro && template !== 'classic') {
      toast.info(t('templateProRequired'))
      return
    }
    const result = await updateResumeTemplate(template)
    if (!result.error) onSelect(template)
    else toast.error(t('saveError'))
  }

  return (
    <div className="flex gap-3">
      {TEMPLATES.map(({ id, labelKey }) => {
        const locked = !isPro && id !== 'classic'
        return (
          <button
            key={id}
            type="button"
            onClick={() => handleSelect(id)}
            className={cn(
              'relative flex-1 border-2 rounded-lg p-3 text-sm font-medium transition-colors text-center',
              selected === id
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50',
              locked && 'opacity-60'
            )}
          >
            <span>{t(labelKey)}</span>
            {locked && (
              <span className="absolute top-1 right-1">
                <Badge variant="secondary" className="text-xs gap-1 py-0">
                  <Lock className="h-3 w-3" />{t('badgePro')}
                </Badge>
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
