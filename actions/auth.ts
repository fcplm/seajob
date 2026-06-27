'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData, locale: string) {
  const supabase = createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  })
  if (error) return { error: 'invalidCredentials' }
  revalidatePath('/', 'layout')
  redirect(`/${locale}/dashboard`)
}

export async function signup(formData: FormData, locale: string) {
  const supabase = createClient()
  const { error } = await supabase.auth.signUp({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    options: {
      data: { full_name: formData.get('fullName') as string },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/${locale}/auth/callback`,
    },
  })
  if (error?.message?.includes('already registered')) return { error: 'emailInUse' }
  if (error) return { error: 'invalidCredentials' }
  return { success: 'checkEmail' }
}

export async function logout(locale: string) {
  const supabase = createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect(`/${locale}/login`)
}
