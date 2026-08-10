import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ctiWithKnowledge } from '@/lib/cti/cti-with-knowledge'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const { moduloId, respostas } = await request.json()

    if (!moduloId) {
      return NextResponse.json(
        { error: 'Módulo não informado' },
        { status: 400 }
      )
    }

    // Buscar usuário na tabela public
    const { data: usuario } = await supabase
      .from('usuarios')
      .select('id')
      .eq('auth_user_id', user.id)
      .single()

    if (!usuario) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    // Executar análise com Knowledge Hub™
    const resultado = await ctiWithKnowledge.analisarModulo(
      moduloId,
      respostas || [],
      usuario.id
    )

    return NextResponse.json({
      success: true,
      data: resultado
    })

  } catch (error: any) {
    console.error('Erro na análise CTI:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao processar análise' },
      { status: 500 }
    )
  }
}
