import type {
  Resume,
  ResumeExperience,
  ResumeCertificate,
  ResumeEducation,
  ResumeLanguage,
  ResumeSkill,
  ResumeReference,
} from '@/lib/supabase/types'

export type PdfResumeData = {
  profile: {
    full_name: string | null
    rank: string | null
    fleet_type: string | null
    phone: string | null
    email: string | null
  }
  resume: Resume
  experience: ResumeExperience[]
  certificates: ResumeCertificate[]
  education: ResumeEducation[]
  languages: ResumeLanguage[]
  skills: ResumeSkill[]
  references: ResumeReference[]
  watermark: boolean
}
