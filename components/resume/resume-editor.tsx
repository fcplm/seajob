'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { CompletenessBar } from './completeness-bar'
import { TemplatePicker } from './template-picker'
import { SectionPersonal } from './section-personal'
import { SectionExperience } from './section-experience'
import { SectionCertificates } from './section-certificates'
import { SectionEducation } from './section-education'
import { SectionLanguages } from './section-languages'
import { SectionSkills } from './section-skills'
import { SectionReferences } from './section-references'
import { SectionPreferences } from './section-preferences'
import type { ResumeData } from '@/lib/supabase/types'

type Template = 'classic' | 'modern' | 'compact'
type SectionKey = 'personal' | 'experience' | 'certificates' | 'education' | 'languages' | 'skills' | 'references' | 'preferences'

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
  subscriptionStatus: 'free' | 'pro' | 'enterprise'
}

export function ResumeEditor({ data, subscriptionStatus }: Props) {
  const t = useTranslations('resume')
  const [completed, setCompleted] = useState<Record<SectionKey, boolean>>(initCompleted(data))
  const [selectedTemplate, setSelectedTemplate] = useState<Template>(data.resume?.template ?? 'classic')

  function onComplete(key: SectionKey) {
    return (complete: boolean) => setCompleted(prev => ({ ...prev, [key]: complete }))
  }

  const score = SECTION_KEYS.filter(k => completed[k]).length / SECTION_KEYS.length
  const hasResume = SECTION_KEYS.some(k => completed[k])

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <CompletenessBar score={score} />
        <a href={`/api/resume/pdf?template=${selectedTemplate}`} download>
          <Button disabled={!hasResume} size="sm">{t('downloadPdf')}</Button>
        </a>
      </div>

      <TemplatePicker
        selected={selectedTemplate}
        subscriptionStatus={subscriptionStatus}
        onSelect={setSelectedTemplate}
      />

      <Accordion type="single" collapsible className="space-y-2">
        <AccordionItem value="personal" className="border rounded-lg px-4">
          <AccordionTrigger>{t('sectionPersonal')}</AccordionTrigger>
          <AccordionContent>
            <SectionPersonal initialBio={data.resume?.bio ?? null} onComplete={onComplete('personal')} />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="experience" className="border rounded-lg px-4">
          <AccordionTrigger>{t('sectionExperience')}</AccordionTrigger>
          <AccordionContent>
            <SectionExperience initialData={data.experience} onComplete={onComplete('experience')} />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="certificates" className="border rounded-lg px-4">
          <AccordionTrigger>{t('sectionCertificates')}</AccordionTrigger>
          <AccordionContent>
            <SectionCertificates initialData={data.certificates} onComplete={onComplete('certificates')} />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="education" className="border rounded-lg px-4">
          <AccordionTrigger>{t('sectionEducation')}</AccordionTrigger>
          <AccordionContent>
            <SectionEducation initialData={data.education} onComplete={onComplete('education')} />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="languages" className="border rounded-lg px-4">
          <AccordionTrigger>{t('sectionLanguages')}</AccordionTrigger>
          <AccordionContent>
            <SectionLanguages initialData={data.languages} onComplete={onComplete('languages')} />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="skills" className="border rounded-lg px-4">
          <AccordionTrigger>{t('sectionSkills')}</AccordionTrigger>
          <AccordionContent>
            <SectionSkills initialData={data.skills} onComplete={onComplete('skills')} />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="references" className="border rounded-lg px-4">
          <AccordionTrigger>{t('sectionReferences')}</AccordionTrigger>
          <AccordionContent>
            <SectionReferences initialData={data.references} onComplete={onComplete('references')} />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="preferences" className="border rounded-lg px-4">
          <AccordionTrigger>{t('sectionPreferences')}</AccordionTrigger>
          <AccordionContent>
            <SectionPreferences
              initialData={{
                availability_date: data.resume?.availability_date ?? null,
                contract_duration: data.resume?.contract_duration ?? null,
                salary_expectation: data.resume?.salary_expectation ?? null,
              }}
              onComplete={onComplete('preferences')}
            />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}
