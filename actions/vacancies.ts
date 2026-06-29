'use server'

import { createElement, type ReactElement } from 'react'
import { renderToBuffer } from '@react-pdf/renderer'
import type { DocumentProps } from '@react-pdf/renderer'
import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'
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
} from '@/lib/supabase/types'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function applyToVacancy(
  vacancyId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = createClient()

  // 1. Verify authentication
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'unauthenticated' }

  // 2. Fetch vacancy
  const { data: vacancy } = await supabase
    .from('vacancies')
    .select('contact_email, rank, company')
    .eq('id', vacancyId)
    .single()

  if (!vacancy?.contact_email) {
    return { ok: false, error: 'no_email' }
  }

  // 3. Fetch profile and resume in parallel
  const [{ data: profile }, { data: resume }] = await Promise.all([
    supabase
      .from('profiles')
      .select('full_name, rank, fleet_type, subscription_status')
      .eq('id', user.id)
      .single(),
    supabase.from('resumes').select('*').eq('user_id', user.id).single(),
  ])

  if (!resume) return { ok: false, error: 'no_resume' }

  // 4. Fetch resume sections in parallel
  const [exp, certs, edu, langs, skills, refs] = await Promise.all([
    supabase.from('resume_experience').select('*').eq('resume_id', resume.id).order('sort_order'),
    supabase.from('resume_certificates').select('*').eq('resume_id', resume.id).order('sort_order'),
    supabase.from('resume_education').select('*').eq('resume_id', resume.id).order('sort_order'),
    supabase.from('resume_languages').select('*').eq('resume_id', resume.id).order('sort_order'),
    supabase.from('resume_skills').select('*').eq('resume_id', resume.id).order('sort_order'),
    supabase.from('resume_references').select('*').eq('resume_id', resume.id).order('sort_order'),
  ])

  // 5. Generate PDF
  const pdfData: PdfResumeData = {
    profile: {
      full_name: profile?.full_name ?? null,
      rank: profile?.rank ?? null,
      fleet_type: profile?.fleet_type ?? null,
    },
    resume: resume as Resume,
    experience: (exp.data ?? []) as ResumeExperience[],
    certificates: (certs.data ?? []) as ResumeCertificate[],
    education: (edu.data ?? []) as ResumeEducation[],
    languages: (langs.data ?? []) as ResumeLanguage[],
    skills: (skills.data ?? []) as ResumeSkill[],
    references: (refs.data ?? []) as ResumeReference[],
    watermark: false,
  }

  const element = createElement(TemplateClassic, {
    data: pdfData,
  }) as ReactElement<DocumentProps>
  const buffer = await renderToBuffer(element)

  // 6. Send email via Resend
  const fullName = profile?.full_name ?? 'Seafarer'
  const rank = vacancy.rank ?? 'Seafarer'
  const subject = `Application — ${rank}, ${fullName}`

  const { error: sendError } = await resend.emails.send({
    from: 'noreply@resend.dev',
    to: vacancy.contact_email,
    subject,
    text: 'Please find attached my resume. Sent via SeaJob.',
    attachments: [
      {
        filename: 'resume.pdf',
        content: Buffer.from(buffer),
      },
    ],
  })

  if (sendError) {
    console.error('Resend error:', sendError)
    return { ok: false, error: 'send_failed' }
  }

  return { ok: true }
}
