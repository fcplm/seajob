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

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at'>
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
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
