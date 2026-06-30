import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import type { Database } from '@/lib/supabase/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const BATCH_SIZE = 50

function getServiceClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(req: NextRequest) {
  return POST(req)
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const secret = process.env.CRON_SECRET
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getServiceClient()
  const resend = new Resend(process.env.RESEND_API_KEY)

  // Find the oldest pending or running campaign
  const { data: campaigns } = await supabase
    .from('send_campaigns')
    .select('*')
    .in('status', ['pending', 'running'])
    .order('created_at', { ascending: true })
    .limit(1)

  const campaign = campaigns?.[0]
  if (!campaign) return NextResponse.json({ processed: 0 })

  // Mark as running
  await supabase
    .from('send_campaigns')
    .update({ status: 'running' })
    .eq('id', campaign.id)

  // Fetch next batch of pending jobs with employer email
  const { data: jobs } = await supabase
    .from('send_jobs')
    .select('id, employer_id')
    .eq('campaign_id', campaign.id)
    .eq('status', 'pending')
    .limit(BATCH_SIZE)

  if (!jobs || jobs.length === 0) {
    // No more pending jobs — mark campaign done
    await supabase
      .from('send_campaigns')
      .update({ status: 'done', completed_at: new Date().toISOString() })
      .eq('id', campaign.id)
    return NextResponse.json({ processed: 0, done: true })
  }

  // Fetch employer emails for this batch
  const employerIds = jobs.map(j => j.employer_id)
  const { data: employers } = await supabase
    .from('employers')
    .select('id, email')
    .in('id', employerIds)

  const emailByEmployerId = Object.fromEntries(
    (employers ?? []).map(e => [e.id, e.email])
  )

  // Prepare attachment from stored base64 PDF
  const pdfBuffer = campaign.resume_pdf_b64
    ? Buffer.from(campaign.resume_pdf_b64, 'base64')
    : null

  let sentCount = 0
  let failedCount = 0

  for (const job of jobs) {
    const toEmail = emailByEmployerId[job.employer_id]
    if (!toEmail || !pdfBuffer) {
      await supabase
        .from('send_jobs')
        .update({ status: 'failed', error: 'missing_email_or_pdf' })
        .eq('id', job.id)
      failedCount++
      continue
    }

    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev',
      to: toEmail,
      subject: `Application — ${campaign.fleet_type}`,
      text: campaign.cover_letter ?? 'Please find attached my resume. Sent via SeaJob.',
      attachments: [
        {
          filename: 'resume.pdf',
          content: pdfBuffer,
        },
      ],
    })

    if (error) {
      await supabase
        .from('send_jobs')
        .update({ status: 'failed', error: error.message })
        .eq('id', job.id)
      failedCount++
    } else {
      await supabase
        .from('send_jobs')
        .update({ status: 'sent', sent_at: new Date().toISOString() })
        .eq('id', job.id)
      sentCount++
    }
  }

  // Update campaign counters
  await supabase
    .from('send_campaigns')
    .update({
      sent_count: campaign.sent_count + sentCount,
      failed_count: campaign.failed_count + failedCount,
    })
    .eq('id', campaign.id)

  return NextResponse.json({ processed: jobs.length, sent: sentCount, failed: failedCount })
}
