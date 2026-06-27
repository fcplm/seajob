'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { signup } from '@/actions/auth'

export function SignupForm({ locale }: { locale: string }) {
  const t = useTranslations('auth')
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    const formData = new FormData(e.currentTarget)
    const result = await signup(formData, locale)
    setLoading(false)
    if (result?.error) setMessage({ type: 'error', text: t(result.error as any) })
    if (result?.success) setMessage({ type: 'success', text: t(result.success as any) })
  }

  async function handleGoogle() {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/${locale}/auth/callback` },
    })
  }

  return (
    <div className="flex flex-col gap-4 w-full max-w-sm mx-auto">
      <h1 className="text-2xl font-bold text-center">{t('signupTitle')}</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <Label htmlFor="fullName">{t('fullName')}</Label>
          <Input id="fullName" name="fullName" required />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="email">{t('email')}</Label>
          <Input id="email" name="email" type="email" required />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="password">{t('password')}</Label>
          <Input id="password" name="password" type="password" minLength={6} required />
        </div>
        {message && (
          <p className={`text-sm ${message.type === 'error' ? 'text-red-500' : 'text-green-600'}`}>
            {message.text}
          </p>
        )}
        <Button type="submit" disabled={loading}>
          {loading ? '...' : t('signup')}
        </Button>
      </form>
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">or</span>
        </div>
      </div>
      <Button variant="outline" onClick={handleGoogle}>
        {t('continueWithGoogle')}
      </Button>
      <p className="text-sm text-center text-muted-foreground">
        {t('hasAccount')}{' '}
        <a href={`/${locale}/login`} className="underline">{t('loginLink')}</a>
      </p>
    </div>
  )
}
