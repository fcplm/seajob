import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer'
import type { PdfResumeData } from './types'

const s = StyleSheet.create({
  page: { flexDirection: 'row', padding: 32, fontSize: 9, fontFamily: 'Helvetica', color: '#1e293b' },
  left: { width: '33%', paddingRight: 16, borderRightWidth: 1, borderRightColor: '#e2e8f0' },
  right: { flex: 1, paddingLeft: 16 },
  name: { fontSize: 17, fontFamily: 'Helvetica-Bold', marginBottom: 3 },
  subtitle: { fontSize: 10, color: '#475569', marginBottom: 14 },
  sectionTitle: { fontSize: 8, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', letterSpacing: 0.8, color: '#64748b', marginTop: 12, marginBottom: 4 },
  rule: { borderBottomWidth: 1, borderBottomColor: '#e2e8f0', marginBottom: 6 },
  entryBlock: { marginBottom: 7 },
  bold: { fontFamily: 'Helvetica-Bold' },
  muted: { color: '#64748b', fontSize: 8 },
  watermark: { position: 'absolute', bottom: 8, left: 0, right: 0, textAlign: 'center', color: '#cbd5e1', fontSize: 7 },
})

export function TemplateClassic({ data }: { data: PdfResumeData }) {
  const { profile, resume, experience, certificates, education, languages, skills, references, watermark } = data

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={s.left}>
          <Text style={s.name}>{profile.full_name ?? 'Seafarer'}</Text>
          <Text style={s.subtitle}>{[profile.rank, profile.fleet_type].filter(Boolean).join(' · ')}</Text>

          {languages.length > 0 && <>
            <Text style={s.sectionTitle}>Languages</Text>
            <View style={s.rule} />
            {languages.map(l => <Text key={l.id} style={{ marginBottom: 2 }}>{[l.language, l.level].filter(Boolean).join(' — ')}</Text>)}
          </>}

          {skills.length > 0 && <>
            <Text style={s.sectionTitle}>Skills</Text>
            <View style={s.rule} />
            {skills.map(sk => <Text key={sk.id} style={{ marginBottom: 2 }}>• {sk.name}</Text>)}
          </>}

          {(resume.availability_date || resume.contract_duration || resume.salary_expectation) && <>
            <Text style={s.sectionTitle}>Preferences</Text>
            <View style={s.rule} />
            {resume.availability_date && <Text style={{ marginBottom: 2 }}>Available: {resume.availability_date}</Text>}
            {resume.contract_duration && <Text style={{ marginBottom: 2 }}>Contract: {resume.contract_duration}</Text>}
            {resume.salary_expectation && <Text style={{ marginBottom: 2 }}>Salary: {resume.salary_expectation}</Text>}
          </>}
        </View>

        <View style={s.right}>
          {resume.bio && <>
            <Text style={s.sectionTitle}>Profile</Text>
            <View style={s.rule} />
            <Text style={{ marginBottom: 8, lineHeight: 1.5 }}>{resume.bio}</Text>
          </>}

          {experience.length > 0 && <>
            <Text style={s.sectionTitle}>Sea Experience</Text>
            <View style={s.rule} />
            {experience.map(e => (
              <View key={e.id} style={s.entryBlock}>
                <Text style={s.bold}>{[e.position, e.vessel_name].filter(Boolean).join(' — ')}</Text>
                <Text style={s.muted}>{[e.company, e.flag].filter(Boolean).join(' · ')}</Text>
                <Text style={s.muted}>{[e.vessel_type, e.grt ? `${e.grt} GRT` : null, e.dwt ? `${e.dwt} DWT` : null].filter(Boolean).join(' · ')}</Text>
                <Text style={s.muted}>{[e.started_at, e.ended_at ?? 'Present'].filter(Boolean).join(' — ')}</Text>
              </View>
            ))}
          </>}

          {certificates.length > 0 && <>
            <Text style={s.sectionTitle}>Certificates</Text>
            <View style={s.rule} />
            {certificates.map(c => (
              <View key={c.id} style={s.entryBlock}>
                <Text style={s.bold}>{c.name}</Text>
                <Text style={s.muted}>{c.issued_by}</Text>
                <Text style={s.muted}>{[c.issued_at, c.expires_at].filter(Boolean).join(' — ')}</Text>
              </View>
            ))}
          </>}

          {education.length > 0 && <>
            <Text style={s.sectionTitle}>Education</Text>
            <View style={s.rule} />
            {education.map(e => (
              <View key={e.id} style={s.entryBlock}>
                <Text style={s.bold}>{e.degree}{e.field ? ` in ${e.field}` : ''}</Text>
                <Text style={s.muted}>{e.institution}</Text>
                <Text style={s.muted}>{[e.started_at, e.ended_at].filter(Boolean).join(' — ')}</Text>
              </View>
            ))}
          </>}

          {references.length > 0 && <>
            <Text style={s.sectionTitle}>References</Text>
            <View style={s.rule} />
            {references.map(r => (
              <View key={r.id} style={s.entryBlock}>
                <Text style={s.bold}>{r.full_name}</Text>
                <Text style={s.muted}>{[r.position, r.company].filter(Boolean).join(' · ')}</Text>
                <Text style={s.muted}>{[r.email, r.phone].filter(Boolean).join(' · ')}</Text>
              </View>
            ))}
          </>}
        </View>

        {watermark && (
          <Text style={s.watermark} fixed>SeaJob.io — Upgrade to Pro to remove watermark</Text>
        )}
      </Page>
    </Document>
  )
}
