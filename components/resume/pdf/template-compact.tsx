import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer'
import type { PdfResumeData } from './types'

const s = StyleSheet.create({
  page: { padding: 28, fontSize: 8, fontFamily: 'Helvetica', color: '#1e293b' },
  header: { marginBottom: 10 },
  name: { fontSize: 14, fontFamily: 'Helvetica-Bold', marginBottom: 2 },
  subtitle: { fontSize: 8, color: '#475569', marginBottom: 8 },
  sectionTitle: { fontSize: 8, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', letterSpacing: 0.6, color: '#475569', marginTop: 8, marginBottom: 2 },
  rule: { borderBottomWidth: 0.5, borderBottomColor: '#e2e8f0', marginBottom: 4 },
  entryBlock: { marginBottom: 5 },
  bold: { fontFamily: 'Helvetica-Bold' },
  muted: { color: '#64748b', fontSize: 7.5 },
  row: { flexDirection: 'row', flexWrap: 'wrap' },
  watermark: { position: 'absolute', bottom: 8, left: 0, right: 0, textAlign: 'center', color: '#cbd5e1', fontSize: 6.5 },
})

export function TemplateCompact({ data }: { data: PdfResumeData }) {
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
          <View style={s.rule} />
          <Text style={{ marginBottom: 5, lineHeight: 1.4 }}>{resume.bio}</Text>
        </>}

        {experience.length > 0 && <>
          <Text style={s.sectionTitle}>Experience</Text>
          <View style={s.rule} />
          {experience.map(e => (
            <View key={e.id} style={s.entryBlock}>
              <Text style={s.bold}>{e.position} · {e.vessel_name}{e.flag ? ` (${e.flag})` : ''}</Text>
              <Text style={s.muted}>{e.company} · {e.vessel_type}{e.grt ? ` · ${e.grt} GRT` : ''} · {e.started_at} — {e.ended_at ?? 'Present'}</Text>
            </View>
          ))}
        </>}

        {certificates.length > 0 && <>
          <Text style={s.sectionTitle}>Certificates</Text>
          <View style={s.rule} />
          {certificates.map(c => (
            <View key={c.id} style={s.entryBlock}>
              <Text style={s.bold}>{c.name}</Text>
              <Text style={s.muted}>{c.issued_by} · {c.issued_at}{c.expires_at ? ` — ${c.expires_at}` : ''}</Text>
            </View>
          ))}
        </>}

        {education.length > 0 && <>
          <Text style={s.sectionTitle}>Education</Text>
          <View style={s.rule} />
          {education.map(e => (
            <View key={e.id} style={s.entryBlock}>
              <Text style={s.bold}>{e.degree}{e.field ? ` · ${e.field}` : ''}</Text>
              <Text style={s.muted}>{e.institution} · {e.started_at} — {e.ended_at}</Text>
            </View>
          ))}
        </>}

        {(languages.length > 0 || skills.length > 0) && <>
          <Text style={s.sectionTitle}>Languages & Skills</Text>
          <View style={s.rule} />
          <View style={s.row}>
            {languages.map(l => <Text key={l.id} style={{ marginRight: 10, marginBottom: 2 }}>{l.language} ({l.level})</Text>)}
            {skills.map(sk => <Text key={sk.id} style={{ marginRight: 10, marginBottom: 2 }}>• {sk.name}</Text>)}
          </View>
        </>}

        {references.length > 0 && <>
          <Text style={s.sectionTitle}>References</Text>
          <View style={s.rule} />
          {references.map(r => (
            <View key={r.id} style={s.entryBlock}>
              <Text style={s.bold}>{r.full_name} · {r.position}{r.company ? ` · ${r.company}` : ''}</Text>
              <Text style={s.muted}>{r.email}{r.phone ? ` · ${r.phone}` : ''}</Text>
            </View>
          ))}
        </>}

        {(resume.availability_date || resume.contract_duration || resume.salary_expectation) && <>
          <Text style={s.sectionTitle}>Preferences</Text>
          <View style={s.rule} />
          <Text style={s.muted}>
            {[
              resume.availability_date ? `Available: ${resume.availability_date}` : null,
              resume.contract_duration,
              resume.salary_expectation,
            ].filter(Boolean).join(' · ')}
          </Text>
        </>}

        {watermark && <Text style={s.watermark} fixed>SeaJob.io — Upgrade to Pro to remove watermark</Text>}
      </Page>
    </Document>
  )
}
