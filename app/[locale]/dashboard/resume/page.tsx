import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
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

  const t = await getTranslations('resume')

  const { data: rawProfile } = await supabase
    .from('profiles')
    .select('subscription_status')
    .eq('id', user.id)
    .single()

  const subscriptionStatus = (rawProfile?.subscription_status ?? 'free') as 'free' | 'pro' | 'enterprise'

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
    <div>
      <h1 className="text-2xl font-bold mb-6">{t('title')}</h1>
      <ResumeEditor data={resumeData} subscriptionStatus={subscriptionStatus} />
    </div>
  )
}
