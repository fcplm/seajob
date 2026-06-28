'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Pencil, Trash2, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { addExperience, updateExperience, deleteExperience } from '@/actions/resume'
import type { ResumeExperience } from '@/lib/supabase/types'

type Props = {
  initialData: ResumeExperience[]
  onComplete: (complete: boolean) => void
}

type FormState = Omit<ResumeExperience, 'id' | 'resume_id'>

const EMPTY: FormState = {
  vessel_name: null, vessel_type: null, grt: null, dwt: null,
  flag: null, company: null, position: null, started_at: null,
  ended_at: null, sort_order: 0,
}

export function SectionExperience({ initialData, onComplete }: Props) {
  const t = useTranslations('resume')
  const [entries, setEntries] = useState(initialData)
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY)
  const [saving, setSaving] = useState(false)

  function setField(field: keyof FormState, value: string | number | null) {
    setForm(prev => ({ ...prev, [field]: value === '' ? null : value }))
  }

  function startAdd() {
    setForm({ ...EMPTY, sort_order: entries.length })
    setEditingId(null)
    setAdding(true)
  }

  function startEdit(entry: ResumeExperience) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, resume_id, ...rest } = entry
    setForm(rest)
    setEditingId(id)
    setAdding(false)
  }

  async function handleSave() {
    setSaving(true)
    if (editingId) {
      const result = await updateExperience(editingId, form)
      setSaving(false)
      if (result.error) { toast.error(t('saveError')); return }
      setEntries(prev => prev.map(e => e.id === editingId ? { ...e, ...form } : e))
      setEditingId(null)
    } else {
      const result = await addExperience(form)
      setSaving(false)
      if (result.error) { toast.error(t('saveError')); return }
      if (result.entry) {
        const next = [...entries, result.entry]
        setEntries(next)
        onComplete(true)
      }
      setAdding(false)
    }
    setForm(EMPTY)
  }

  async function handleDelete(id: string) {
    const result = await deleteExperience(id)
    if (result.error) { toast.error(t('saveError')); return }
    const next = entries.filter(e => e.id !== id)
    setEntries(next)
    onComplete(next.length > 0)
  }

  const showForm = adding || editingId !== null

  return (
    <div className="flex flex-col gap-3 p-1">
      {entries.length === 0 && !showForm && (
        <p className="text-sm text-muted-foreground">{t('noEntries')}</p>
      )}
      {entries.map(entry => (
        editingId === entry.id ? null : (
          <Card key={entry.id}>
            <CardContent className="pt-4 flex items-start justify-between gap-2">
              <div className="text-sm min-w-0">
                <p className="font-medium truncate">{entry.position} — {entry.vessel_name}</p>
                <p className="text-muted-foreground">{entry.company}{entry.flag ? ` · ${entry.flag}` : ''}</p>
                <p className="text-muted-foreground text-xs">{entry.vessel_type}{entry.grt ? ` · ${entry.grt} ${t('grt')}` : ''}{entry.dwt ? ` · ${entry.dwt} ${t('dwt')}` : ''}</p>
                <p className="text-muted-foreground text-xs">{entry.started_at} — {entry.ended_at ?? t('current')}</p>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button variant="ghost" size="icon" onClick={() => startEdit(entry)} aria-label={t('edit')}><Pencil className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(entry.id)} aria-label={t('delete')}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </CardContent>
          </Card>
        )
      ))}
      {showForm && (
        <div className="border rounded-lg p-4 flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label={t('vesselName')}><Input value={form.vessel_name ?? ''} onChange={e => setField('vessel_name', e.target.value)} /></Field>
            <Field label={t('vesselType')}><Input value={form.vessel_type ?? ''} onChange={e => setField('vessel_type', e.target.value)} /></Field>
            <Field label={t('grt')}><Input type="number" value={form.grt ?? ''} onChange={e => setField('grt', e.target.value ? Number(e.target.value) : null)} /></Field>
            <Field label={t('dwt')}><Input type="number" value={form.dwt ?? ''} onChange={e => setField('dwt', e.target.value ? Number(e.target.value) : null)} /></Field>
            <Field label={t('flag')}><Input value={form.flag ?? ''} onChange={e => setField('flag', e.target.value)} /></Field>
            <Field label={t('company')}><Input value={form.company ?? ''} onChange={e => setField('company', e.target.value)} /></Field>
            <Field label={t('position')} className="col-span-2"><Input value={form.position ?? ''} onChange={e => setField('position', e.target.value)} /></Field>
            <Field label={t('startDate')}><Input type="date" value={form.started_at ?? ''} onChange={e => setField('started_at', e.target.value)} /></Field>
            <Field label={t('endDate')}><Input type="date" value={form.ended_at ?? ''} onChange={e => setField('ended_at', e.target.value)} /></Field>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave} disabled={saving}>{saving ? t('saving') : t('save')}</Button>
            <Button size="sm" variant="outline" onClick={() => { setAdding(false); setEditingId(null) }}>{t('cancel')}</Button>
          </div>
        </div>
      )}
      {!showForm && (
        <Button variant="outline" size="sm" className="w-fit" onClick={startAdd}>
          <Plus className="h-4 w-4 mr-2" />{t('addEntry')}
        </Button>
      )}
    </div>
  )
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`flex flex-col gap-1 ${className ?? ''}`}>
      <Label>{label}</Label>
      {children}
    </div>
  )
}
