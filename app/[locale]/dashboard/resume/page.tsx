import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ResumeEditor } from '@/components/resume/resume-editor'
import type {
  Resume,
  ResumeData,
  ResumeExperience,
  ResumeCertificate,
  ResumeEducation,
  ResumeLanguage,
  ResumeSkill,
  ResumeReference,
} from '@/lib/supabase/types'

export default async function ResumePage({ params: { locale } }: { params: { locale: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/login`)

  const { data: rawProfile } = await supabase
    .from('profiles')
    .select('subscription_status, full_name, rank, fleet_type, phone')
    .eq('id', user.id)
    .single()

  const subscriptionStatus = (rawProfile?.subscription_status ?? 'free') as 'free' | 'pro' | 'enterprise'
  const profile = {
    full_name: rawProfile?.full_name ?? null,
    rank: rawProfile?.rank ?? null,
    fleet_type: rawProfile?.fleet_type ?? null,
    phone: rawProfile?.phone ?? null,
    email: user.email ?? null,
  }

  const { data: resume } = await supabase
    .from('resumes')
    .select('*')
    .eq('user_id', user.id)
    .single()

  let resumeData: ResumeData = {
    resume: resume as Resume | null,
    experience: [],
    certificates: [],
    education: [],
    languages: [],
    skills: [],
    references: [],
  }

  if (resume) {
    const [exp, certs, edu, langs, skills, refs] = await Promise.all([
      supabase.from('resume_experience').select('*').eq('resume_id', resume.id).order('sort_order'),
      supabase.from('resume_certificates').select('*').eq('resume_id', resume.id).order('sort_order'),
      supabase.from('resume_education').select('*').eq('resume_id', resume.id).order('sort_order'),
      supabase.from('resume_languages').select('*').eq('resume_id', resume.id).order('sort_order'),
      supabase.from('resume_skills').select('*').eq('resume_id', resume.id).order('sort_order'),
      supabase.from('resume_references').select('*').eq('resume_id', resume.id).order('sort_order'),
    ])
    resumeData = {
      resume: resume as Resume,
      experience: (exp.data ?? []) as ResumeExperience[],
      certificates: (certs.data ?? []) as ResumeCertificate[],
      education: (edu.data ?? []) as ResumeEducation[],
      languages: (langs.data ?? []) as ResumeLanguage[],
      skills: (skills.data ?? []) as ResumeSkill[],
      references: (refs.data ?? []) as ResumeReference[],
    }
  }

  return (
    <ResumeEditor data={resumeData} profile={profile} subscriptionStatus={subscriptionStatus} />
  )
}
