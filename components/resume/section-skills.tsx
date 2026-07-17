'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { X, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { addSkill, deleteSkill } from '@/actions/resume'
import type { ResumeSkill } from '@/lib/supabase/types'

type Props = { initialData: ResumeSkill[]; onComplete: (complete: boolean) => void; onUpdate?: (entries: ResumeSkill[]) => void }

export function SectionSkills({ initialData, onComplete, onUpdate }: Props) {
  const t = useTranslations('resume')
  const [entries, setEntries] = useState(initialData)
  const [input, setInput] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleAdd() {
    const name = input.trim()
    if (!name) return
    setSaving(true)
    const result = await addSkill({ name, sort_order: entries.length })
    setSaving(false)
    if (result.error) { toast.error(t('saveError')); return }
    if (result.entry) {
      const next = [...entries, result.entry]
      setEntries(next)
      onComplete(true)
      onUpdate?.(next)
    }
    setInput('')
  }

  async function handleDelete(id: string) {
    const result = await deleteSkill(id)
    if (result.error) { toast.error(t('saveError')); return }
    const next = entries.filter(e => e.id !== id)
    setEntries(next)
    onComplete(next.length > 0)
    onUpdate?.(next)
  }

  return (
    <div className="flex flex-col gap-4 p-1">
      <div className="flex flex-wrap gap-2">
        {entries.map(entry => (
          <Badge key={entry.id} variant="secondary" className="gap-1 text-sm py-1">
            {entry.name}
            <button type="button" onClick={() => handleDelete(entry.id)} aria-label={t('delete')} className="ml-1 hover:text-destructive">
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        {entries.length === 0 && <p className="text-sm text-muted-foreground">{t('noEntries')}</p>}
      </div>
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={t('skillName')}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAdd() } }}
          className="max-w-xs"
        />
        <Button size="sm" onClick={handleAdd} disabled={saving || !input.trim()}>
          <Plus className="h-4 w-4 mr-1" />{t('addEntry')}
        </Button>
      </div>
    </div>
  )
}
