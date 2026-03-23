import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

let client: ReturnType<typeof createSupabaseClient> | null = null

export function createClient() {
  if (!client) {
    client = createSupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  }
  return client
}
