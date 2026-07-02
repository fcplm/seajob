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

  const plainDesc = rawDesc
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  const { isUrgent, rank, vesselType, salary: titleSalary, company } = parseTitle(rawTitle)
  const salary = titleSalary ?? extractSalaryFromDesc(plainDesc)

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

// Titles from jobatsea have two formats:
// [Urgent] RANK for VESSEL 2700 $ at COMPANY    (salary in title)
// [Full-time] RANK on/for/to join (a/the) VESSEL at COMPANY
function parseTitle(title: string): {
  isUrgent: boolean
  rank: string | null
  vesselType: string | null
  salary: string | null
  company: string | null
} {
  const isUrgent = /\[urgent\]/i.test(title)
  const cleaned = title.replace(/^\[[^\]]+\]\s*/i, '').trim()

  // Company = everything after last " at "
  const atIdx = cleaned.lastIndexOf(' at ')
  const company = atIdx !== -1 ? cleaned.slice(atIdx + 4).trim() || null : null
  const main = (atIdx !== -1 ? cleaned.slice(0, atIdx) : cleaned).trim()

  // Inline salary: "2700 $" or "2700$" at the end of main
  const salaryMatch = main.match(/\s+(\d[\d,]+)\s*\$\s*$/)
  const salary = salaryMatch ? `$${salaryMatch[1]}` : null
  const mainClean = salaryMatch
    ? main.slice(0, main.length - salaryMatch[0].length).trim()
    : main

  // Extract rank and vessel via connector words
  const connectorRe =
    /^(.+?)\s+(?:on(?:\s+(?:the|a|an))?|for(?:\s+(?:the|a|an))?|to\s+join(?:\s+(?:the|a|an))?|join(?:\s+(?:the|a|an))?)\s+(.+)$/i
  const m = mainClean.match(connectorRe)

  if (!m) {
    return { isUrgent, rank: mainClean || null, vesselType: null, salary, company }
  }

  const rank = m[1].trim()
  let vessel = m[2].trim()

  // Trim trailing noise: "on the 15th of July…", "in the Netherlands", "for 6 weeks"
  vessel = vessel
    .replace(/\s+on\s+the\s+\d+\w*\s+of\s+.*/i, '')
    .replace(/\s+in\s+(?:the\s+)?\w[\w\s]*$/i, '')
    .replace(/\s+for\s+\d+\s+\w+$/i, '')
    .trim()

  return { isUrgent, rank: rank || null, vesselType: vessel || null, salary, company }
}

function extractSalaryFromDesc(text: string): string | null {
  const m = text.match(/(?:wage|salary)[:\s]+(?:is\s+)?(\$?[\d,]+(?:\s*USD)?)/i)
  if (!m) return null
  const raw = m[1].replace(/\s*USD/i, '').trim()
  return raw.startsWith('$') ? raw : `$${raw}`
}

function extractEmail(text: string): string | null {
  const match = text.match(/[\w.+\-]+@[\w\-]+\.[a-z]{2,}/i)
  return match ? match[0].toLowerCase() : null
}
