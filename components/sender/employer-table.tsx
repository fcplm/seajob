'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { addEmployer, importEmployersCsv, toggleEmployerActive } from '@/actions/employers'
import type { Employer } from '@/lib/supabase/types'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'

const FLEET_TYPES = ['merchant', 'tanker', 'offshore', 'bulk', 'cruise'] as const

type Props = {
  employers: Employer[]
}

export function EmployerTable({ employers }: Props) {
  const t = useTranslations('sender')
  const [filter, setFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const visible = employers.filter(e => {
    if (filter !== 'all' && e.fleet_type !== filter) return false
    if (
      search &&
      !e.email.includes(search.toLowerCase()) &&
      !(e.company ?? '').toLowerCase().includes(search.toLowerCase())
    ) return false
    return true
  })

  function handleAdd(formData: FormData) {
    startTransition(async () => {
      const res = await addEmployer(formData)
      if (res.ok) { toast.success(t('added')); setDialogOpen(false) }
      else toast.error(t('error'))
    })
  }

  function handleCsvImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const fd = new FormData()
    fd.append('file', file)
    startTransition(async () => {
      const res = await importEmployersCsv(fd)
      if (res.ok) toast.success(t('imported', { count: res.imported }))
      else toast.error(t('importFailed'))
    })
  }

  function handleToggle(id: string, active: boolean) {
    startTransition(async () => { await toggleEmployerActive(id, active) })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div className="flex gap-2">
          <Input
            placeholder={t('search')}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-48"
          />
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('filterAll')}</SelectItem>
              {FLEET_TYPES.map(f => (
                <SelectItem key={f} value={f}>
                  {t(`filter${f.charAt(0).toUpperCase() + f.slice(1)}` as 'filterMerchant')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <label className="cursor-pointer">
            <Button variant="outline" size="sm" asChild>
              <span>{t('importCsv')}</span>
            </Button>
            <input type="file" accept=".csv" className="hidden" onChange={handleCsvImport} />
          </label>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">{t('addEmployer')}</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('addEmployer')}</DialogTitle>
              </DialogHeader>
              <form action={handleAdd} className="space-y-3">
                <Input name="company" placeholder={t('colCompany')} />
                <Input name="email" type="email" placeholder={t('colEmail')} required />
                <Select name="fleet_type" required>
                  <SelectTrigger>
                    <SelectValue placeholder={t('colFleet')} />
                  </SelectTrigger>
                  <SelectContent>
                    {FLEET_TYPES.map(f => (
                      <SelectItem key={f} value={f}>{t(`filter${f.charAt(0).toUpperCase() + f.slice(1)}` as 'filterMerchant')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button type="submit" disabled={isPending} className="w-full">
                  {t('addEmployer')}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">{t('totalCount', { count: visible.length })}</p>

      <div className="rounded-lg border overflow-auto max-h-[60vh]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('colCompany')}</TableHead>
              <TableHead>{t('colEmail')}</TableHead>
              <TableHead>{t('colFleet')}</TableHead>
              <TableHead className="w-16">{t('colActive')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map(e => (
              <TableRow key={e.id}>
                <TableCell className="text-sm">{e.company ?? '—'}</TableCell>
                <TableCell className="text-sm font-mono">{e.email}</TableCell>
                <TableCell className="text-sm capitalize">{e.fleet_type}</TableCell>
                <TableCell>
                  <Switch
                    checked={e.is_active}
                    onCheckedChange={v => handleToggle(e.id, v)}
                    disabled={isPending}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
