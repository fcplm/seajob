'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Pencil, Trash2, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { addLanguage, updateLanguage, deleteLanguage } from '@/actions/resume'
import type { ResumeLanguage } from '@/lib/supabase/types'

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'Native'] as const

type Props = { initialData: ResumeLanguage[]; onComplete: (complete: boolean) => void }
type FormState = Omit<ResumeLanguage, 'id' | 'resume_id'>
const EMPTY: FormState = { language: null, level: null, sort_order: 0 }

export function SectionLanguages({ initialData, onComplete }: Props) {
  const t = useTranslations('resume')
  const [entries, setEntries] = useState(initialData)
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY)
  const [saving, setSaving] = useState(false)

  function startEdit(entry: ResumeLanguage) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, resume_id, ...rest } = entry
    setForm(rest); setEditingId(id); setAdding(false)
  }

  async function handleSave() {
    setSaving(true)
    if (editingId) {
      const result = await updateLanguage(editingId, form)
      setSaving(false)
      if (result.error) { toast.error(t('saveError')); return }
      setEntries(prev => prev.map(e => e.id === editingId ? { ...e, ...form } : e))
      setEditingId(null)
    } else {
      const result = await addLanguage({ ...form, sort_order: entries.length })
      setSaving(false)
      if (result.error) { toast.error(t('saveError')); return }
      if (result.entry) { setEntries(prev => [...prev, result.entry!]); onComplete(true) }
      setAdding(false)
    }
    setForm(EMPTY)
  }

  async function handleDelete(id: string) {
    const result = await deleteLanguage(id)
    if (result.error) { toast.error(t('saveError')); return }
    const next = entries.filter(e => e.id !== id)
    setEntries(next); onComplete(next.length > 0)
  }

  const showForm = adding || editingId !== null

  return (
    <div className="flex flex-col gap-3 p-1">
      {entries.length === 0 && !showForm && <p className="text-sm text-muted-foreground">{t('noEntries')}</p>}
      {entries.map(entry => editingId === entry.id ? null : (
        <Card key={entry.id}>
          <CardContent className="pt-4 flex items-center justify-between gap-2">
            <p className="text-sm font-medium">{entry.language} — {entry.level}</p>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" onClick={() => startEdit(entry)} aria-label={t('edit')}><Pencil className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" onClick={() => handleDelete(entry.id)} aria-label={t('delete')}><Trash2 className="h-4 w-4" /></Button>
            </div>
          </CardContent>
        </Card>
      ))}
      {showForm && (
        <div className="border rounded-lg p-4 flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <Label>{t('language')}</Label>
              <Input value={form.language ?? ''} onChange={e => setForm(prev => ({ ...prev, language: e.target.value || null }))} />
            </div>
            <div className="flex flex-col gap-1">
              <Label>{t('level')}</Label>
              <Select value={form.level ?? ''} onValueChange={v => setForm(prev => ({ ...prev, level: v || null }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LEVELS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave} disabled={saving || !form.language?.trim()}>{saving ? t('saving') : t('save')}</Button>
            <Button size="sm" variant="outline" onClick={() => { setAdding(false); setEditingId(null) }}>{t('cancel')}</Button>
          </div>
        </div>
      )}
      {!showForm && (
        <Button variant="outline" size="sm" className="w-fit" onClick={() => { setForm(EMPTY); setAdding(true) }}>
          <Plus className="h-4 w-4 mr-2" />{t('addEntry')}
        </Button>
      )}
    </div>
  )
}
