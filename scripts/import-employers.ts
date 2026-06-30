import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import * as dotenv from 'dotenv'

dotenv.config({ path: resolve(process.cwd(), '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const CSV_PATH = resolve(process.env.HOME!, 'Downloads/employers_import.csv')

async function main() {
  const text = readFileSync(CSV_PATH, 'utf-8')
  const lines = text.trim().split('\n').slice(1) // skip header

  const rows = lines
    .map(line => {
      const firstComma = line.indexOf(',')
      const secondComma = line.indexOf(',', firstComma + 1)
      const company = line.slice(0, firstComma).trim() || null
      const email = line.slice(firstComma + 1, secondComma).trim().toLowerCase()
      const fleet_type = line.slice(secondComma + 1).trim()
      return { company, email, fleet_type, is_active: true }
    })
    .filter(r => r.email.includes('@') && r.fleet_type)

  console.log(`Importing ${rows.length} employers...`)

  // Upsert in batches of 500
  for (let i = 0; i < rows.length; i += 500) {
    const batch = rows.slice(i, i + 500)
    const { error } = await supabase
      .from('employers')
      .upsert(batch, { onConflict: 'email', ignoreDuplicates: false })
    if (error) { console.error('Batch error:', error.message); process.exit(1) }
    console.log(`  ${Math.min(i + 500, rows.length)} / ${rows.length}`)
  }

  console.log('Done!')
}

main().catch(console.error)
