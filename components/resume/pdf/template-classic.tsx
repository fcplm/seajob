import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer'
import type { PdfResumeData } from './types'

const NAVY  = '#0D1B2E'
const NAVY2 = '#152744'
const BLUE  = '#2176C7'
const SKY   = '#4FA3D1'
const GOLD  = '#C8963E'
const GOLD2 = '#DFB96A'
const BG1   = '#EAF0F8'
const MUTED = '#7A93B4'
const TEXT  = '#1D2D44'
const BORDER = '#C0D0E4'

const SIDEBAR_W = 152

const s = StyleSheet.create({
  page: { flexDirection: 'column', backgroundColor: '#fff', fontSize: 9, fontFamily: 'Helvetica', color: TEXT },

  /* Header */
  header:       { flexDirection: 'row', backgroundColor: NAVY },
  headerLeft:   { width: SIDEBAR_W, backgroundColor: NAVY2, padding: 14, alignItems: 'center', justifyContent: 'center' },
  photoBox:     { width: 82, height: 98, borderWidth: 1.5, borderColor: '#2C4060', borderStyle: 'solid', alignItems: 'center', justifyContent: 'center' },
  photoPlaceholder: { fontSize: 7, color: '#3A5070', textAlign: 'center', lineHeight: 1.5 },
  headerRight:  { flex: 1, padding: 14, paddingLeft: 18 },
  name:         { fontFamily: 'Times-Bold', fontSize: 22, color: '#fff', lineHeight: 1.05, marginBottom: 3 },
  titleLine:    { fontFamily: 'Helvetica-Bold', fontSize: 8, color: GOLD2, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8 },
  contactRow:   { flexDirection: 'row', flexWrap: 'wrap', gap: 3 },
  contactItem:  { fontSize: 7.5, color: 'rgba(255,255,255,0.7)', marginRight: 14, marginBottom: 2 },

  /* Stripe */
  stripe: { flexDirection: 'row', height: 4 },
  stripeBlue: { flex: 3, backgroundColor: BLUE },
  stripeSky:  { flex: 2, backgroundColor: SKY },
  stripeGold: { flex: 2, backgroundColor: GOLD },

  /* Body */
  body:    { flexDirection: 'row', flex: 1 },
  sidebar: { width: SIDEBAR_W, backgroundColor: BG1, borderRightWidth: 1, borderRightColor: BORDER, padding: 12, paddingTop: 14 },
  main:    { flex: 1, padding: 14, paddingLeft: 15 },

  /* Sidebar section title */
  sbTitle: {
    fontFamily: 'Helvetica-Bold', fontSize: 6.5, color: BLUE,
    textTransform: 'uppercase', letterSpacing: 0.9,
    borderBottomWidth: 1.5, borderBottomColor: BLUE,
    paddingBottom: 3, marginBottom: 7, marginTop: 13,
  },

  /* Sidebar items */
  sbLangName:  { fontFamily: 'Helvetica-Bold', fontSize: 7.5, color: NAVY, marginBottom: 1 },
  sbLangLevel: { fontSize: 7, color: MUTED, marginBottom: 5 },
  sbSkillChip: { fontSize: 6.5, color: BLUE, fontFamily: 'Helvetica-Bold', borderWidth: 1, borderColor: '#AECAE0', borderStyle: 'solid', paddingHorizontal: 5, paddingVertical: 2, marginRight: 2, marginBottom: 2 },
  sbCertRow:   { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 2.5, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.06)' },
  sbCertPlus:  { fontSize: 8, color: GOLD, marginRight: 4, lineHeight: 1.3 },
  sbCertName:  { flex: 1, fontSize: 7, color: TEXT, lineHeight: 1.5 },
  sbEduDegree: { fontFamily: 'Helvetica-Bold', fontSize: 7.5, color: NAVY, marginBottom: 1 },
  sbEduSub:    { fontSize: 7, color: MUTED, marginBottom: 5 },

  /* Main section title */
  sectHead: {
    fontFamily: 'Helvetica-Bold', fontSize: 6.5, color: BLUE,
    textTransform: 'uppercase', letterSpacing: 0.9,
    marginTop: 12, marginBottom: 5,
  },
  sectRule: { borderBottomWidth: 1, borderBottomColor: 'rgba(33,118,199,0.2)', marginBottom: 7 },

  /* Profile bio */
  bioText: { fontSize: 7.5, lineHeight: 1.65, color: '#2D3F5A', marginBottom: 2 },

  /* Availability stats bar */
  statsRow: { flexDirection: 'row', borderWidth: 1.5, borderColor: '#C5D5E8', marginBottom: 6, backgroundColor: '#F7FAFF' },
  statCell: { flex: 1, alignItems: 'center', paddingVertical: 6, paddingHorizontal: 4, borderRightWidth: 1, borderRightColor: '#C5D5E8' },
  statCellLast: { flex: 1, alignItems: 'center', paddingVertical: 6, paddingHorizontal: 4 },
  statVal:  { fontFamily: 'Times-Bold', fontSize: 11, color: NAVY, lineHeight: 1 },
  statLbl:  { fontSize: 6, color: MUTED, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 },

  /* Experience */
  expBlock:    { marginBottom: 9, paddingBottom: 9, borderBottomWidth: 1, borderBottomColor: '#DDE8F4' },
  expBlockLast:{ marginBottom: 0 },
  expRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  expCompany:  { fontFamily: 'Helvetica-Bold', fontSize: 8.5, color: NAVY },
  expDates:    { fontSize: 6.5, color: MUTED },
  expPosition: { fontFamily: 'Helvetica-Bold', fontSize: 8, color: BLUE, marginBottom: 2 },
  expVessel:   { fontSize: 6.8, color: MUTED, fontStyle: 'italic', backgroundColor: '#F0F5FA', paddingHorizontal: 6, paddingVertical: 2, marginBottom: 4, borderLeftWidth: 2, borderLeftColor: SKY },

  /* Cert / Edu / Ref entries */
  entryBlock:  { marginBottom: 7 },
  entryTitle:  { fontFamily: 'Helvetica-Bold', fontSize: 8, color: NAVY, marginBottom: 1 },
  entryMuted:  { fontSize: 7, color: MUTED, marginBottom: 1 },

  /* Watermark */
  watermark: { position: 'absolute', bottom: 8, left: 0, right: 0, textAlign: 'center', color: '#cbd5e1', fontSize: 7 },
})

function SbTitle({ children }: { children: string }) {
  return <Text style={s.sbTitle}>{children}</Text>
}

function SectHead({ children }: { children: string }) {
  return (
    <>
      <Text style={s.sectHead}>{children}</Text>
      <View style={s.sectRule} />
    </>
  )
}

export function TemplateClassic({ data }: { data: PdfResumeData }) {
  const { profile, resume, experience, certificates, education, languages, skills, references, watermark } = data

  const titleParts = [profile.rank, profile.fleet_type].filter(Boolean).join(' · ')

  const contactItems: string[] = []
  if (profile.phone) contactItems.push(`T.  ${profile.phone}`)
  if (profile.email) contactItems.push(`E.  ${profile.email}`)

  const hasStats = !!(resume.availability_date || resume.contract_duration || resume.salary_expectation)

  return (
    <Document>
      <Page size="A4" style={s.page}>

        {/* ── Header ── */}
        <View style={s.header}>
          <View style={s.headerLeft}>
            <View style={s.photoBox}>
              <Text style={s.photoPlaceholder}>{'[ ]'}{'\n'}PHOTO{'\n'}3.5 × 4.5 cm</Text>
            </View>
          </View>
          <View style={s.headerRight}>
            <Text style={s.name}>{profile.full_name || 'Seafarer'}</Text>
            {titleParts ? <Text style={s.titleLine}>{titleParts}</Text> : null}
            <View style={s.contactRow}>
              {contactItems.map((item, i) => (
                <Text key={i} style={s.contactItem}>{item}</Text>
              ))}
            </View>
          </View>
        </View>

        {/* ── Gradient stripe ── */}
        <View style={s.stripe}>
          <View style={s.stripeBlue} />
          <View style={s.stripeSky} />
          <View style={s.stripeGold} />
        </View>

        {/* ── Body ── */}
        <View style={s.body}>

          {/* Sidebar */}
          <View style={s.sidebar}>

            {languages.filter(l => l.language).length > 0 && (
              <>
                <SbTitle>Languages</SbTitle>
                {languages.filter(l => l.language).map(l => (
                  <View key={l.id}>
                    <Text style={s.sbLangName}>{l.language}</Text>
                    {l.level ? <Text style={s.sbLangLevel}>{l.level}</Text> : null}
                  </View>
                ))}
              </>
            )}

            {skills.filter(s => s.name).length > 0 && (
              <>
                <SbTitle>Technical Skills</SbTitle>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                  {skills.filter(sk => sk.name).map(sk => (
                    <Text key={sk.id} style={s.sbSkillChip}>{sk.name}</Text>
                  ))}
                </View>
              </>
            )}

            {certificates.filter(c => c.name).length > 0 && (
              <>
                <SbTitle>Certifications</SbTitle>
                {certificates.filter(c => c.name).map(c => (
                  <View key={c.id} style={s.sbCertRow}>
                    <Text style={s.sbCertPlus}>+</Text>
                    <Text style={s.sbCertName}>{c.name}</Text>
                  </View>
                ))}
              </>
            )}

            {education.filter(e => e.degree || e.institution).length > 0 && (
              <>
                <SbTitle>Education</SbTitle>
                {education.filter(e => e.degree || e.institution).map(e => (
                  <View key={e.id}>
                    <Text style={s.sbEduDegree}>
                      {[e.degree, e.field].filter(Boolean).join(' in ')}
                    </Text>
                    <Text style={s.sbEduSub}>
                      {e.institution}{e.ended_at ? ` — ${e.ended_at.slice(0, 4)}` : ''}
                    </Text>
                  </View>
                ))}
              </>
            )}

          </View>

          {/* Main */}
          <View style={s.main}>

            {resume.bio && (
              <>
                <SectHead>Professional Profile</SectHead>
                <Text style={s.bioText}>{resume.bio}</Text>
              </>
            )}

            {hasStats && (
              <>
                <SectHead>Availability</SectHead>
                <View style={s.statsRow}>
                  {resume.availability_date && (
                    <View style={s.statCell}>
                      <Text style={s.statVal}>{resume.availability_date.slice(0, 10)}</Text>
                      <Text style={s.statLbl}>Available from</Text>
                    </View>
                  )}
                  {resume.contract_duration && (
                    <View style={resume.salary_expectation ? s.statCell : s.statCellLast}>
                      <Text style={s.statVal}>{resume.contract_duration}</Text>
                      <Text style={s.statLbl}>Contract</Text>
                    </View>
                  )}
                  {resume.salary_expectation && (
                    <View style={s.statCellLast}>
                      <Text style={s.statVal}>{resume.salary_expectation}</Text>
                      <Text style={s.statLbl}>Expected salary</Text>
                    </View>
                  )}
                </View>
              </>
            )}

            {experience.length > 0 && (
              <>
                <SectHead>Sea Experience</SectHead>
                {experience.map((e, i) => {
                  const isLast = i === experience.length - 1
                  const vessel = [
                    e.vessel_name, e.vessel_type,
                    e.grt  ? `${e.grt} GRT`  : null,
                    e.dwt  ? `${e.dwt} DWT`  : null,
                    e.flag,
                  ].filter(Boolean).join(' · ')
                  return (
                    <View key={e.id} style={isLast ? s.expBlockLast : s.expBlock}>
                      <View style={s.expRow}>
                        <Text style={s.expCompany}>{e.company}</Text>
                        <Text style={s.expDates}>{e.started_at} — {e.ended_at ?? 'Present'}</Text>
                      </View>
                      {e.position && <Text style={s.expPosition}>{e.position}</Text>}
                      {vessel ? <Text style={s.expVessel}>{vessel}</Text> : null}
                    </View>
                  )
                })}
              </>
            )}

            {references.length > 0 && (
              <>
                <SectHead>References</SectHead>
                {references.map(r => (
                  <View key={r.id} style={s.entryBlock}>
                    <Text style={s.entryTitle}>{r.full_name}</Text>
                    <Text style={s.entryMuted}>{[r.position, r.company].filter(Boolean).join(' · ')}</Text>
                    <Text style={s.entryMuted}>{[r.email, r.phone].filter(Boolean).join(' · ')}</Text>
                  </View>
                ))}
              </>
            )}

          </View>
        </View>

        {watermark && (
          <Text style={s.watermark} fixed>SeaJob.io — Upgrade to Pro to remove watermark</Text>
        )}

      </Page>
    </Document>
  )
}
