import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { createElement, type ReactElement } from 'react'
import type { DocumentProps } from '@react-pdf/renderer'
import { TemplateClassic } from '@/components/resume/pdf/template-classic'
import { TemplateModern } from '@/components/resume/pdf/template-modern'
import { TemplateCompact } from '@/components/resume/pdf/template-compact'
import type {
  Resume,
  ResumeExperience,
  ResumeCertificate,
  ResumeEducation,
  ResumeLanguage,
  ResumeSkill,
  ResumeReference,
} from '@/lib/supabase/types'
import type { PdfResumeData } from '@/components/resume/pdf/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const template = request.nextUrl.searchParams.get('template') ?? 'classic'

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })

  const [{ data: profile }, { data: resume }] = await Promise.all([
    supabase.from('profiles').select('full_name, rank, fleet_type, subscription_status').eq('id', user.id).single(),
    supabase.from('resumes').select('*').eq('user_id', user.id).single(),
  ])

  if (!resume) return NextResponse.json({ error: 'no_resume' }, { status: 400 })

  const isPro = profile?.subscription_status !== 'free'
  if (!isPro && template !== 'classic') {
    return NextResponse.json({ error: 'pro_required' }, { status: 403 })
  }

  const [exp, certs, edu, langs, skills, refs] = await Promise.all([
    supabase.from('resume_experience').select('*').eq('resume_id', resume.id).order('sort_order'),
    supabase.from('resume_certificates').select('*').eq('resume_id', resume.id).order('sort_order'),
    supabase.from('resume_education').select('*').eq('resume_id', resume.id).order('sort_order'),
    supabase.from('resume_languages').select('*').eq('resume_id', resume.id).order('sort_order'),
    supabase.from('resume_skills').select('*').eq('resume_id', resume.id).order('sort_order'),
    supabase.from('resume_references').select('*').eq('resume_id', resume.id).order('sort_order'),
  ])

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
    watermark: !isPro,
  }

  const TemplateComponent =
    template === 'modern' ? TemplateModern :
    template === 'compact' ? TemplateCompact :
    TemplateClassic

  const element = createElement(TemplateComponent, { data: pdfData }) as ReactElement<DocumentProps>
  const buffer = await renderToBuffer(element)

  const fullName = (profile?.full_name ?? 'seafarer').toLowerCase().replace(/\s+/g, '-')
  const month = new Date().toISOString().slice(0, 7)
  const filename = `seajob-cv-${fullName}-${month}.pdf`

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
