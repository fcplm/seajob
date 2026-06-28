'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Pencil, Trash2, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { addEducation, updateEducation, deleteEducation } from '@/actions/resume'
import type { ResumeEducation } from '@/lib/supabase/types'

type Props = { initialData: ResumeEducation[]; onComplete: (complete: boolean) => void }
type FormState = Omit<ResumeEducation, 'id' | 'resume_id'>
const EMPTY: FormState = { institution: null, degree: null, field: null, started_at: null, ended_at: null, sort_order: 0 }

export function SectionEducation({ initialData, onComplete }: Props) {
  const t = useTranslations('resume')
  const [entries, setEntries] = useState(initialData)
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY)
  const [saving, setSaving] = useState(false)

  function setField(field: keyof FormState, value: string | null) {
    setForm(prev => ({ ...prev, [field]: value || null }))
  }

  function startEdit(entry: ResumeEducation) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, resume_id, ...rest } = entry
    setForm(rest); setEditingId(id); setAdding(false)
  }

  async function handleSave() {
    setSaving(true)
    if (editingId) {
      const result = await updateEducation(editingId, form)
      setSaving(false)
      if (result.error) { toast.error(t('saveError')); return }
      setEntries(prev => prev.map(e => e.id === editingId ? { ...e, ...form } : e))
      setEditingId(null)
    } else {
      const result = await addEducation({ ...form, sort_order: entries.length })
      setSaving(false)
      if (result.error) { toast.error(t('saveError')); return }
      if (result.entry) { setEntries(prev => [...prev, result.entry!]); onComplete(true) }
      setAdding(false)
    }
    setForm(EMPTY)
  }

  async function handleDelete(id: string) {
    const result = await deleteEducation(id)
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
          <CardContent className="pt-4 flex items-start justify-between gap-2">
            <div className="text-sm">
              <p className="font-medium">{entry.degree}{entry.field ? ` ${t('inField')} ${entry.field}` : ''}</p>
              <p className="text-muted-foreground">{entry.institution}</p>
              <p className="text-muted-foreground text-xs">{entry.started_at} — {entry.ended_at}</p>
            </div>
            <div className="flex gap-1 shrink-0">
              <Button variant="ghost" size="icon" onClick={() => startEdit(entry)} aria-label={t('edit')}><Pencil className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" onClick={() => handleDelete(entry.id)} aria-label={t('delete')}><Trash2 className="h-4 w-4" /></Button>
            </div>
          </CardContent>
        </Card>
      ))}
      {showForm && (
        <div className="border rounded-lg p-4 flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1 col-span-2"><Label>{t('institution')}</Label><Input value={form.institution ?? ''} onChange={e => setField('institution', e.target.value)} /></div>
            <div className="flex flex-col gap-1"><Label>{t('degree')}</Label><Input value={form.degree ?? ''} onChange={e => setField('degree', e.target.value)} /></div>
            <div className="flex flex-col gap-1"><Label>{t('field')}</Label><Input value={form.field ?? ''} onChange={e => setField('field', e.target.value)} /></div>
            <div className="flex flex-col gap-1"><Label>{t('startDate')}</Label><Input type="date" value={form.started_at ?? ''} onChange={e => setField('started_at', e.target.value)} /></div>
            <div className="flex flex-col gap-1"><Label>{t('endDate')}</Label><Input type="date" value={form.ended_at ?? ''} onChange={e => setField('ended_at', e.target.value)} /></div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave} disabled={saving}>{saving ? t('saving') : t('save')}</Button>
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
