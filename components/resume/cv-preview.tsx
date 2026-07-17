'use client'

import type { ResumeData } from '@/lib/supabase/types'

export type CvProfile = {
  full_name: string | null
  rank: string | null
  fleet_type: string | null
  phone: string | null
  email?: string | null
}

const C = {
  navy:  '#0D1B2E',
  navy2: '#152744',
  blue:  '#2176C7',
  sky:   '#4FA3D1',
  gold:  '#C8963E',
  gold2: '#DFB96A',
  bg1:   '#EAF0F8',
  muted: '#7A93B4',
  border:'#C5D5E8',
  text:  '#1D2D44',
}

function SbTitle({ children }: { children: string }) {
  return (
    <div style={{
      fontSize: '6.5pt', fontWeight: 800, letterSpacing: '.15em',
      textTransform: 'uppercase', color: C.blue,
      borderBottom: `1.5px solid ${C.blue}`, paddingBottom: 3,
      marginBottom: 8, marginTop: 14,
    }}>
      {children}
    </div>
  )
}

function SectHead({ children }: { children: string }) {
  return (
    <div style={{
      fontSize: '6.5pt', fontWeight: 800, letterSpacing: '.15em',
      textTransform: 'uppercase', color: C.blue,
      marginBottom: 7, marginTop: 13,
      display: 'flex', alignItems: 'center', gap: 7,
    }}>
      {children}
      <span style={{ flex: 1, height: 1.5, background: 'rgba(33,118,199,.25)', display: 'inline-block' }} />
    </div>
  )
}

export function CvPreview({ data, profile }: { data: ResumeData; profile: CvProfile }) {
  const { resume, experience, certificates, education, languages, skills } = data

  const contactItems: string[] = []
  if (profile.phone) contactItems.push(`T. ${profile.phone}`)
  if (profile.email) contactItems.push(`E. ${profile.email}`)
  const title = [profile.rank, profile.fleet_type].filter(Boolean).join(' · ')

  return (
    <div style={{
      width: '210mm', minHeight: '297mm', background: '#fff',
      fontFamily: "'Mulish', 'Inter', sans-serif",
      fontSize: '9pt', color: C.navy,
    }}>
      {/* Header */}
      <table style={{ width: '100%', borderCollapse: 'collapse', background: C.navy }}>
        <tbody>
          <tr>
            <td style={{ width: '60mm', background: C.navy2, verticalAlign: 'middle', padding: '16px 14px', textAlign: 'center' }}>
              <div style={{
                width: 90, height: 108,
                border: '1.5px solid rgba(255,255,255,.18)', borderRadius: 3, overflow: 'hidden',
                margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'rgba(255,255,255,.2)', fontSize: '7pt', textAlign: 'center', lineHeight: 1.5,
              }}>
                <div><div style={{ fontSize: 13, marginBottom: 2 }}>[ ]</div>PHOTO<br />3.5 × 4.5 cm</div>
              </div>
            </td>
            <td style={{ verticalAlign: 'middle', padding: '16px 20px 14px' }}>
              <div style={{
                fontFamily: 'Georgia, serif', fontSize: '22pt', color: '#fff',
                lineHeight: 1.05, marginBottom: 3, fontWeight: 700,
              }}>
                {profile.full_name || 'YOUR NAME'}
              </div>
              {title && (
                <div style={{ fontSize: '8.5pt', color: C.gold2, fontWeight: 700, letterSpacing: '.08em', marginBottom: 9, textTransform: 'uppercase' }}>
                  {title}
                </div>
              )}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px 14px' }}>
                {contactItems.map((item, i) => (
                  <div key={i} style={{ fontSize: '7.5pt', color: 'rgba(255,255,255,.72)' }}>{item}</div>
                ))}
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Gradient stripe */}
      <div style={{ height: 4, background: `linear-gradient(90deg, ${C.blue} 0%, ${C.sky} 50%, ${C.gold} 100%)` }} />

      {/* Body */}
      <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
        <colgroup>
          <col style={{ width: '60mm' }} />
          <col />
        </colgroup>
        <tbody>
          <tr>
            {/* Sidebar */}
            <td style={{ verticalAlign: 'top', background: C.bg1, borderRight: `1px solid #C0D0E4`, padding: '16px 13px', width: '60mm' }}>
              {languages.filter(l => l.language).length > 0 && (
                <>
                  <SbTitle>Languages</SbTitle>
                  {languages.filter(l => l.language).map(l => (
                    <div key={l.id} style={{ marginBottom: 5 }}>
                      <div style={{ fontSize: '7.5pt', fontWeight: 700, color: C.navy }}>{l.language}</div>
                      {l.level && <div style={{ fontSize: '7pt', color: C.muted }}>{l.level}</div>}
                    </div>
                  ))}
                </>
              )}

              {skills.filter(s => s.name).length > 0 && (
                <>
                  <SbTitle>Technical Skills</SbTitle>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                    {skills.filter(s => s.name).map(s => (
                      <span key={s.id} style={{
                        display: 'inline-block', background: '#fff',
                        border: '1px solid #AECAE0', color: C.blue,
                        fontSize: '6.2pt', padding: '2px 5px', borderRadius: 3,
                        fontWeight: 700, lineHeight: 1.6, marginBottom: 1,
                      }}>{s.name}</span>
                    ))}
                  </div>
                </>
              )}

              {certificates.filter(c => c.name).length > 0 && (
                <>
                  <SbTitle>Certifications</SbTitle>
                  {certificates.filter(c => c.name).map(c => (
                    <div key={c.id} style={{
                      fontSize: '7.2pt', color: C.text, lineHeight: 1.5,
                      padding: '2px 0', borderBottom: '1px solid rgba(0,0,0,.06)',
                      display: 'flex', alignItems: 'flex-start', gap: 4,
                    }}>
                      <span style={{ color: C.gold, flexShrink: 0, fontSize: '8pt', lineHeight: 1.4 }}>+</span>
                      {c.name}
                    </div>
                  ))}
                </>
              )}

              {education.filter(e => e.degree || e.institution).length > 0 && (
                <>
                  <SbTitle>Education</SbTitle>
                  {education.filter(e => e.degree || e.institution).map(e => (
                    <div key={e.id} style={{ marginBottom: 5 }}>
                      <div style={{ fontSize: '7.5pt', fontWeight: 700, color: C.navy }}>
                        {[e.degree, e.field].filter(Boolean).join(' in ')}
                      </div>
                      <div style={{ fontSize: '7pt', color: C.muted }}>
                        {e.institution}{e.ended_at ? ` — ${e.ended_at.slice(0, 4)}` : ''}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </td>

            {/* Main content */}
            <td style={{ verticalAlign: 'top', padding: '16px 18px 16px 15px' }}>
              {resume?.bio && (
                <>
                  <SectHead>Professional Profile</SectHead>
                  <div style={{ fontSize: '7.5pt', lineHeight: 1.68, color: '#2D3F5A', marginBottom: 2 }}>
                    {resume.bio}
                  </div>
                </>
              )}

              {(resume?.availability_date || resume?.contract_duration || resume?.salary_expectation) && (
                <>
                  <SectHead>Availability</SectHead>
                  <table style={{ width: '100%', borderCollapse: 'collapse', border: `1.5px solid ${C.border}`, borderRadius: 5, overflow: 'hidden', marginBottom: 4 }}>
                    <tbody>
                      <tr>
                        {resume.availability_date && (
                          <td style={{ padding: '6px 8px', textAlign: 'center', borderRight: resume.contract_duration || resume.salary_expectation ? `1px solid ${C.border}` : undefined, background: '#F7FAFF' }}>
                            <div style={{ fontFamily: 'Georgia, serif', fontSize: '11pt', fontWeight: 700, color: C.navy, lineHeight: 1 }}>{resume.availability_date.slice(0, 10)}</div>
                            <div style={{ fontSize: '6pt', color: C.muted, textTransform: 'uppercase', letterSpacing: '.07em', marginTop: 2 }}>Available from</div>
                          </td>
                        )}
                        {resume.contract_duration && (
                          <td style={{ padding: '6px 8px', textAlign: 'center', borderRight: resume.salary_expectation ? `1px solid ${C.border}` : undefined, background: '#F7FAFF' }}>
                            <div style={{ fontFamily: 'Georgia, serif', fontSize: '11pt', fontWeight: 700, color: C.navy, lineHeight: 1 }}>{resume.contract_duration}</div>
                            <div style={{ fontSize: '6pt', color: C.muted, textTransform: 'uppercase', letterSpacing: '.07em', marginTop: 2 }}>Contract</div>
                          </td>
                        )}
                        {resume.salary_expectation && (
                          <td style={{ padding: '6px 8px', textAlign: 'center', background: '#F7FAFF' }}>
                            <div style={{ fontFamily: 'Georgia, serif', fontSize: '11pt', fontWeight: 700, color: C.navy, lineHeight: 1 }}>{resume.salary_expectation}</div>
                            <div style={{ fontSize: '6pt', color: C.muted, textTransform: 'uppercase', letterSpacing: '.07em', marginTop: 2 }}>Expected salary</div>
                          </td>
                        )}
                      </tr>
                    </tbody>
                  </table>
                </>
              )}

              {experience.length > 0 && (
                <>
                  <SectHead>Sea Experience</SectHead>
                  {experience.map((e, i) => {
                    const isLast = i === experience.length - 1
                    const vessel = [
                      e.vessel_name, e.vessel_type,
                      e.grt ? `${e.grt} GRT` : null,
                      e.dwt ? `${e.dwt} DWT` : null,
                      e.flag,
                    ].filter(Boolean).join(' · ')
                    return (
                      <div key={e.id} style={{
                        marginBottom: isLast ? 0 : 10,
                        paddingBottom: isLast ? 0 : 10,
                        borderBottom: isLast ? 'none' : '1px solid #DDE8F4',
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{ fontSize: '8.5pt', fontWeight: 800, color: C.navy }}>{e.company}</div>
                          <div style={{ fontSize: '6.5pt', color: C.muted, whiteSpace: 'nowrap', marginLeft: 8, paddingTop: 1 }}>
                            {e.started_at} — {e.ended_at ?? 'Present'}
                          </div>
                        </div>
                        {e.position && <div style={{ fontSize: '8pt', fontWeight: 700, color: C.blue, marginBottom: 2 }}>{e.position}</div>}
                        {vessel && (
                          <div style={{
                            fontSize: '6.8pt', color: C.muted, fontStyle: 'italic',
                            marginBottom: 4, background: '#F0F5FA',
                            padding: '2px 6px', borderRadius: 3,
                            borderLeft: `2px solid ${C.sky}`, display: 'inline-block',
                          }}>{vessel}</div>
                        )}
                      </div>
                    )
                  })}
                </>
              )}

              {!resume?.bio && experience.length === 0 && (
                <div style={{ color: C.muted, fontSize: '8pt', paddingTop: 20, textAlign: 'center' }}>
                  Fill in your resume details to see the preview
                </div>
              )}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}
