'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import type { Employer } from '@/lib/supabase/types'

type Props = {
  employers: Employer[]
  excluded: Set<string>
  onToggle: (id: string) => void
}

export function RecipientList({ employers, excluded, onToggle }: Props) {
  const t = useTranslations('sender')
  const [expanded, setExpanded] = useState(false)

  const included = employers.length - excluded.size

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium" style={{ color: '#1a2540' }}>
          {t('recipients', { count: included })}
        </span>
        <Button variant="ghost" size="sm" onClick={() => setExpanded(v => !v)}>
          {expanded ? t('hideList') : t('showList')}
        </Button>
      </div>

      {expanded && (
        <div
          className="rounded-lg border overflow-y-auto max-h-64 divide-y"
          style={{ borderColor: '#b8cce0' }}
        >
          {employers.map(e => (
            <label
              key={e.id}
              className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-[#dce6f4] transition-colors"
            >
              <input
                type="checkbox"
                checked={!excluded.has(e.id)}
                onChange={() => onToggle(e.id)}
                className="w-4 h-4 accent-[#0c2461] cursor-pointer flex-shrink-0"
              />
              <span className="text-sm font-mono flex-1 truncate">{e.email}</span>
              {e.company && (
                <span className="text-xs text-muted-foreground truncate max-w-[120px]">
                  {e.company}
                </span>
              )}
            </label>
          ))}
        </div>
      )}
    </div>
  )
}
