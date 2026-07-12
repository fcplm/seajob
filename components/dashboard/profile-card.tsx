import type { Profile } from '@/lib/supabase/types'

export function ProfileCard({ profile, fleetLabel }: { profile: Profile; fleetLabel: string }) {
  const initials = (profile.full_name ?? 'U')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="flex items-center gap-4">
      <div
        className="h-16 w-16 rounded-full flex items-center justify-center text-lg font-semibold text-white flex-shrink-0 overflow-hidden"
        style={{ background: '#0c2461' }}
      >
        {profile.photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.photo_url}
            alt={profile.full_name ?? ''}
            className="h-full w-full object-cover"
          />
        ) : (
          <span>{initials}</span>
        )}
      </div>
      <div>
        <p className="font-semibold text-lg">{profile.full_name ?? '—'}</p>
        <p className="text-muted-foreground text-sm capitalize">{profile.rank ?? '—'}</p>
        <p className="text-muted-foreground text-sm">{fleetLabel}</p>
      </div>
    </div>
  )
}
