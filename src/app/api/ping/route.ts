import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = createClient()
    
    // Faz uma consulta simples para manter o banco ativo
    const { data, error } = await supabase
      .from('diagnosticos')
      .select('count')
      .limit(1)
    
    if (error) throw error
    
    return NextResponse.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      message: 'Supabase está ativo!'
    })
  } catch (error) {
    console.error('Ping failed:', error)
    return NextResponse.json({ 
      status: 'error', 
      timestamp: new Date().toISOString(),
      message: 'Erro ao pingar Supabase'
    }, { status: 500 })
  }
}
