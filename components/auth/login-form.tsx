'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { login } from '@/actions/auth'

export function LoginForm({ locale }: { locale: string }) {
  const t = useTranslations('auth')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const formData = new FormData(e.currentTarget)
    const result = await login(formData, locale)
    if (result?.error) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setError(t(result.error as any))
      setLoading(false)
    }
  }

  async function handleGoogle() {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/${locale}/auth/callback`,
      },
    })
  }

  return (
    <div className="flex flex-col gap-4 w-full max-w-sm mx-auto">
      <h1 className="text-2xl font-bold text-center">{t('loginTitle')}</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <Label htmlFor="email">{t('email')}</Label>
          <Input id="email" name="email" type="email" required />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="password">{t('password')}</Label>
          <Input id="password" name="password" type="password" required />
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <Button type="submit" disabled={loading}>
          {loading ? t('loading') : t('login')}
        </Button>
      </form>
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">{t('or')}</span>
        </div>
      </div>
      <Button variant="outline" onClick={handleGoogle}>
        {t('continueWithGoogle')}
      </Button>
      <p className="text-sm text-center text-muted-foreground">
        {t('noAccount')}{' '}
        <a href={`/${locale}/signup`} className="underline">{t('signupLink')}</a>
      </p>
    </div>
  )
}
