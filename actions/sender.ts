'use server'

import Anthropic from '@anthropic-ai/sdk'
import { createElement, type ReactElement } from 'react'
import { renderToBuffer } from '@react-pdf/renderer'
import type { DocumentProps } from '@react-pdf/renderer'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { TemplateClassic } from '@/components/resume/pdf/template-classic'
import type { PdfResumeData } from '@/components/resume/pdf/types'
import type {
  Resume,
  ResumeExperience,
  ResumeCertificate,
  ResumeEducation,
  ResumeLanguage,
  ResumeSkill,
  ResumeReference,
  SendCampaign,
} from '@/lib/supabase/types'
import type { Database } from '@/lib/supabase/types'

function getServiceClient() {
  return createServiceClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function translateCoverLetter(
  text: string
): Promise<{ ok: boolean; text?: string; error?: string }> {
  if (!text.trim()) return { ok: false, error: 'empty' }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `You are an experienced maritime HR professional. Rewrite the following text as a professional cover letter in English for a crewing/shipping company. Use proper business letter structure: greeting, 2-3 body paragraphs, professional closing. Keep it concise and confident. Do not add fictional details not present in the original. Do not include a date or address block.\n\nOriginal text:\n${text}`,
      },
    ],
  })

  const result = message.content[0]
  if (result.type !== 'text') return { ok: false, error: 'api_error' }
  return { ok: true, text: result.text }
}

export async function launchCampaign(
  fleetType: string,
  coverLetter: string,
  excludedIds: string[]
): Promise<{ ok: boolean; campaignId?: string; error?: string; availableAt?: string }> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'unauthenticated' }

  // Check cooldown: last campaign for this fleet type within 7 days
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const { data: recent } = await supabase
    .from('send_campaigns')
    .select('created_at')
    .eq('user_id', user.id)
    .eq('fleet_type', fleetType)
    .gte('created_at', sevenDaysAgo)
    .order('created_at', { ascending: false })
    .limit(1)

  if (recent && recent.length > 0) {
    const availableAt = new Date(
      new Date(recent[0].created_at).getTime() + 7 * 24 * 60 * 60 * 1000
    ).toISOString()
    return { ok: false, error: 'cooldown', availableAt }
  }

  // Block launch if any campaign is already active (any fleet type)
  const { data: active } = await supabase
    .from('send_campaigns')
    .select('id')
    .eq('user_id', user.id)
    .in('status', ['pending', 'running'])
    .limit(1)

  if (active && active.length > 0) {
    return { ok: false, error: 'campaign_active' }
  }

  // Check resume exists
  const { data: resume } = await supabase
    .from('resumes')
    .select('id')
    .eq('user_id', user.id)
    .single()
  if (!resume) return { ok: false, error: 'no_resume' }

  // Fetch employers for this fleet type
  const { data: employers } = await supabase
    .from('employers')
    .select('id')
    .eq('fleet_type', fleetType)
    .eq('is_active', true)

  if (!employers || employers.length === 0) return { ok: false, error: 'no_employers' }

  const targetEmployers = employers.filter(e => !excludedIds.includes(e.id))
  if (targetEmployers.length === 0) return { ok: false, error: 'no_employers' }

  // Generate PDF once
  const [{ data: profile }, { data: resumeData }] = await Promise.all([
    supabase
      .from('profiles')
      .select('full_name, rank, fleet_type, subscription_status')
      .eq('id', user.id)
      .single(),
    supabase.from('resumes').select('*').eq('user_id', user.id).single(),
  ])

  if (!resumeData) return { ok: false, error: 'no_resume' }

  const [exp, certs, edu, langs, skills, refs] = await Promise.all([
    supabase.from('resume_experience').select('*').eq('resume_id', resumeData.id).order('sort_order'),
    supabase.from('resume_certificates').select('*').eq('resume_id', resumeData.id).order('sort_order'),
    supabase.from('resume_education').select('*').eq('resume_id', resumeData.id).order('sort_order'),
    supabase.from('resume_languages').select('*').eq('resume_id', resumeData.id).order('sort_order'),
    supabase.from('resume_skills').select('*').eq('resume_id', resumeData.id).order('sort_order'),
    supabase.from('resume_references').select('*').eq('resume_id', resumeData.id).order('sort_order'),
  ])

  const pdfData: PdfResumeData = {
    profile: {
      full_name: profile?.full_name ?? null,
      rank: profile?.rank ?? null,
      fleet_type: profile?.fleet_type ?? null,
    },
    resume: resumeData as Resume,
    experience: (exp.data ?? []) as ResumeExperience[],
    certificates: (certs.data ?? []) as ResumeCertificate[],
    education: (edu.data ?? []) as ResumeEducation[],
    languages: (langs.data ?? []) as ResumeLanguage[],
    skills: (skills.data ?? []) as ResumeSkill[],
    references: (refs.data ?? []) as ResumeReference[],
    watermark: false,
  }

  const element = createElement(TemplateClassic, { data: pdfData }) as ReactElement<DocumentProps>
  const buffer = await renderToBuffer(element)
  const resume_pdf_b64 = buffer.toString('base64')

  // Create campaign + jobs using service role (bypasses RLS for bulk insert)
  const service = getServiceClient()
  const { data: campaign, error: campaignError } = await service
    .from('send_campaigns')
    .insert({
      user_id: user.id,
      fleet_type: fleetType,
      cover_letter: coverLetter.trim() || null,
      resume_pdf_b64,
      status: 'pending',
      total_count: targetEmployers.length,
      sent_count: 0,
      failed_count: 0,
      completed_at: null,
    })
    .select('id')
    .single()

  if (campaignError || !campaign) return { ok: false, error: 'db_error' }

  const jobs = targetEmployers.map(e => ({
    campaign_id: campaign.id,
    employer_id: e.id,
    status: 'pending' as const,
    sent_at: null,
    error: null,
  }))

  // Insert jobs in batches
  for (let i = 0; i < jobs.length; i += 500) {
    const { error } = await service.from('send_jobs').insert(jobs.slice(i, i + 500))
    if (error) return { ok: false, error: 'db_error' }
  }

  return { ok: true, campaignId: campaign.id }
}

export async function getActiveCampaign(): Promise<SendCampaign | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('send_campaigns')
    .select('id, user_id, fleet_type, cover_letter, status, total_count, sent_count, failed_count, created_at, completed_at')
    .eq('user_id', user.id)
    .in('status', ['pending', 'running'])
    .order('created_at', { ascending: false })
    .limit(1)
    .returns<SendCampaign[]>()

  return data?.[0] ?? null
}
