import { XMLParser } from 'fast-xml-parser'

export type RssVacancy = Omit<import('@/lib/supabase/types').Vacancy, 'id' | 'created_at'>

export function parseJobatseaRss(xml: string): RssVacancy[] {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    removeNSPrefix: true,
    isArray: (name) => name === 'item',
  })

  let parsed: unknown
  try {
    parsed = parser.parse(xml)
  } catch {
    return []
  }

  const root = parsed as { RDF?: { item?: unknown[] } }
  const items = root.RDF?.item ?? []

  return (items as Record<string, unknown>[])
    .map(parseItem)
    .filter((v): v is RssVacancy => Boolean(v.url))
}

function parseItem(item: Record<string, unknown>): RssVacancy {
  const rawTitle = String(item.title ?? '')
  const rawDesc = String(item.description ?? '')
  const link = String(item.link ?? item['@_about'] ?? '')
  const dateStr = String(item.date ?? '')

  // Strip HTML tags from description
  const plainDesc = rawDesc
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  const { isUrgent, rank, vesselType, salary, company } = parseTitle(rawTitle)

  return {
    external_id: link,
    source: 'jobatsea',
    rank,
    company,
    vessel_type: vesselType,
    salary,
    description: plainDesc || null,
    contact_email: extractEmail(plainDesc),
    url: link || null,
    posted_at: dateStr || null,
    is_urgent: isUrgent,
  }
}

function parseTitle(title: string): {
  isUrgent: boolean
  rank: string | null
  vesselType: string | null
  salary: string | null
  company: string | null
} {
  const isUrgent = /^\[urgent\]/i.test(title.trim())
  const cleaned = title.replace(/^\[urgent\]\s*/i, '').trim()

  // Pattern: RANK / VESSEL_TYPE / SALARY at COMPANY
  const atIdx = cleaned.lastIndexOf(' at ')
  const company = atIdx !== -1 ? cleaned.slice(atIdx + 4).trim() || null : null
  const beforeAt = atIdx !== -1 ? cleaned.slice(0, atIdx).trim() : cleaned

  const parts = beforeAt.split(' / ')
  if (parts.length < 2) {
    return { isUrgent, rank: cleaned.trim() || null, vesselType: null, salary: null, company }
  }

  return {
    isUrgent,
    rank: parts[0].trim() || null,
    vesselType: parts[1]?.trim() || null,
    salary: parts[2]?.replace(/\.+$/, '').trim() || null,
    company,
  }
}

function extractEmail(text: string): string | null {
  const match = text.match(/[\w.+\-]+@[\w\-]+\.[a-z]{2,}/i)
  return match ? match[0].toLowerCase() : null
}
