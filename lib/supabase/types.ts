export type Profile = {
  id: string
  full_name: string | null
  rank: string | null
  fleet_type: 'merchant' | 'tanker' | 'offshore' | 'cruise' | null
  phone: string | null
  photo_url: string | null
  subscription_status: 'free' | 'pro' | 'enterprise'
  created_at: string
}

export type Resume = {
  id: string
  user_id: string
  bio: string | null
  availability_date: string | null
  contract_duration: string | null
  salary_expectation: string | null
  template: 'classic' | 'modern' | 'compact'
  created_at: string
  updated_at: string
}

export type ResumeExperience = {
  id: string
  resume_id: string
  vessel_name: string | null
  vessel_type: string | null
  grt: number | null
  dwt: number | null
  flag: string | null
  company: string | null
  position: string | null
  started_at: string | null
  ended_at: string | null
  sort_order: number
}

export type ResumeCertificate = {
  id: string
  resume_id: string
  name: string | null
  issued_by: string | null
  issued_at: string | null
  expires_at: string | null
  sort_order: number
}

export type ResumeEducation = {
  id: string
  resume_id: string
  institution: string | null
  degree: string | null
  field: string | null
  started_at: string | null
  ended_at: string | null
  sort_order: number
}

export type ResumeLanguage = {
  id: string
  resume_id: string
  language: string | null
  level: string | null
  sort_order: number
}

export type ResumeSkill = {
  id: string
  resume_id: string
  name: string | null
  sort_order: number
}

export type ResumeReference = {
  id: string
  resume_id: string
  full_name: string | null
  position: string | null
  company: string | null
  email: string | null
  phone: string | null
  sort_order: number
}

export type ResumeData = {
  resume: Resume | null
  experience: ResumeExperience[]
  certificates: ResumeCertificate[]
  education: ResumeEducation[]
  languages: ResumeLanguage[]
  skills: ResumeSkill[]
  references: ResumeReference[]
}

export type Vacancy = {
  id: string
  external_id: string
  source: string
  rank: string | null
  company: string | null
  vessel_type: string | null
  salary: string | null
  description: string | null
  contact_email: string | null
  url: string | null
  posted_at: string | null
  is_urgent: boolean
  created_at: string
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at'>
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>
        Relationships: []
      }
      resumes: {
        Row: Resume
        Insert: Pick<Resume, 'user_id'> & Partial<Omit<Resume, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
        Update: Partial<Omit<Resume, 'id' | 'user_id' | 'created_at'>>
        Relationships: []
      }
      resume_experience: {
        Row: ResumeExperience
        Insert: Omit<ResumeExperience, 'id'>
        Update: Partial<Omit<ResumeExperience, 'id' | 'resume_id'>>
        Relationships: []
      }
      resume_certificates: {
        Row: ResumeCertificate
        Insert: Omit<ResumeCertificate, 'id'>
        Update: Partial<Omit<ResumeCertificate, 'id' | 'resume_id'>>
        Relationships: []
      }
      resume_education: {
        Row: ResumeEducation
        Insert: Omit<ResumeEducation, 'id'>
        Update: Partial<Omit<ResumeEducation, 'id' | 'resume_id'>>
        Relationships: []
      }
      resume_languages: {
        Row: ResumeLanguage
        Insert: Omit<ResumeLanguage, 'id'>
        Update: Partial<Omit<ResumeLanguage, 'id' | 'resume_id'>>
        Relationships: []
      }
      resume_skills: {
        Row: ResumeSkill
        Insert: Omit<ResumeSkill, 'id'>
        Update: Partial<Omit<ResumeSkill, 'id' | 'resume_id'>>
        Relationships: []
      }
      resume_references: {
        Row: ResumeReference
        Insert: Omit<ResumeReference, 'id'>
        Update: Partial<Omit<ResumeReference, 'id' | 'resume_id'>>
        Relationships: []
      }
      vacancies: {
        Row: Vacancy
        Insert: Omit<Vacancy, 'id' | 'created_at'>
        Update: Partial<Omit<Vacancy, 'id' | 'created_at'>>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
