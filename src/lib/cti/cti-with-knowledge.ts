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

  async analisarModulo(
    moduloId: string,
    respostas: any[],
    usuarioId: string
  ): Promise<CTIAnalysisResult> {
    const { data: modulo } = await this.supabase
      .from('modulos_diagnostico')
      .select('*, projetos_diagnostico(empresa_id)')
      .eq('id', moduloId)
      .single()

    if (!modulo) {
      throw new Error('Módulo não encontrado')
    }

    const { data: perguntas } = await this.supabase
      .from('perguntas')
      .select('*')
      .eq('modulo_area', modulo.area)
      .eq('ativo', true)

    const tags = this.extrairTags(perguntas || [])
    const conhecimento = await knowledgeClient.buscarPorModulo(modulo.area, tags)

    const { data: configData } = await this.supabase
      .from('configuracoes')
      .select('*')
      .eq('chave', 'ia_config')
      .single()

    const config = configData?.valor || { provider: 'gemini', apiKey: '', model: 'gemini-pro' }

    let analise: CTIAnalysisResult

    if (config.apiKey) {
      try {
        const prompt = this.construirPrompt(modulo, respostas, perguntas || [], conhecimento)
        console.log('📝 PROMPT ENVIADO PARA IA:', prompt)
        const respostaIA = await chamarIA(prompt, config.provider, config.apiKey, config.model)
        console.log('🤖 RESPOSTA DA IA:', respostaIA)
        analise = this.extrairAnaliseDaResposta(respostaIA, modulo, respostas, perguntas || [], conhecimento)
      } catch (error) {
        console.error('Erro ao chamar IA:', error)
        analise = await this.gerarAnaliseBaseadaEmRegras(modulo, respostas, perguntas || [], conhecimento)
      }
    } else {
      analise = await this.gerarAnaliseBaseadaEmRegras(modulo, respostas, perguntas || [], conhecimento)
    }

    await this.salvarAnalise(moduloId, analise, usuarioId)

    return analise
  }

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

  private construirPrompt(
    modulo: any,
    respostas: any[],
    perguntas: any[],
    conhecimento: any[]
  ): string {
    // Mapear respostas para um formato legível
    const respostasTexto = perguntas.map((p, index) => {
      const r = respostas.find(r => r.pergunta_id === p.id)
      const valor = r?.resposta
      let textoResposta = 'Não respondido'
      
      if (p.tipo === 'SIM_NAO') {
        textoResposta = valor === true ? '✅ SIM' : '❌ NÃO'
      } else if (p.tipo === 'ESCALA_1_5') {
        textoResposta = `⭐ NOTA ${valor || 0}/5`
      } else if (p.tipo === 'TEXTO') {
        textoResposta = `"${valor || 'Não preenchido'}"`
      } else if (p.tipo === 'MULTIPLA_ESCOLHA') {
        textoResposta = valor || 'Não selecionado'
      }
      
      return `${index + 1}. ${p.pergunta}\n   Resposta: ${textoResposta}`
    }).join('\n\n')

    // Extrair conhecimento relevante
    const conhecimentoTexto = conhecimento.map(k => 
      `• ${k.titulo} (${k.fonte}, v${k.versao})`
    ).join('\n')

    const areaLabel = this.getAreaLabel(modulo.area)

    return `
# INSTRUÇÕES - ANÁLISE DE DIAGNÓSTICO

Você é um consultor especialista em ${areaLabel}.

## MÓDULO ANALISADO: ${modulo.area}

## RESPOSTAS DO QUESTIONÁRIO:
${respostasTexto}

## REFERÊNCIAS DO KNOWLEDGE HUB™:
${conhecimentoTexto || 'Nenhuma referência específica'}

## FORMATO OBRIGATÓRIO DE RESPOSTA:
Responda EXATAMENTE no formato abaixo, sem adicionar textos extras:

---
📊 ANÁLISE DO MÓDULO ${modulo.area}

📌 VISÃO GERAL
[Escreva um parágrafo resumindo a situação da empresa neste módulo, destacando o que está bom e o que precisa melhorar]

📋 PONTOS FORTES
✅ [Item específico que está positivo]
✅ [Item específico que está positivo]

⚠️ PONTOS DE ATENÇÃO
❌ [Item específico que precisa melhorar]
❌ [Item específico que precisa melhorar]
❌ [Item específico que precisa melhorar]

💡 RECOMENDAÇÕES
1. [Ação concreta e específica] - Impacto: ALTO - Prazo: CURTO
2. [Ação concreta e específica] - Impacto: ALTO - Prazo: MÉDIO
3. [Ação concreta e específica] - Impacto: MÉDIO - Prazo: CURTO

📊 CONFORMIDADE
✅ Total de requisitos: [X]
✅ Atendidos: [Y]
📈 Percentual: [Z]%

## REGRAS IMPORTANTES:
1. Use APENAS as respostas fornecidas para analisar
2. Não invente informações que não estão nas respostas
3. Seja específico, cite exemplos das respostas
4. As recomendações devem ser PRÁTICAS e ACIONÁVEIS
5. Use o formato EXATO acima, com os emojis e marcações
6. NÃO adicione introdução, conclusão ou qualquer texto fora do formato

AGORA, ANALISE E RESPONDA EXATAMENTE NO FORMATO ACIMA:
`
  }

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

  private extrairAnaliseDaResposta(
    respostaIA: string,
    modulo: any,
    respostas: any[],
    perguntas: any[],
    conhecimento: any[]
  ): CTIAnalysisResult {
    // Usar a resposta da IA diretamente como parecer
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

  private obterNivelMaturidade(percentual: number): string {
    if (percentual >= 90) return '🏆 Excelência'
    if (percentual >= 75) return '✅ Estratégico'
    if (percentual >= 60) return '📊 Gerenciado'
    if (percentual >= 40) return '📋 Estruturado'
    if (percentual >= 20) return '📝 Básico'
    return '🔴 Inicial'
  }

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
