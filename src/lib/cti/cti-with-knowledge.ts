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
  detalhes_requisitos: {
    requisito: string
    conforme: boolean
    justificativa: string
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

    // 5. Gerar análise inteligente comparando respostas com conhecimento
    const analise = await this.gerarAnaliseInteligente(
      modulo,
      respostas,
      perguntas || [],
      conhecimento
    )

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
   * Gera análise inteligente comparando respostas com conhecimento
   */
  private async gerarAnaliseInteligente(
    modulo: any,
    respostas: any[],
    perguntas: any[],
    conhecimento: any[]
  ): Promise<CTIAnalysisResult> {
    // ============================================
    // 1. ANALISAR CADA PERGUNTA COM BASE NO CONHECIMENTO
    // ============================================
    const detalhesRequisitos: any[] = []
    let conformidadeTotal = 0
    let totalRequisitos = 0

    for (const pergunta of perguntas || []) {
      const resposta = respostas.find(r => r.pergunta_id === pergunta.id)
      const conhecimentoRelevante = conhecimento.filter(k =>
        k.tags.some((tag: string) => pergunta.pergunta.includes(tag)) ||
        k.modulo_area === modulo.area
      )

      // Determinar se a resposta está conforme
      let conforme = false
      let justificativa = ''
      let requisito = pergunta.pergunta

      if (resposta) {
        totalRequisitos++

        // Para perguntas Sim/Não
        if (pergunta.tipo === 'SIM_NAO') {
          conforme = resposta.resposta === true
          if (conhecimentoRelevante.length > 0) {
            const fonte = conhecimentoRelevante[0]
            justificativa = conforme
              ? `✅ Conforme. A resposta está alinhada com ${fonte.titulo} (v${fonte.versao})`
              : `❌ Não conforme. ${fonte.titulo} (v${fonte.versao}) exige que a empresa atenda a este requisito.`
          } else {
            justificativa = conforme
              ? '✅ Conforme com as boas práticas'
              : '❌ Não conforme. Recomenda-se consultar o Knowledge Hub™ para mais informações.'
          }
        }
        // Para perguntas de escala
        else if (pergunta.tipo === 'ESCALA_1_5') {
          const valor = resposta.resposta || 0
          conforme = valor >= 4
          if (conhecimentoRelevante.length > 0) {
            const fonte = conhecimentoRelevante[0]
            justificativa = conforme
              ? `✅ Conforme (nota ${valor}/5). ${fonte.titulo} recomenda boas práticas.`
              : `⚠️ Atenção (nota ${valor}/5). ${fonte.titulo} indica que a empresa deve melhorar neste aspecto.`
          } else {
            justificativa = conforme
              ? `✅ Conforme (nota ${valor}/5)`
              : `⚠️ Atenção (nota ${valor}/5). Recomenda-se melhoria.`
          }
        }
        // Para perguntas de texto
        else if (pergunta.tipo === 'TEXTO') {
          const texto = resposta.resposta || ''
          conforme = texto.length > 10
          justificativa = conforme
            ? '✅ Resposta detalhada fornecida'
            : '⚠️ Resposta muito curta. Recomenda-se detalhar mais.'
        }
        // Para múltipla escolha
        else if (pergunta.tipo === 'MULTIPLA_ESCOLHA') {
          const opcoes = pergunta.opcoes || []
          const primeiraOpcao = opcoes[0] || ''
          conforme = resposta.resposta === primeiraOpcao
          justificativa = conforme
            ? '✅ Selecionou a melhor opção'
            : '⚠️ A empresa pode considerar a opção recomendada.'
        }

        if (conforme) conformidadeTotal++
      }

      detalhesRequisitos.push({
        requisito,
        conforme,
        justificativa,
        conhecimento_utilizado: conhecimentoRelevante.map(k => k.titulo).join(', ')
      })
    }

    // ============================================
    // 2. CALCULAR PERCENTUAL DE CONFORMIDADE
    // ============================================
    const percentual = totalRequisitos > 0
      ? Math.round((conformidadeTotal / totalRequisitos) * 100)
      : 0

    // ============================================
    // 3. DETERMINAR PRIORIDADE
    // ============================================
    let prioridade: 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA' = 'MEDIA'
    if (percentual < 30) prioridade = 'CRITICA'
    else if (percentual < 50) prioridade = 'ALTA'
    else if (percentual < 70) prioridade = 'MEDIA'
    else prioridade = 'BAIXA'

    // ============================================
    // 4. GERAR PARECER DETALHADO
    // ============================================
    let parecer = ''
    let recomendacao = ''

    const fontesUsadas = conhecimento.map(k => k.fonte).join(', ')

    if (conhecimento.length > 0) {
      parecer = `🔍 **Análise do Módulo ${modulo.area}**\n\n`
      parecer += `Com base nas respostas fornecidas e na consulta ao Knowledge Hub™ (${fontesUsadas}), `
      parecer += `a empresa apresenta **${percentual}% de conformidade** com os requisitos avaliados.\n\n`
      parecer += `**Resumo:**\n`
      parecer += `• ${conformidadeTotal} de ${totalRequisitos} requisitos atendidos\n`
      parecer += `• Nível de maturidade: ${this.getNivelMaturidade(percentual)}\n\n`

      // Adicionar itens não conformes
      const naoConformes = detalhesRequisitos.filter(r => !r.conforme)
      if (naoConformes.length > 0) {
        parecer += `**⚠️ Pontos de atenção:**\n`
        naoConformes.slice(0, 3).forEach(r => {
          parecer += `• ${r.requisito}\n`
        })
        if (naoConformes.length > 3) {
          parecer += `• +${naoConformes.length - 3} outros itens\n`
        }
      }

      recomendacao = `**Recomendações:**\n\n`
      if (percentual < 50) {
        recomendacao += `🔴 **Prioridade Alta:** A empresa precisa implementar ações corretivas imediatas nos seguintes aspectos:\n`
        naoConformes.slice(0, 3).forEach(r => {
          recomendacao += `• ${r.requisito} - ${r.justificativa}\n`
        })
        recomendacao += `\n📋 Consulte o Knowledge Hub™ para obter as referências completas.`
      } else if (percentual < 70) {
        recomendacao += `🟡 **Prioridade Média:** A empresa possui conformidade parcial. Recomenda-se:\n`
        recomendacao += `• Fortalecer os pontos com baixa conformidade\n`
        recomendacao += `• Manter as boas práticas já implementadas\n`
        recomendacao += `• Monitorar indicadores para evolução contínua`
      } else {
        recomendacao += `🟢 **Boa prática:** A empresa apresenta alta conformidade. Recomenda-se:\n`
        recomendacao += `• Manter o ritmo de melhoria contínua\n`
        recomendacao += `• Compartilhar as boas práticas com outras áreas\n`
        recomendacao += `• Buscar certificações para consolidar o nível de maturidade`
      }
    } else {
      parecer = `📋 **Análise do Módulo ${modulo.area}**\n\n`
      parecer += `A empresa apresenta **${percentual}% de conformidade** com os requisitos avaliados.\n\n`
      parecer += `**Resumo:**\n`
      parecer += `• ${conformidadeTotal} de ${totalRequisitos} requisitos atendidos\n`
      parecer += `• Nível de maturidade: ${this.getNivelMaturidade(percentual)}\n\n`
      parecer += `💡 Consulte o Knowledge Hub™ para mais referências sobre este módulo.`

      recomendacao = `**Recomendações:**\n\n`
      recomendacao += `📚 Acesse o Knowledge Hub™ para obter informações detalhadas sobre leis, normas e boas práticas relacionadas a este módulo.`
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
      })),
      detalhes_requisitos: detalhesRequisitos
    }
  }

  /**
   * Retorna o nível de maturidade baseado no percentual
   */
  private getNivelMaturidade(percentual: number): string {
    if (percentual >= 90) return '🏆 Excelência'
    if (percentual >= 75) return '✅ Estratégico'
    if (percentual >= 60) return '📊 Gerenciado'
    if (percentual >= 40) return '📋 Estruturado'
    if (percentual >= 20) return '📝 Básico'
    return '🔴 Inicial'
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
