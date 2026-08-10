import { NextRequest, NextResponse } from 'next/server'
import { renderToStream } from '@react-pdf/renderer'
import { createClient } from '@/lib/supabase/server'
import { RelatorioPDF } from '@/lib/pdf/renderer'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { diagnosticoId, tipo } = await request.json()

    if (!diagnosticoId || !tipo) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })
    }

    // Buscar dados
    const { data: diagnostico } = await supabase
      .from('projetos_diagnostico')
      .select('*, empresas(nome)')
      .eq('id', diagnosticoId)
      .single()

    const { data: modulos } = await supabase
      .from('modulos_diagnostico')
      .select('*')
      .eq('projeto_id', diagnosticoId)

    const { data: analises } = await supabase
      .from('analises_cti')
      .select('*')
      .in('modulo_id', modulos?.map(m => m.id) || [])

    const { data: knowledge } = await supabase
      .from('knowledge_base_audit')
      .select('knowledge_id, knowledge_base(*)')
      .limit(20)

    // Gerar PDF
    const pdfStream = await renderToStream(
      <RelatorioPDF
        diagnostico={diagnostico}
        modulos={modulos || []}
        analises={analises || []}
        knowledge={knowledge || []}
        tipo={tipo}
      />
    )

    return new NextResponse(pdfStream as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=relatorio_${diagnosticoId}_${tipo}.pdf`
      }
    })

  } catch (error) {
    console.error('Erro ao gerar PDF:', error)
    return NextResponse.json({ error: 'Erro ao gerar PDF' }, { status: 500 })
  }
}
