import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { parseJobatseaRss } from '@/lib/vacancies/parse-rss'
import type { Database } from '@/lib/supabase/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const RSS_URL = 'https://jobatsea.online/rss/all/'

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const secret = process.env.CRON_SECRET
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  let xml: string
  try {
    const res = await fetch(RSS_URL, {
      headers: { 'User-Agent': 'SeaJob/1.0 (RSS reader)' },
      next: { revalidate: 0 },
    })
    xml = await res.text()
  } catch (err) {
    return NextResponse.json({ error: `Fetch failed: ${String(err)}` }, { status: 502 })
  }

  const vacancies = parseJobatseaRss(xml)
  if (vacancies.length === 0) {
    return NextResponse.json({ synced: 0 })
  }

  const { error } = await supabase
    .from('vacancies')
    .upsert(vacancies, { onConflict: 'external_id', ignoreDuplicates: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ synced: vacancies.length })
}

export async function GET(req: Request) {
  return POST(req as NextRequest)
}
