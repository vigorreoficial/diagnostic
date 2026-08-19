import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = createClient()
    
    // Tenta fazer uma consulta simples para manter o banco ativo
    const { data, error } = await supabase
      .from('diagnosticos')
      .select('count', { count: 'exact', head: true })
    
    if (error) {
      console.error('Erro ao pingar Supabase:', error)
      return NextResponse.json(
        { 
          status: 'error', 
          timestamp: new Date().toISOString(),
          message: 'Erro ao conectar com Supabase',
          error: error.message
        },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        message: 'Supabase está ativo!',
        data: data
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Ping failed:', error)
    return NextResponse.json(
      { 
        status: 'error', 
        timestamp: new Date().toISOString(),
        message: 'Erro ao pingar Supabase',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}
