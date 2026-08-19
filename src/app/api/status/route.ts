import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = createClient()
  
  // Pega o último ping
  const { data: lastPing, error } = await supabase
    .from('_ping_logs') // Crie esta tabela se quiser
    .select('created_at')
    .order('created_at', { ascending: false })
    .limit(1)
  
  const now = new Date()
  const lastPingTime = lastPing?.[0]?.created_at || null
  
  return NextResponse.json({
    status: 'ok',
    lastPing: lastPingTime,
    serverTime: now.toISOString(),
    uptime: process.uptime(),
    database: error ? 'error' : 'connected'
  })
}
