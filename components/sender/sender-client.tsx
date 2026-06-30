'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { FleetFilter, type FleetType } from './fleet-filter'
import { CoverLetterField } from './cover-letter-field'
import { RecipientList } from './recipient-list'
import { CampaignProgress } from './campaign-progress'
import { Button } from '@/components/ui/button'
import { launchCampaign } from '@/actions/sender'
import { toast } from 'sonner'
import type { Employer, SendCampaign } from '@/lib/supabase/types'

type Props = {
  employers: Employer[]
  activeCampaign: SendCampaign | null
  locale: string
}

export function SenderClient({ employers, activeCampaign }: Props) {
  const t = useTranslations('sender')
  const [fleet, setFleet] = useState<FleetType>('merchant')
  const [coverLetter, setCoverLetter] = useState('')
  const [excluded, setExcluded] = useState<Set<string>>(new Set())
  const [isPending, startTransition] = useTransition()

  const fleetEmployers = employers.filter(e => e.fleet_type === fleet)

  function toggleExclude(id: string) {
    setExcluded(prev => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id) } else { next.add(id) }
      return next
    })
  }

  function handleFleetChange(f: FleetType) {
    setFleet(f)
    setExcluded(new Set())
  }

  function handleLaunch() {
    startTransition(async () => {
      const res = await launchCampaign(fleet, coverLetter, Array.from(excluded))
      if (res.ok) {
        toast.success(t('launching'))
        window.location.reload()
      } else if (res.error === 'cooldown' && res.availableAt) {
        const days = Math.ceil(
          (new Date(res.availableAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        )
        toast.error(t('cooldown', { days }))
      } else {
        toast.error(t('error'))
      }
    })
  }

  if (activeCampaign && (activeCampaign.status === 'running' || activeCampaign.status === 'pending')) {
    return <CampaignProgress campaign={activeCampaign} />
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm font-medium" style={{ color: '#1a2540' }}>
          {t('selectFleet')}
        </p>
        <FleetFilter value={fleet} onChange={handleFleetChange} />
      </div>

      <CoverLetterField value={coverLetter} onChange={setCoverLetter} />

      <RecipientList
        employers={fleetEmployers}
        excluded={excluded}
        onToggle={toggleExclude}
      />

      <Button
        onClick={handleLaunch}
        disabled={isPending || fleetEmployers.length === excluded.size}
        className="w-full text-white"
        style={{ background: '#0c2461' }}
      >
        {isPending ? t('launching') : t('launch')}
      </Button>
    </div>
  )
}
