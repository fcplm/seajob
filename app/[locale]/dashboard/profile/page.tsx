'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { updateProfile } from '@/actions/auth'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/lib/supabase/types'

export default function ProfilePage() {
  const t = useTranslations('profile')
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase.from('profiles').select('*').eq('id', user.id).single()
        .then(({ data, error }) => {
          if (error) toast.error(error.message)
          else setProfile(data as Profile | null)
        })
    })
  }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    const result = await updateProfile(formData)
    setLoading(false)
    if (result?.error) toast.error(t('saveError'))
    else toast.success(t('saved'))
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold mb-6">{t('title')}</h1>
      <form key={profile?.id ?? 'empty'} onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <Label htmlFor="full_name">{t('fullName')}</Label>
          <Input id="full_name" name="full_name" defaultValue={profile?.full_name ?? ''} />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="rank">{t('rank')}</Label>
          <Input id="rank" name="rank" defaultValue={profile?.rank ?? ''} />
        </div>
        <div className="flex flex-col gap-1">
          <Label>{t('fleetType')}</Label>
          <Select name="fleet_type" defaultValue={profile?.fleet_type ?? ''}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="merchant">{t('merchant')}</SelectItem>
              <SelectItem value="tanker">{t('tanker')}</SelectItem>
              <SelectItem value="offshore">{t('offshore')}</SelectItem>
              <SelectItem value="cruise">{t('cruise')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="phone">{t('phone')}</Label>
          <Input id="phone" name="phone" type="tel" defaultValue={profile?.phone ?? ''} />
        </div>
        <Button type="submit" disabled={loading} className="w-fit">
          {loading ? t('saving') : t('save')}
        </Button>
      </form>
    </div>
  )
}
