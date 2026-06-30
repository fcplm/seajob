'use client'

import { useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { translateCoverLetter } from '@/actions/sender'
import { toast } from 'sonner'

type Props = {
  value: string
  onChange: (v: string) => void
}

export function CoverLetterField({ value, onChange }: Props) {
  const t = useTranslations('sender')
  const [isPending, startTransition] = useTransition()

  function handleTranslate() {
    if (!value.trim()) return
    startTransition(async () => {
      const res = await translateCoverLetter(value)
      if (res.ok && res.text) {
        onChange(res.text)
        toast.success(t('translateSuccess'))
      } else {
        toast.error(t('translateError'))
      }
    })
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium" style={{ color: '#1a2540' }}>
        {t('coverLetter')}
      </label>
      <Textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        rows={6}
        placeholder={t('coverLetterPlaceholder')}
        className="resize-none"
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleTranslate}
        disabled={isPending || !value.trim()}
      >
        {isPending ? t('translating') : t('translate')}
      </Button>
    </div>
  )
}
