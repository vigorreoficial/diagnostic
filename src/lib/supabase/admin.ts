// src/lib/supabase/admin.ts
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * Cria um cliente Supabase com SERVICE_ROLE_KEY para operações administrativas.
 * ⚠️ NUNCA use este cliente no frontend ou exponha a chave no navegador.
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
