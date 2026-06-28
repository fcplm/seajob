'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type {
  ResumeExperience,
  ResumeCertificate,
  ResumeEducation,
  ResumeLanguage,
  ResumeSkill,
  ResumeReference,
} from '@/lib/supabase/types'

type Client = ReturnType<typeof createClient>

async function ensureResume(supabase: Client, userId: string): Promise<string | null> {
  const { error } = await supabase
    .from('resumes')
    .upsert({ user_id: userId }, { onConflict: 'user_id', ignoreDuplicates: true })
  if (error) return null
  const { data } = await supabase
    .from('resumes')
    .select('id')
    .eq('user_id', userId)
    .single()
  return data?.id ?? null
}

export async function upsertResumeMeta(payload: {
  bio?: string | null
  availability_date?: string | null
  contract_duration?: string | null
  salary_expectation?: string | null
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthenticated' }
  const resumeId = await ensureResume(supabase, user.id)
  if (!resumeId) return { error: 'resume_create_failed' }
  const { error } = await supabase
    .from('resumes')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', resumeId)
  if (error) return { error: error.message }
  revalidatePath('/', 'layout')
  return { success: true }
}

export async function updateResumeTemplate(template: 'classic' | 'modern' | 'compact') {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthenticated' }
  const resumeId = await ensureResume(supabase, user.id)
  if (!resumeId) return { error: 'resume_create_failed' }
  const { error } = await supabase
    .from('resumes')
    .update({ template, updated_at: new Date().toISOString() })
    .eq('id', resumeId)
  if (error) return { error: error.message }
  revalidatePath('/', 'layout')
  return { success: true }
}

export async function addExperience(data: Omit<ResumeExperience, 'id' | 'resume_id'>) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthenticated', entry: null }
  const resumeId = await ensureResume(supabase, user.id)
  if (!resumeId) return { error: 'resume_create_failed', entry: null }
  const { data: entry, error } = await supabase
    .from('resume_experience')
    .insert({ ...data, resume_id: resumeId })
    .select()
    .single()
  if (error) return { error: error.message, entry: null }
  revalidatePath('/', 'layout')
  return { error: null, entry: entry as ResumeExperience }
}

export async function updateExperience(id: string, data: Omit<ResumeExperience, 'id' | 'resume_id'>) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthenticated' }
  const resumeId = await ensureResume(supabase, user.id)
  if (!resumeId) return { error: 'resume_not_found' }
  const { error } = await supabase.from('resume_experience').update(data).eq('id', id).eq('resume_id', resumeId)
  if (error) return { error: error.message }
  revalidatePath('/', 'layout')
  return { success: true }
}

export async function deleteExperience(id: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthenticated' }
  const resumeId = await ensureResume(supabase, user.id)
  if (!resumeId) return { error: 'resume_not_found' }
  const { error } = await supabase.from('resume_experience').delete().eq('id', id).eq('resume_id', resumeId)
  if (error) return { error: error.message }
  revalidatePath('/', 'layout')
  return { success: true }
}

export async function addCertificate(data: Omit<ResumeCertificate, 'id' | 'resume_id'>) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthenticated', entry: null }
  const resumeId = await ensureResume(supabase, user.id)
  if (!resumeId) return { error: 'resume_create_failed', entry: null }
  const { data: entry, error } = await supabase
    .from('resume_certificates')
    .insert({ ...data, resume_id: resumeId })
    .select()
    .single()
  if (error) return { error: error.message, entry: null }
  revalidatePath('/', 'layout')
  return { error: null, entry: entry as ResumeCertificate }
}

export async function updateCertificate(id: string, data: Omit<ResumeCertificate, 'id' | 'resume_id'>) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthenticated' }
  const resumeId = await ensureResume(supabase, user.id)
  if (!resumeId) return { error: 'resume_not_found' }
  const { error } = await supabase.from('resume_certificates').update(data).eq('id', id).eq('resume_id', resumeId)
  if (error) return { error: error.message }
  revalidatePath('/', 'layout')
  return { success: true }
}

export async function deleteCertificate(id: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthenticated' }
  const resumeId = await ensureResume(supabase, user.id)
  if (!resumeId) return { error: 'resume_not_found' }
  const { error } = await supabase.from('resume_certificates').delete().eq('id', id).eq('resume_id', resumeId)
  if (error) return { error: error.message }
  revalidatePath('/', 'layout')
  return { success: true }
}

export async function addEducation(data: Omit<ResumeEducation, 'id' | 'resume_id'>) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthenticated', entry: null }
  const resumeId = await ensureResume(supabase, user.id)
  if (!resumeId) return { error: 'resume_create_failed', entry: null }
  const { data: entry, error } = await supabase
    .from('resume_education')
    .insert({ ...data, resume_id: resumeId })
    .select()
    .single()
  if (error) return { error: error.message, entry: null }
  revalidatePath('/', 'layout')
  return { error: null, entry: entry as ResumeEducation }
}

export async function updateEducation(id: string, data: Omit<ResumeEducation, 'id' | 'resume_id'>) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthenticated' }
  const resumeId = await ensureResume(supabase, user.id)
  if (!resumeId) return { error: 'resume_not_found' }
  const { error } = await supabase.from('resume_education').update(data).eq('id', id).eq('resume_id', resumeId)
  if (error) return { error: error.message }
  revalidatePath('/', 'layout')
  return { success: true }
}

export async function deleteEducation(id: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthenticated' }
  const resumeId = await ensureResume(supabase, user.id)
  if (!resumeId) return { error: 'resume_not_found' }
  const { error } = await supabase.from('resume_education').delete().eq('id', id).eq('resume_id', resumeId)
  if (error) return { error: error.message }
  revalidatePath('/', 'layout')
  return { success: true }
}

export async function addLanguage(data: Omit<ResumeLanguage, 'id' | 'resume_id'>) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthenticated', entry: null }
  const resumeId = await ensureResume(supabase, user.id)
  if (!resumeId) return { error: 'resume_create_failed', entry: null }
  const { data: entry, error } = await supabase
    .from('resume_languages')
    .insert({ ...data, resume_id: resumeId })
    .select()
    .single()
  if (error) return { error: error.message, entry: null }
  revalidatePath('/', 'layout')
  return { error: null, entry: entry as ResumeLanguage }
}

export async function updateLanguage(id: string, data: Omit<ResumeLanguage, 'id' | 'resume_id'>) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthenticated' }
  const resumeId = await ensureResume(supabase, user.id)
  if (!resumeId) return { error: 'resume_not_found' }
  const { error } = await supabase.from('resume_languages').update(data).eq('id', id).eq('resume_id', resumeId)
  if (error) return { error: error.message }
  revalidatePath('/', 'layout')
  return { success: true }
}

export async function deleteLanguage(id: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthenticated' }
  const resumeId = await ensureResume(supabase, user.id)
  if (!resumeId) return { error: 'resume_not_found' }
  const { error } = await supabase.from('resume_languages').delete().eq('id', id).eq('resume_id', resumeId)
  if (error) return { error: error.message }
  revalidatePath('/', 'layout')
  return { success: true }
}

export async function addSkill(data: Omit<ResumeSkill, 'id' | 'resume_id'>) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthenticated', entry: null }
  const resumeId = await ensureResume(supabase, user.id)
  if (!resumeId) return { error: 'resume_create_failed', entry: null }
  const { data: entry, error } = await supabase
    .from('resume_skills')
    .insert({ ...data, resume_id: resumeId })
    .select()
    .single()
  if (error) return { error: error.message, entry: null }
  revalidatePath('/', 'layout')
  return { error: null, entry: entry as ResumeSkill }
}

export async function updateSkill(id: string, data: Omit<ResumeSkill, 'id' | 'resume_id'>) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthenticated' }
  const resumeId = await ensureResume(supabase, user.id)
  if (!resumeId) return { error: 'resume_not_found' }
  const { error } = await supabase.from('resume_skills').update(data).eq('id', id).eq('resume_id', resumeId)
  if (error) return { error: error.message }
  revalidatePath('/', 'layout')
  return { success: true }
}

export async function deleteSkill(id: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthenticated' }
  const resumeId = await ensureResume(supabase, user.id)
  if (!resumeId) return { error: 'resume_not_found' }
  const { error } = await supabase.from('resume_skills').delete().eq('id', id).eq('resume_id', resumeId)
  if (error) return { error: error.message }
  revalidatePath('/', 'layout')
  return { success: true }
}

export async function addReference(data: Omit<ResumeReference, 'id' | 'resume_id'>) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthenticated', entry: null }
  const resumeId = await ensureResume(supabase, user.id)
  if (!resumeId) return { error: 'resume_create_failed', entry: null }
  const { data: entry, error } = await supabase
    .from('resume_references')
    .insert({ ...data, resume_id: resumeId })
    .select()
    .single()
  if (error) return { error: error.message, entry: null }
  revalidatePath('/', 'layout')
  return { error: null, entry: entry as ResumeReference }
}

export async function updateReference(id: string, data: Omit<ResumeReference, 'id' | 'resume_id'>) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthenticated' }
  const resumeId = await ensureResume(supabase, user.id)
  if (!resumeId) return { error: 'resume_not_found' }
  const { error } = await supabase.from('resume_references').update(data).eq('id', id).eq('resume_id', resumeId)
  if (error) return { error: error.message }
  revalidatePath('/', 'layout')
  return { success: true }
}

export async function deleteReference(id: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthenticated' }
  const resumeId = await ensureResume(supabase, user.id)
  if (!resumeId) return { error: 'resume_not_found' }
  const { error } = await supabase.from('resume_references').delete().eq('id', id).eq('resume_id', resumeId)
  if (error) return { error: error.message }
  revalidatePath('/', 'layout')
  return { success: true }
}
