// src/lib/supabase/server.ts
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * Cria um cliente Supabase para uso em API Routes, getServerSideProps,
 * ou qualquer código server-side no Pages Router.
 */
export function createClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
