import { createClient } from '@/lib/supabase/client'
import { knowledgeClient } from './knowledge-client'
import { chamarIA } from './ai-client'

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

    // 4. Buscar configuração da IA
    const { data: configData } = await this.supabase
      .from('configuracoes')
      .select('*')
      .eq('chave', 'ia_config')
      .single()

    const config = configData?.valor || { provider: 'gemini', apiKey: '', model: 'gemini-pro' }

    // 5. Gerar análise usando IA
    let analise: CTIAnalysisResult

    if (config.apiKey) {
      try {
        const prompt = this.construirPrompt(modulo, respostas, perguntas || [], conhecimento)
        const respostaIA = await chamarIA(prompt, config.provider, config.apiKey, config.model)
        analise = this.extrairAnaliseDaResposta(respostaIA, modulo, respostas, perguntas || [], conhecimento)
      } catch (error) {
        console.error('Erro ao chamar IA:', error)
        analise = await this.gerarAnaliseBaseadaEmRegras(modulo, respostas, perguntas || [], conhecimento)
      }
    } else {
      analise = await this.gerarAnaliseBaseadaEmRegras(modulo, respostas, perguntas || [], conhecimento)
    }

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
   * Constrói o prompt para a IA
   */
  private construirPrompt(
    modulo: any,
    respostas: any[],
    perguntas: any[],
    conhecimento: any[]
  ): string {
    // Mapear respostas para um formato legível
    const respostasTexto = perguntas.map((p) => {
      const r = respostas.find(r => r.pergunta_id === p.id)
      const valor = r?.resposta
      let textoResposta = 'Não respondido'
      
      if (p.tipo === 'SIM_NAO') {
        textoResposta = valor === true ? '✅ Sim' : '❌ Não'
      } else if (p.tipo === 'ESCALA_1_5') {
        textoResposta = `Nota ${valor || 0}/5`
      } else if (p.tipo === 'TEXTO') {
        textoResposta = valor || 'Não preenchido'
      } else if (p.tipo === 'MULTIPLA_ESCOLHA') {
        textoResposta = valor || 'Não selecionado'
      }
      
      return `- ${p.pergunta}: ${textoResposta}`
    }).join('\n')

    // Extrair conhecimento relevante
    const conhecimentoTexto = conhecimento.map(k => 
      `📖 ${k.titulo} (${k.fonte}, v${k.versao}): ${k.conteudo?.substring(0, 500)}...`
    ).join('\n')

    const areaLabel = this.getAreaLabel(modulo.area)

    return `
Você é um especialista em ${areaLabel} e Gestão Organizacional.

**OBJETIVO:** Analisar as respostas do questionário e gerar um parecer técnico detalhado.

**MÓDULO:** ${modulo.area} - ${areaLabel}

**RESPOSTAS DO QUESTIONÁRIO:**
${respostasTexto}

**CONHECIMENTO DE REFERÊNCIA (Knowledge Hub™):**
${conhecimentoTexto || 'Nenhuma referência específica encontrada.'}

**INSTRUÇÕES PARA A RESPOSTA:**

1. **Análise Geral:** Comece com uma visão geral do módulo, destacando os pontos fortes e fracos.

2. **Por Resposta:** Analise cada resposta individualmente, explicando o que significa para a empresa.

3. **Recomendações:** Liste ações práticas e priorizadas.

4. **Formato:** Use a estrutura abaixo EXATAMENTE:

📊 ANÁLISE DO MÓDULO ${modulo.area}

📌 VISÃO GERAL
[Parágrafo com análise geral, destacando pontos fortes e fracos]

📋 PONTOS FORTES
✅ [Item identificado como positivo]
✅ [Item identificado como positivo]

⚠️ PONTOS DE ATENÇÃO
❌ [Item que precisa de melhoria]
❌ [Item que precisa de melhoria]

💡 RECOMENDAÇÕES (PRIORIZADAS)
1. [Ação 1] - Impacto: [alto/médio/baixo] - Prazo: [curto/médio/longo]
2. [Ação 2] - Impacto: [alto/médio/baixo] - Prazo: [curto/médio/longo]
3. [Ação 3] - Impacto: [alto/médio/baixo] - Prazo: [curto/médio/longo]

📊 CONFORMIDADE
- Total de requisitos: [X]
- Atendidos: [Y]
- Percentual: [Z]%

5. **Seja específico:** Relacione diretamente com as respostas dadas. Não use frases genéricas.

6. **Não invente:** Se não tiver informação suficiente, diga "Não foi possível avaliar".

7. **Seja prático:** As recomendações devem ser acionáveis.

**SUA RESPOSTA DEVE SER APENAS O PARECER, SEM INTRODUÇÕES ADICIONAIS.**
`
  }

  /**
   * Extrai análise da resposta da IA
   */
  private extrairAnaliseDaResposta(
    respostaIA: string,
    modulo: any,
    respostas: any[],
    perguntas: any[],
    conhecimento: any[]
  ): CTIAnalysisResult {
    // Extrair informações da resposta
    const parecer = respostaIA || 'Análise não disponível'
    
    // Tentar extrair recomendações da resposta
    let recomendacao = 'Consulte o Knowledge Hub™ para mais informações.'
    const recomendacaoMatch = respostaIA.match(/💡 RECOMENDAÇÕES[^]*?(?=📊|$)/)
    if (recomendacaoMatch) {
      recomendacao = recomendacaoMatch[0]
    }

    // Calcular conformidade
    let conformes = 0
    let total = 0
    
    for (const p of perguntas) {
      const r = respostas.find(r => r.pergunta_id === p.id)
      if (r) {
        total++
        if (p.tipo === 'SIM_NAO' && r.resposta === true) conformes++
        else if (p.tipo === 'ESCALA_1_5' && r.resposta >= 4) conformes++
        else if (p.tipo === 'TEXTO' && r.resposta?.length > 10) conformes++
      }
    }

    const percentual = total > 0 ? Math.round((conformes / total) * 100) : 0

    // Determinar prioridade
    let prioridade: 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA' = 'MEDIA'
    if (percentual < 30) prioridade = 'CRITICA'
    else if (percentual < 50) prioridade = 'ALTA'
    else if (percentual < 70) prioridade = 'MEDIA'
    else prioridade = 'BAIXA'

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
      detalhes_requisitos: []
    }
  }

  /**
   * Retorna o label da área
   */
  private getAreaLabel(area: string): string {
    const labels: Record<string, string> = {
      'ESTRATEGIA': 'Estratégia e Governança',
      'RH': 'Recursos Humanos',
      'DP': 'Departamento Pessoal',
      'JURIDICO': 'Jurídico e Compliance',
      'SST': 'Saúde e Segurança do Trabalho',
      'NUTRICAO': 'Nutrição Organizacional',
      'FINANCEIRO': 'Financeiro',
      'COMERCIAL': 'Comercial e Marketing',
      'QUALIDADE': 'Qualidade',
      'MELHORIA_CONTINUA': 'Melhoria Contínua',
      'OPERACOES': 'Operações e Logística',
      'COMPRAS': 'Compras e Suprimentos',
      'TI': 'Tecnologia da Informação',
      'AGRO': 'Agronegócio'
    }
    return labels[area] || area
  }

  /**
   * Gera análise baseada em regras (fallback)
   */
  private async gerarAnaliseBaseadaEmRegras(
    modulo: any,
    respostas: any[],
    perguntas: any[],
    conhecimento: any[]
  ): Promise<CTIAnalysisResult> {
    let conformes = 0
    let total = 0
    const detalhes: any[] = []

    for (const p of perguntas) {
      const r = respostas.find(r => r.pergunta_id === p.id)
      if (r) {
        total++
        let conforme = false
        let justificativa = ''

        if (p.tipo === 'SIM_NAO') {
          conforme = r.resposta === true
          justificativa = conforme 
            ? '✅ Atende ao requisito' 
            : '❌ Não atende ao requisito'
        } else if (p.tipo === 'ESCALA_1_5') {
          conforme = r.resposta >= 4
          justificativa = conforme 
            ? `✅ Atende (nota ${r.resposta}/5)` 
            : `⚠️ Precisa melhorar (nota ${r.resposta}/5)`
        } else if (p.tipo === 'TEXTO') {
          conforme = r.resposta?.length > 10
          justificativa = conforme 
            ? '✅ Resposta detalhada' 
            : '⚠️ Resposta muito curta'
        }

        if (conforme) conformes++
        detalhes.push({
          requisito: p.pergunta,
          conforme,
          justificativa
        })
      }
    }

    const percentual = total > 0 ? Math.round((conformes / total) * 100) : 0

    let prioridade: 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA' = 'MEDIA'
    if (percentual < 30) prioridade = 'CRITICA'
    else if (percentual < 50) prioridade = 'ALTA'
    else if (percentual < 70) prioridade = 'MEDIA'
    else prioridade = 'BAIXA'

    const areaLabel = this.getAreaLabel(modulo.area)

    let parecer = `📊 **Análise do Módulo ${areaLabel}**\n\n`
    parecer += `A empresa apresenta **${percentual}% de conformidade** com os requisitos avaliados.\n\n`
    parecer += `**Resumo:**\n`
    parecer += `• ${conformes} de ${total} requisitos atendidos\n`
    parecer += `• Nível de maturidade: ${this.obterNivelMaturidade(percentual)}\n\n`

    const naoConformes = detalhes.filter(d => !d.conforme)
    if (naoConformes.length > 0) {
      parecer += `**⚠️ Pontos de atenção:**\n`
      naoConformes.slice(0, 3).forEach(d => {
        parecer += `• ${d.requisito}\n`
      })
      if (naoConformes.length > 3) {
        parecer += `• +${naoConformes.length - 3} outros itens\n`
      }
    }

    let recomendacao = `**Recomendações:**\n\n`
    if (percentual < 50) {
      recomendacao += `🔴 **Prioridade Alta:** A empresa precisa implementar ações corretivas imediatas nos seguintes aspectos:\n`
      naoConformes.slice(0, 3).forEach(d => {
        recomendacao += `• ${d.requisito} - ${d.justificativa}\n`
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
      detalhes_requisitos: detalhes
    }
  }

  /**
   * Retorna o nível de maturidade
   */
  private obterNivelMaturidade(percentual: number): string {
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
