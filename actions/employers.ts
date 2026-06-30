'use server'

import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/admin'
import { revalidatePath } from 'next/cache'
import type { Database } from '@/lib/supabase/types'

function getServiceClient() {
  return createServiceClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function requireAdmin() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!isAdmin(user?.email)) throw new Error('Forbidden')
  return user!
}

export async function addEmployer(
  formData: FormData
): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireAdmin()
  } catch {
    return { ok: false, error: 'forbidden' }
  }

  const company = (formData.get('company') as string | null)?.trim() || null
  const email = (formData.get('email') as string)?.trim().toLowerCase()
  const fleet_type = formData.get('fleet_type') as string

  if (!email?.includes('@')) return { ok: false, error: 'invalid_email' }
  if (!fleet_type) return { ok: false, error: 'missing_fleet_type' }

  const { error } = await getServiceClient()
    .from('employers')
    .upsert({ company, email, fleet_type, is_active: true }, { onConflict: 'email' })

  if (error) return { ok: false, error: error.message }
  revalidatePath('/[locale]/dashboard/sender/employers', 'page')
  return { ok: true }
}

export async function importEmployersCsv(
  formData: FormData
): Promise<{ ok: boolean; imported: number; error?: string }> {
  try {
    await requireAdmin()
  } catch {
    return { ok: false, imported: 0, error: 'forbidden' }
  }

  const file = formData.get('file') as File | null
  if (!file) return { ok: false, imported: 0, error: 'no_file' }

  const text = await file.text()
  const lines = text.trim().split('\n').slice(1)

  const rows = lines
    .map(line => {
      const firstComma = line.indexOf(',')
      const secondComma = line.indexOf(',', firstComma + 1)
      const company = line.slice(0, firstComma).trim() || null
      const email = line.slice(firstComma + 1, secondComma).trim().toLowerCase()
      const fleet_type = line.slice(secondComma + 1).trim()
      return { company, email, fleet_type, is_active: true }
    })
    .filter(r => r.email.includes('@') && r.fleet_type)

  if (rows.length === 0) return { ok: false, imported: 0, error: 'empty_file' }

  const service = getServiceClient()
  let imported = 0
  for (let i = 0; i < rows.length; i += 500) {
    const batch = rows.slice(i, i + 500)
    const { error } = await service
      .from('employers')
      .upsert(batch, { onConflict: 'email', ignoreDuplicates: false })
    if (error) return { ok: false, imported, error: error.message }
    imported += batch.length
  }

  revalidatePath('/[locale]/dashboard/sender/employers', 'page')
  return { ok: true, imported }
}

export async function toggleEmployerActive(
  id: string,
  active: boolean
): Promise<{ ok: boolean }> {
  try {
    await requireAdmin()
  } catch {
    return { ok: false }
  }

  const { error } = await getServiceClient()
    .from('employers')
    .update({ is_active: active })
    .eq('id', id)

  if (error) return { ok: false }
  revalidatePath('/[locale]/dashboard/sender/employers', 'page')
  return { ok: true }
}
