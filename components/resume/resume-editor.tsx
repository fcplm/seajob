'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { CompletenessBar } from './completeness-bar'
import { SectionPersonal } from './section-personal'
import { SectionExperience } from './section-experience'
import { SectionCertificates } from './section-certificates'
import { SectionEducation } from './section-education'
import { SectionLanguages } from './section-languages'
import { SectionSkills } from './section-skills'
import { SectionReferences } from './section-references'
import { SectionPreferences } from './section-preferences'
import { CvPreview, type CvProfile } from './cv-preview'
import type {
  ResumeData,
  ResumeExperience,
  ResumeCertificate,
  ResumeEducation,
  ResumeLanguage,
  ResumeSkill,
} from '@/lib/supabase/types'

type SectionKey = 'personal' | 'experience' | 'certificates' | 'education' | 'languages' | 'skills' | 'references' | 'preferences'
type Tab = 'basics' | 'experience' | 'skills' | 'certs'

const SECTION_KEYS: SectionKey[] = ['personal', 'experience', 'certificates', 'education', 'languages', 'skills', 'references', 'preferences']

function initCompleted(data: ResumeData): Record<SectionKey, boolean> {
  return {
    personal: !!data.resume?.bio,
    experience: data.experience.length > 0,
    certificates: data.certificates.length > 0,
    education: data.education.length > 0,
    languages: data.languages.length > 0,
    skills: data.skills.length > 0,
    references: data.references.length > 0,
    preferences: !!(data.resume?.availability_date || data.resume?.contract_duration || data.resume?.salary_expectation),
  }
}

type Props = {
  data: ResumeData
  profile: CvProfile
  subscriptionStatus: 'free' | 'pro' | 'enterprise'
}

const TABS: { id: Tab; label: string }[] = [
  { id: 'basics', label: 'Basics' },
  { id: 'experience', label: 'Experience' },
  { id: 'skills', label: 'Skills' },
  { id: 'certs', label: 'Certs' },
]

function SectionHeading({ children }: { children: string }) {
  return (
    <div className="flex items-center gap-2 mb-3 mt-5 first:mt-0">
      <div className="w-0.5 h-3.5 rounded-full bg-[#2176C7]" />
      <span className="text-[9px] font-black uppercase tracking-widest text-[#7A93B4]">{children}</span>
    </div>
  )
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function ResumeEditor({ data, profile, subscriptionStatus }: Props) {
  const t = useTranslations('resume')
  const [activeTab, setActiveTab] = useState<Tab>('basics')
  const [completed, setCompleted] = useState<Record<SectionKey, boolean>>(initCompleted(data))
  const [liveData, setLiveData] = useState<ResumeData>(data)
  const [isDownloading, startDownload] = useTransition()

  function onComplete(key: SectionKey) {
    return (complete: boolean) => setCompleted(prev => ({ ...prev, [key]: complete }))
  }

  function handleDownload() {
    startDownload(async () => {
      try {
        const res = await fetch('/api/resume/pdf?template=classic')
        if (!res.ok) { toast.error(t('pdfError')); return }
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'resume.pdf'
        a.click()
        URL.revokeObjectURL(url)
      } catch {
        toast.error(t('pdfError'))
      }
    })
  }

  const score = SECTION_KEYS.filter(k => completed[k]).length / SECTION_KEYS.length
  const hasResume = SECTION_KEYS.some(k => completed[k])

  return (
    <div className="flex h-screen -mx-6 -mt-6">
      {/* ── Left panel: editor ── */}
      <div
        className="flex flex-col border-r border-slate-200 bg-white"
        style={{ width: 380, minWidth: 380, overflow: 'hidden' }}
      >
        {/* Top bar */}
        <div
          className="flex items-center justify-between px-4 py-3 border-b border-slate-200 flex-shrink-0"
          style={{ background: '#0D1B2E' }}
        >
          <span className="text-sm font-bold text-white">CV Builder</span>
          <Button
            size="sm"
            onClick={handleDownload}
            disabled={!hasResume || isDownloading}
            className="text-xs h-7 px-3"
            style={{ background: '#C8963E', color: '#fff', border: 'none' }}
          >
            {isDownloading ? t('downloadingPdf') : '⬇ Download PDF'}
          </Button>
        </div>

        {/* Progress */}
        <div className="px-4 py-2 border-b border-slate-100 flex-shrink-0">
          <CompletenessBar score={score} />
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 bg-[#EEF3FA] flex-shrink-0">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={[
                'flex-1 py-2.5 text-[9.5px] font-black uppercase tracking-widest transition-all',
                activeTab === tab.id
                  ? 'text-[#2176C7] border-b-2 border-[#2176C7] bg-white'
                  : 'text-[#7A93B4] hover:text-[#2176C7]',
              ].join(' ')}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {activeTab === 'basics' && (
            <div>
              <SectionHeading>Profile Summary</SectionHeading>
              <SectionPersonal
                initialBio={data.resume?.bio ?? null}
                onComplete={onComplete('personal')}
                onUpdate={bio => setLiveData(prev => ({
                  ...prev,
                  resume: prev.resume ? { ...prev.resume, bio } : null,
                }))}
              />

              <SectionHeading>Availability & Salary</SectionHeading>
              <SectionPreferences
                initialData={{
                  availability_date: data.resume?.availability_date ?? null,
                  contract_duration: data.resume?.contract_duration ?? null,
                  salary_expectation: data.resume?.salary_expectation ?? null,
                }}
                onComplete={onComplete('preferences')}
                onUpdate={prefs => setLiveData(prev => ({
                  ...prev,
                  resume: prev.resume ? { ...prev.resume, ...prefs } : null,
                }))}
              />

              <SectionHeading>Languages</SectionHeading>
              <SectionLanguages
                initialData={data.languages}
                onComplete={onComplete('languages')}
                onUpdate={(entries: ResumeLanguage[]) => setLiveData(prev => ({ ...prev, languages: entries }))}
              />

              <SectionHeading>Education</SectionHeading>
              <SectionEducation
                initialData={data.education}
                onComplete={onComplete('education')}
                onUpdate={(entries: ResumeEducation[]) => setLiveData(prev => ({ ...prev, education: entries }))}
              />

              <SectionHeading>References</SectionHeading>
              <SectionReferences initialData={data.references} onComplete={onComplete('references')} />
            </div>
          )}

          {activeTab === 'experience' && (
            <div>
              <p className="text-[11.5px] text-[#7A93B4] mb-4 leading-relaxed">
                Most recent first. Include vessel specs — GRT, DWT, flag.
              </p>
              <SectionExperience
                initialData={data.experience}
                onComplete={onComplete('experience')}
                onUpdate={(entries: ResumeExperience[]) => setLiveData(prev => ({ ...prev, experience: entries }))}
              />
            </div>
          )}

          {activeTab === 'skills' && (
            <div>
              <SectionHeading>Technical Skills</SectionHeading>
              <SectionSkills
                initialData={data.skills}
                onComplete={onComplete('skills')}
                onUpdate={(entries: ResumeSkill[]) => setLiveData(prev => ({ ...prev, skills: entries }))}
              />
            </div>
          )}

          {activeTab === 'certs' && (
            <div>
              <p className="text-[11.5px] text-[#7A93B4] mb-4 leading-relaxed">
                DP, HUET, STCW are scanned first by offshore recruiters.
              </p>
              <SectionCertificates
                initialData={data.certificates}
                onComplete={onComplete('certificates')}
                onUpdate={(entries: ResumeCertificate[]) => setLiveData(prev => ({ ...prev, certificates: entries }))}
              />
            </div>
          )}
        </div>
      </div>

      {/* ── Right panel: live preview ── */}
      <div
        className="flex-1 overflow-auto"
        style={{ background: '#B0C4D8', padding: '24px 16px' }}
      >
        <CvPreview data={liveData} profile={profile} />
      </div>
    </div>
  )
}
