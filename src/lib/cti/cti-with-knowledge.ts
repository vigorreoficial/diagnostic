// src/lib/cti/cti-with-knowledge.ts
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
        const respostaIA = await chamarIA(prompt, config.provider, config.apiKey, config.model)
        // Agora processamos a resposta para extrair informações estruturadas
        analise = this.processarRespostaIA(respostaIA, modulo, respostas, perguntas || [], conhecimento)
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
    const respostasTexto = perguntas.map((p, index) => {
      const r = respostas.find(r => r.pergunta_id === p.id)
      const valor = r?.resposta
      let textoResposta = 'Não respondido'
      
      if (p.tipo === 'SIM_NAO') {
        textoResposta = valor === true ? 'SIM' : 'NÃO'
      } else if (p.tipo === 'ESCALA_1_5') {
        textoResposta = `NOTA ${valor || 0}/5`
      } else if (p.tipo === 'TEXTO') {
        textoResposta = `"${valor || 'Não preenchido'}"`
      } else if (p.tipo === 'MULTIPLA_ESCOLHA') {
        textoResposta = valor || 'Não selecionado'
      }
      
      return `${index + 1}. ${p.pergunta}\n   Resposta: ${textoResposta}`
    }).join('\n\n')

    const conhecimentoTexto = conhecimento.map(k => 
      `• ${k.titulo} (${k.fonte}, v${k.versao})`
    ).join('\n')

    const areaLabel = this.getAreaLabel(modulo.area)

    return `
# ANÁLISE DO MÓDULO ${modulo.area} - ${areaLabel}

## RESPOSTAS:
${respostasTexto}

## REFERÊNCIAS:
${conhecimentoTexto || 'Nenhuma referência específica'}

## TAREFA:
Analise as respostas acima e responda APENAS as seguintes perguntas:

1. Quais são os 3 principais pontos fortes da empresa neste módulo? (responda com frases curtas)
2. Quais são os 3 principais pontos de melhoria? (responda com frases curtas)
3. Liste 3 ações práticas e específicas que a empresa deve implementar.
4. Qual o percentual aproximado de conformidade? (0-100)

Responda em formato de lista simples, sem markdown, sem emojis.
`
  }

  private processarRespostaIA(
    respostaIA: string,
    modulo: any,
    respostas: any[],
    perguntas: any[],
    conhecimento: any[]
  ): CTIAnalysisResult {
    // Calcular conformidade real
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

    // Extrair informações da resposta da IA
    const linhas = respostaIA.split('\n').filter(l => l.trim())
    let pontosFortes: string[] = []
    let pontosMelhoria: string[] = []
    let acoes: string[] = []

    let secao = ''
    for (const linha of linhas) {
      const l = linha.toLowerCase()
      if (l.includes('forte') || l.includes('ponto forte') || l.includes('pontos fortes')) {
        secao = 'fortes'
      } else if (l.includes('melhoria') || l.includes('ponto de melhoria') || l.includes('pontos de melhoria')) {
        secao = 'melhoria'
      } else if (l.includes('aç') || l.includes('acao') || l.includes('ações') || l.includes('ação')) {
        secao = 'acoes'
      } else if (l.match(/^\d+\./) || l.match(/^[•\-]/)) {
        const texto = linha.replace(/^[\d\.\s•\-]+/, '').trim()
        if (secao === 'fortes' && texto) pontosFortes.push(texto)
        else if (secao === 'melhoria' && texto) pontosMelhoria.push(texto)
        else if (secao === 'acoes' && texto) acoes.push(texto)
      }
    }

    // Se não conseguiu extrair, usar fallback
    if (pontosFortes.length === 0) {
      const respostasSim = perguntas.filter((p, i) => {
        const r = respostas.find(r => r.pergunta_id === p.id)
        return r?.resposta === true
      })
      if (respostasSim.length > 0) {
        pontosFortes = respostasSim.slice(0, 3).map(p => p.pergunta)
      } else {
        pontosFortes = ['Nenhum ponto forte identificado']
      }
    }

    if (pontosMelhoria.length === 0) {
      const respostasNao = perguntas.filter((p, i) => {
        const r = respostas.find(r => r.pergunta_id === p.id)
        return r?.resposta === false || (r?.resposta < 4 && r?.resposta > 0)
      })
      if (respostasNao.length > 0) {
        pontosMelhoria = respostasNao.slice(0, 3).map(p => p.pergunta)
      } else {
        pontosMelhoria = ['Nenhum ponto de melhoria identificado']
      }
    }

    if (acoes.length === 0) {
      acoes = pontosMelhoria.map(p => `Implementar melhorias em: ${p}`)
    }

    // Construir parecer estruturado
    const areaLabel = this.getAreaLabel(modulo.area)
    const nivel = this.obterNivelMaturidade(percentual)
    
    let parecer = `📊 **ANÁLISE DO MÓDULO ${areaLabel}**\n\n`
    parecer += `📌 **VISÃO GERAL**\n`
    parecer += `A empresa apresenta **${percentual}% de conformidade** com os requisitos avaliados, `
    parecer += `atingindo o nível **${nivel}**.\n`
    parecer += `Foram avaliados ${total} requisitos, dos quais ${conformes} foram atendidos.\n\n`
    
    parecer += `📋 **PONTOS FORTES**\n`
    pontosFortes.slice(0, 3).forEach(p => {
      parecer += `✅ ${p}\n`
    })
    parecer += `\n`
    
    parecer += `⚠️ **PONTOS DE ATENÇÃO**\n`
    pontosMelhoria.slice(0, 3).forEach(p => {
      parecer += `❌ ${p}\n`
    })
    parecer += `\n`
    
    parecer += `💡 **RECOMENDAÇÕES PRIORIZADAS**\n`
    acoes.slice(0, 3).forEach((acao, i) => {
      const prioridade = i === 0 ? '🔴 ALTA' : i === 1 ? '🟡 MÉDIA' : '🟢 BAIXA'
      const prazo = i === 0 ? 'CURTO' : i === 1 ? 'MÉDIO' : 'LONGO'
      parecer += `${i+1}. ${acao}\n`
      parecer += `   Impacto: ${prioridade} | Prazo: ${prazo}\n`
    })

    let prioridadeFinal: 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA' = 'MEDIA'
    if (percentual < 30) prioridadeFinal = 'CRITICA'
    else if (percentual < 50) prioridadeFinal = 'ALTA'
    else if (percentual < 70) prioridadeFinal = 'MEDIA'
    else prioridadeFinal = 'BAIXA'

    const recomendacao = `🔴 **Prioridade ${prioridadeFinal}:** Implementar as ações recomendadas acima, com foco nos pontos de atenção identificados.`

    return {
      parecer,
      recomendacao,
      prioridade: prioridadeFinal,
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
    const nivel = this.obterNivelMaturidade(percentual)

    let parecer = `📊 **ANÁLISE DO MÓDULO ${areaLabel}**\n\n`
    parecer += `📌 **VISÃO GERAL**\n`
    parecer += `A empresa apresenta **${percentual}% de conformidade** com os requisitos avaliados, `
    parecer += `atingindo o nível **${nivel}**.\n`
    parecer += `Foram avaliados ${total} requisitos, dos quais ${conformes} foram atendidos.\n\n`
    
    const respostasSim = perguntas.filter((p) => {
      const r = respostas.find(r => r.pergunta_id === p.id)
      return r?.resposta === true
    })
    
    parecer += `📋 **PONTOS FORTES**\n`
    if (respostasSim.length > 0) {
      respostasSim.slice(0, 3).forEach(p => {
        parecer += `✅ ${p.pergunta}\n`
      })
    } else {
      parecer += `✅ Nenhum ponto forte identificado\n`
    }
    parecer += `\n`
    
    const respostasNao = perguntas.filter((p) => {
      const r = respostas.find(r => r.pergunta_id === p.id)
      return r?.resposta === false || (r?.resposta < 4 && r?.resposta > 0)
    })
    
    parecer += `⚠️ **PONTOS DE ATENÇÃO**\n`
    if (respostasNao.length > 0) {
      respostasNao.slice(0, 3).forEach(p => {
        parecer += `❌ ${p.pergunta}\n`
      })
    } else {
      parecer += `❌ Nenhum ponto de atenção identificado\n`
    }
    parecer += `\n`
    
    parecer += `💡 **RECOMENDAÇÕES PRIORIZADAS**\n`
    const acoes = respostasNao.map(p => `Implementar melhorias em: ${p.pergunta}`)
    if (acoes.length > 0) {
      acoes.slice(0, 3).forEach((acao, i) => {
        const prioridadeTexto = i === 0 ? '🔴 ALTA' : i === 1 ? '🟡 MÉDIA' : '🟢 BAIXA'
        const prazo = i === 0 ? 'CURTO' : i === 1 ? 'MÉDIO' : 'LONGO'
        parecer += `${i+1}. ${acao}\n`
        parecer += `   Impacto: ${prioridadeTexto} | Prazo: ${prazo}\n`
      })
    } else {
      parecer += `✅ Nenhuma recomendação necessária\n`
    }

    const recomendacao = `🔴 **Prioridade ${prioridade}:** Implementar as ações recomendadas acima, com foco nos pontos de atenção identificados.`

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
