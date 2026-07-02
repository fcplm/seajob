import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getTranslations } from 'next-intl/server'
import type { Profile } from '@/lib/supabase/types'

export async function ProfileCard({ profile }: { profile: Profile }) {
  const t = await getTranslations('profile')

  const initials = (profile.full_name ?? 'U')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const fleetLabel = profile.fleet_type
    ? t(profile.fleet_type as Parameters<typeof t>[0])
    : '—'

  return (
    <div className="flex items-center gap-4">
      <Avatar className="h-16 w-16">
        <AvatarImage src={profile.photo_url ?? undefined} />
        <AvatarFallback className="text-lg">{initials}</AvatarFallback>
      </Avatar>
      <div>
        <p className="font-semibold text-lg">{profile.full_name ?? '—'}</p>
        <p className="text-muted-foreground text-sm capitalize">{profile.rank ?? '—'}</p>
        <p className="text-muted-foreground text-sm">{fleetLabel}</p>
      </div>
    </div>
  )
}
