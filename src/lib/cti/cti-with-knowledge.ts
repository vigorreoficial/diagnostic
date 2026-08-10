import { createClient } from '@/lib/supabase/client'
import { knowledgeClient } from './knowledge-client'

export interface CTIAnalysisResult {
  parecer: string
  recomendacao: string
  prioridade: 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA'
  confianca: number
  fontes_utilizadas: {
    id: string
    titulo: string
    fonte: string
    versao: string
  }[]
}

export class CTIWithKnowledge {
  private supabase = createClient()

  /**
   * Analisa um módulo com base nas respostas e consulta o Knowledge Hub™
   */
  async analisarModulo(
    moduloId: string,
    respostas: any[],
    usuarioId: string
  ): Promise<CTIAnalysisResult> {
    // 1. Buscar informações do módulo
    const { data: modulo } = await this.supabase
      .from('modulos_diagnostico')
      .select('*, projetos_diagnostico(empresa_id)')
      .eq('id', moduloId)
      .single()

    if (!modulo) {
      throw new Error('Módulo não encontrado')
    }

    // 2. Buscar perguntas do módulo
    const { data: perguntas } = await this.supabase
      .from('perguntas')
      .select('*')
      .eq('modulo_area', modulo.area)
      .eq('ativo', true)

    // 3. Buscar conhecimento relevante no Knowledge Hub™
    const tags = this.extrairTags(perguntas || [])
    const conhecimento = await knowledgeClient.buscarPorModulo(modulo.area, tags)

    // 4. Registrar consultas no log
    for (const item of conhecimento) {
      await knowledgeClient.registrarConsulta(
        item.id,
        `Análise do módulo ${modulo.area}`,
        modulo.area,
        usuarioId
      )
    }

    // 5. Gerar análise combinando respostas e conhecimento
    const analise = await this.gerarAnalise(modulo, respostas, perguntas || [], conhecimento)

    // 6. Salvar análise no banco
    await this.salvarAnalise(moduloId, analise, usuarioId)

    return analise
  }

  /**
   * Extrai tags das perguntas
   */
  private extrairTags(perguntas: any[]): string[] {
    const tags: string[] = []
    for (const p of perguntas) {
      if (p.pergunta.includes('NR-')) {
        const nrMatch = p.pergunta.match(/NR-(\d+)/)
        if (nrMatch) tags.push(`NR-${nrMatch[1]}`)
      }
      if (p.pergunta.includes('ISO')) {
        const isoMatch = p.pergunta.match(/ISO\s*(\d+)/)
        if (isoMatch) tags.push(`ISO ${isoMatch[1]}`)
      }
      if (p.pergunta.includes('CLT')) {
        tags.push('CLT')
      }
      if (p.pergunta.includes('LGPD')) {
        tags.push('LGPD')
      }
    }
    return tags
  }

  /**
   * Gera análise combinando respostas e conhecimento
   */
  private async gerarAnalise(
    modulo: any,
    respostas: any[],
    perguntas: any[],
    conhecimento: any[]
  ): Promise<CTIAnalysisResult> {
    // Calcular pontuação base
    let pontuacao = 0
    let totalPeso = 0

    for (const pergunta of perguntas || []) {
      const resposta = respostas.find(r => r.pergunta_id === pergunta.id)
      if (resposta) {
        totalPeso += pergunta.peso || 1
        if (pergunta.tipo === 'SIM_NAO') {
          pontuacao += resposta.resposta === true ? pergunta.peso : 0
        } else if (pergunta.tipo === 'ESCALA_1_5') {
          pontuacao += (resposta.resposta / 5) * pergunta.peso
        }
      }
    }

    const percentual = totalPeso > 0 ? Math.round((pontuacao / totalPeso) * 100) : 0

    // Determinar prioridade
    let prioridade: 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA' = 'MEDIA'
    if (percentual < 30) prioridade = 'CRITICA'
    else if (percentual < 50) prioridade = 'ALTA'
    else if (percentual < 70) prioridade = 'MEDIA'
    else prioridade = 'BAIXA'

    // Gerar parecer com base no conhecimento
    let parecer = ''
    let recomendacao = ''

    if (conhecimento && conhecimento.length > 0) {
      // Usar conhecimento do Hub para fundamentar
      const fontes = conhecimento.map(k => k.fonte).join(', ')
      parecer = `Com base na análise do módulo ${modulo.area} e nas fontes consultadas (${fontes}), `
      parecer += `a empresa apresenta ${percentual >= 70 ? 'boa' : percentual >= 50 ? 'média' : 'baixa'} conformidade. `
      parecer += `Foram considerados ${conhecimento.length} referências do Knowledge Hub™ para esta análise.`

      recomendacao = `Recomenda-se ${percentual < 50 ? 'priorizar ações corretivas' : 'manter e fortalecer'} `
      recomendacao += `as práticas atuais, com foco em ${percentual < 50 ? 'melhorar os pontos críticos' : 'melhoria contínua'}.`
    } else {
      parecer = `A empresa apresenta ${percentual >= 70 ? 'boa' : percentual >= 50 ? 'média' : 'baixa'} conformidade `
      parecer += `no módulo ${modulo.area}. Consulte o Knowledge Hub™ para mais referências sobre este tópico.`

      recomendacao = `Recomenda-se ${percentual < 50 ? 'implementar ações corretivas' : 'manter as práticas atuais'} `
      recomendacao += `e consultar o Knowledge Hub™ para obter mais informações.`
    }

    return {
      parecer,
      recomendacao,
      prioridade,
      confianca: Math.min(0.95, 0.5 + (percentual / 100) * 0.4),
      fontes_utilizadas: (conhecimento || []).map(k => ({
        id: k.id,
        titulo: k.titulo,
        fonte: k.fonte,
        versao: k.versao
      }))
    }
  }

  /**
   * Salva a análise no banco
   */
  private async salvarAnalise(
    moduloId: string,
    analise: CTIAnalysisResult,
    usuarioId: string
  ) {
    try {
      await this.supabase
        .from('analises_cti')
        .insert({
          modulo_id: moduloId,
          especialista: 'CTI™ com Knowledge Hub™',
          parecer: analise.parecer,
          recomendacao: analise.recomendacao,
          prioridade: analise.prioridade,
          confianca: analise.confianca,
          created_at: new Date().toISOString()
        })
    } catch (error) {
      console.error('Erro ao salvar análise:', error)
    }
  }
}

export const ctiWithKnowledge = new CTIWithKnowledge()
