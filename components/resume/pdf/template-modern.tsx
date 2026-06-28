import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer'
import type { PdfResumeData } from './types'

const s = StyleSheet.create({
  page: { padding: 40, fontSize: 9, fontFamily: 'Helvetica', color: '#1e293b' },
  header: { marginBottom: 20, borderBottomWidth: 3, borderBottomColor: '#0f172a', paddingBottom: 12 },
  name: { fontSize: 20, fontFamily: 'Helvetica-Bold', marginBottom: 4 },
  subtitle: { fontSize: 10, color: '#475569' },
  sectionTitle: { fontSize: 11, fontFamily: 'Helvetica-Bold', marginTop: 14, marginBottom: 6, paddingBottom: 3, borderBottomWidth: 2, borderBottomColor: '#0f172a' },
  entryBlock: { marginBottom: 8 },
  bold: { fontFamily: 'Helvetica-Bold' },
  muted: { color: '#64748b', fontSize: 8 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  watermark: { position: 'absolute', bottom: 8, left: 0, right: 0, textAlign: 'center', color: '#cbd5e1', fontSize: 7 },
})

export function TemplateModern({ data }: { data: PdfResumeData }) {
  const { profile, resume, experience, certificates, education, languages, skills, references, watermark } = data

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <Text style={s.name}>{profile.full_name ?? 'Seafarer'}</Text>
          <Text style={s.subtitle}>{[profile.rank, profile.fleet_type].filter(Boolean).join(' · ')}</Text>
        </View>

        {resume.bio && <>
          <Text style={s.sectionTitle}>Profile</Text>
          <Text style={{ marginBottom: 8, lineHeight: 1.5 }}>{resume.bio}</Text>
        </>}

        {experience.length > 0 && <>
          <Text style={s.sectionTitle}>Sea Experience</Text>
          {experience.map(e => (
            <View key={e.id} style={s.entryBlock}>
              <Text style={s.bold}>{[e.position, e.vessel_name].filter(Boolean).join(' — ')}</Text>
              <Text style={s.muted}>{[e.company, e.flag, e.vessel_type, e.grt ? `${e.grt} GRT` : null].filter(Boolean).join(' · ')}</Text>
              <Text style={s.muted}>{[e.started_at, e.ended_at ?? 'Present'].filter(Boolean).join(' — ')}</Text>
            </View>
          ))}
        </>}

        {certificates.length > 0 && <>
          <Text style={s.sectionTitle}>Certificates</Text>
          {certificates.map(c => (
            <View key={c.id} style={s.entryBlock}>
              <Text style={s.bold}>{c.name}</Text>
              <Text style={s.muted}>{[c.issued_by, [c.issued_at, c.expires_at].filter(Boolean).join(' — ')].filter(Boolean).join(' · ')}</Text>
            </View>
          ))}
        </>}

        {education.length > 0 && <>
          <Text style={s.sectionTitle}>Education</Text>
          {education.map(e => (
            <View key={e.id} style={s.entryBlock}>
              <Text style={s.bold}>{e.degree}{e.field ? ` in ${e.field}` : ''}</Text>
              <Text style={s.muted}>{[e.institution, [e.started_at, e.ended_at].filter(Boolean).join(' — ')].filter(Boolean).join(' · ')}</Text>
            </View>
          ))}
        </>}

        {(languages.length > 0 || skills.length > 0) && <>
          <Text style={s.sectionTitle}>Skills & Languages</Text>
          <View style={s.row}>
            {languages.map(l => <Text key={l.id} style={{ marginRight: 12 }}>{[l.language, l.level ? `(${l.level})` : null].filter(Boolean).join(' ')}</Text>)}
            {skills.map(sk => <Text key={sk.id} style={{ marginRight: 12 }}>• {sk.name}</Text>)}
          </View>
        </>}

        {references.length > 0 && <>
          <Text style={s.sectionTitle}>References</Text>
          {references.map(r => (
            <View key={r.id} style={s.entryBlock}>
              <Text style={s.bold}>{r.full_name}</Text>
              <Text style={s.muted}>{[r.position, r.company, r.email, r.phone].filter(Boolean).join(' · ')}</Text>
            </View>
          ))}
        </>}

        {(resume.availability_date || resume.contract_duration || resume.salary_expectation) && <>
          <Text style={s.sectionTitle}>Preferences</Text>
          <Text style={s.muted}>
            {[
              resume.availability_date ? `Available: ${resume.availability_date}` : null,
              resume.contract_duration ? `Contract: ${resume.contract_duration}` : null,
              resume.salary_expectation ? `Salary: ${resume.salary_expectation}` : null,
            ].filter(Boolean).join(' · ')}
          </Text>
        </>}

        {watermark && <Text style={s.watermark} fixed>SeaJob.io — Upgrade to Pro to remove watermark</Text>}
      </Page>
    </Document>
  )
}
