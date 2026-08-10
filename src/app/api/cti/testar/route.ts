import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { testarConexao } from '@/lib/cti/ai-client'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Buscar configuração
    const { data: configData } = await supabase
      .from('configuracoes')
      .select('*')
      .eq('chave', 'ia_config')
      .single()

    if (!configData) {
      return NextResponse.json(
        { error: 'Configuração não encontrada' },
        { status: 404 }
      )
    }

    const config = configData.valor
    const resultado = await testarConexao(config.provider, config.apiKey, config.model)

    return NextResponse.json(resultado)
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Erro ao testar conexão' },
      { status: 500 }
    )
  }
}
