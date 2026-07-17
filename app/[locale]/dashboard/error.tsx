'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  const router = useRouter()
  const params = useParams()
  const locale = (params?.locale as string) ?? 'en'

  return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <p className="text-muted-foreground text-sm">Something went wrong</p>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => router.push(`/${locale}/login`)}>
          Back to login
        </Button>
        <Button size="sm" onClick={reset}>
          Try again
        </Button>
      </div>
    </div>
  )
}
