import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL || ''
const key = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

if (!url || !key) {
  console.error(
    '[ProcurementAI] VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is not set. ' +
    'Add them to your Vercel project environment variables and redeploy.'
  )
}

// Fall back to placeholder values so the module loads even when env vars are missing.
// All Supabase calls will fail gracefully with network errors rather than crashing the app.
export const supabase = createClient(
  url  || 'https://placeholder.supabase.co',
  key  || 'placeholder-anon-key',
)
