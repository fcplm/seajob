'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { upsertResumeMeta } from '@/actions/resume'

type InitialData = {
  availability_date: string | null
  contract_duration: string | null
  salary_expectation: string | null
}

type Props = {
  initialData: InitialData
  onComplete: (complete: boolean) => void
}

export function SectionPreferences({ initialData, onComplete }: Props) {
  const t = useTranslations('resume')
  const [form, setForm] = useState<InitialData>(initialData)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  function set(field: keyof InitialData, value: string) {
    setForm(prev => ({ ...prev, [field]: value || null }))
    setSaved(false)
  }

  async function handleSave() {
    setSaving(true)
    const result = await upsertResumeMeta(form)
    setSaving(false)
    if (result.error) {
      toast.error(t('saveError'))
    } else {
      setSaved(true)
      const anyFilled = !!(form.availability_date || form.contract_duration || form.salary_expectation)
      onComplete(anyFilled)
      setTimeout(() => setSaved(false), 2000)
    }
  }

  return (
    <div className="flex flex-col gap-4 p-1">
      <div className="flex flex-col gap-1">
        <Label htmlFor="availability">{t('availability')}</Label>
        <Input
          id="availability"
          type="date"
          value={form.availability_date ?? ''}
          onChange={e => set('availability_date', e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="contract">{t('contractDuration')}</Label>
        <Input
          id="contract"
          value={form.contract_duration ?? ''}
          onChange={e => set('contract_duration', e.target.value)}
          placeholder={t('contractDurationPlaceholder')}
        />
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="salary">{t('salaryExpectation')}</Label>
        <Input
          id="salary"
          value={form.salary_expectation ?? ''}
          onChange={e => set('salary_expectation', e.target.value)}
          placeholder={t('salaryExpectationPlaceholder')}
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
