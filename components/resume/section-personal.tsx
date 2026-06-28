'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { upsertResumeMeta } from '@/actions/resume'

type Props = {
  initialBio: string | null
  onComplete: (complete: boolean) => void
}

export function SectionPersonal({ initialBio, onComplete }: Props) {
  const t = useTranslations('resume')
  const [bio, setBio] = useState(initialBio ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleSave() {
    setSaving(true)
    const result = await upsertResumeMeta({ bio: bio || null })
    setSaving(false)
    if (result.error) {
      toast.error(t('saveError'))
    } else {
      setSaved(true)
      onComplete(bio.trim().length > 0)
      setTimeout(() => setSaved(false), 2000)
    }
  }

  return (
    <div className="flex flex-col gap-4 p-1">
      <div className="flex flex-col gap-1">
        <Label htmlFor="bio">{t('bio')}</Label>
        <Textarea
          id="bio"
          value={bio}
          onChange={(e) => { setBio(e.target.value); setSaved(false) }}
          rows={4}
        />
      </div>
      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={saving} size="sm">
          {saving ? t('saving') : t('save')}
        </Button>
        {saved && <span className="text-sm text-green-600">{t('saved')}</span>}
      </div>
    </div>
  )
}
