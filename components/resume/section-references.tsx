'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Pencil, Trash2, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { addReference, updateReference, deleteReference } from '@/actions/resume'
import type { ResumeReference } from '@/lib/supabase/types'

type Props = { initialData: ResumeReference[]; onComplete: (complete: boolean) => void }
type FormState = Omit<ResumeReference, 'id' | 'resume_id'>
const EMPTY: FormState = { full_name: null, position: null, company: null, email: null, phone: null, sort_order: 0 }

export function SectionReferences({ initialData, onComplete }: Props) {
  const t = useTranslations('resume')
  const [entries, setEntries] = useState(initialData)
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY)
  const [saving, setSaving] = useState(false)

  function setField(field: keyof FormState, value: string | null) {
    setForm(prev => ({ ...prev, [field]: value || null }))
  }

  function startEdit(entry: ResumeReference) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, resume_id, ...rest } = entry
    setForm(rest); setEditingId(id); setAdding(false)
  }

  async function handleSave() {
    setSaving(true)
    if (editingId) {
      const result = await updateReference(editingId, form)
      setSaving(false)
      if (result.error) { toast.error(t('saveError')); return }
      setEntries(prev => prev.map(e => e.id === editingId ? { ...e, ...form } : e))
      setEditingId(null)
    } else {
      const result = await addReference({ ...form, sort_order: entries.length })
      setSaving(false)
      if (result.error) { toast.error(t('saveError')); return }
      if (result.entry) { setEntries(prev => [...prev, result.entry!]); onComplete(true) }
      setAdding(false)
    }
    setForm(EMPTY)
  }

  async function handleDelete(id: string) {
    const result = await deleteReference(id)
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
              <p className="font-medium">{entry.full_name}</p>
              <p className="text-muted-foreground">{entry.position}{entry.company ? ` · ${entry.company}` : ''}</p>
              <p className="text-muted-foreground text-xs">{entry.email}{entry.phone ? ` · ${entry.phone}` : ''}</p>
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
            <div className="flex flex-col gap-1 col-span-2"><Label>{t('refName')}</Label><Input value={form.full_name ?? ''} onChange={e => setField('full_name', e.target.value)} /></div>
            <div className="flex flex-col gap-1"><Label>{t('refPosition')}</Label><Input value={form.position ?? ''} onChange={e => setField('position', e.target.value)} /></div>
            <div className="flex flex-col gap-1"><Label>{t('refCompany')}</Label><Input value={form.company ?? ''} onChange={e => setField('company', e.target.value)} /></div>
            <div className="flex flex-col gap-1"><Label>{t('refEmail')}</Label><Input type="email" value={form.email ?? ''} onChange={e => setField('email', e.target.value)} /></div>
            <div className="flex flex-col gap-1"><Label>{t('refPhone')}</Label><Input type="tel" value={form.phone ?? ''} onChange={e => setField('phone', e.target.value)} /></div>
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
