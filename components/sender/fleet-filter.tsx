'use client'

import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'

const FLEET_TYPES = ['merchant', 'tanker', 'offshore', 'bulk', 'cruise'] as const
export type FleetType = typeof FLEET_TYPES[number]

type Props = {
  value: FleetType
  onChange: (v: FleetType) => void
}

export function FleetFilter({ value, onChange }: Props) {
  const t = useTranslations('sender')

  const labelKey = (f: FleetType) =>
    `filter${f.charAt(0).toUpperCase() + f.slice(1)}` as
      | 'filterMerchant'
      | 'filterTanker'
      | 'filterOffshore'
      | 'filterBulk'
      | 'filterCruise'

  return (
    <div className="flex flex-wrap gap-2">
      {FLEET_TYPES.map(f => (
        <button
          key={f}
          onClick={() => onChange(f)}
          className={cn(
            'px-4 py-1.5 rounded-full text-sm font-medium border transition-colors',
            value === f
              ? 'text-white border-transparent'
              : 'border-[#b8cce0] text-[#0c2461] bg-white hover:bg-[#dce6f4]'
          )}
          style={value === f ? { background: '#0c2461', borderColor: '#0c2461' } : {}}
        >
          {t(labelKey(f))}
        </button>
      ))}
    </div>
  )
}
