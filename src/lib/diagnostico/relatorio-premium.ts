// src/lib/diagnostico/relatorio-premium.ts
import { createClient } from '@/lib/supabase/server'

export interface RelatorioPremium {
  // Cabeçalho
  titulo: string
  empresa: string
  data: string
  versao: string

  // Resumo Executivo
  resumo: string
  imv: number
  maturidade: number
  conformidade: number
  risco: number
  confianca: number

  // Forças e Lacunas
  pontos_fortes: string[]
  lacunas: string[]

  // Prioridades
  prioridades: {
    modulo: string
    item: string
    impacto: 'CRITICO' | 'ALTO' | 'MEDIO' | 'BAIXO'
    recomendacao: string
  }[]

  // Análise por Módulo
  modulos: {
    nome: string
    area: string
    maturidade: number
    conformidade: number
    risco: number
    cobertura: number
    pontos_fortes: string[]
    pontos_atencao: string[]
    recomendacoes: string[]
  }[]

  // Inconsistências
  inconsistencias: {
    descricao: string
    gravidade: string
    recomendacao: string
  }[]

  // Documentos
  documentos: {
    nome: string
    tipo: string
    valido: boolean
    validade?: string
  }[]

  // CCT/ACT
  instrumentos: {
    titulo: string
    tipo: string
    vigencia: string
    clausulas: string[]
  }[]

  // Metadados
  cobertura: number
  total_perguntas: number
  respondidas: number
  nao_aplicaveis: number
}

export class GeradorRelatorioPremium {
  /**
   * Gera um relatório premium completo
   */
  async gerarRelatorio(projetoId: string): Promise<RelatorioPremium> {
    // ✅ Cliente criado dentro do método (server-side)
    const supabase = createClient()

    try {
      // Buscar dados do projeto
      const { data: projeto } = await supabase
        .from('projetos_diagnostico')
        .select(`
          *,
          empresas (nome, cnpj, porte, segmento)
        `)
        .eq('id', projetoId)
        .single()

      if (!projeto) {
        throw new Error('Projeto não encontrado')
      }

      // Buscar respostas
      const { data: respostas } = await supabase
        .from('respostas')
        .select(`
          *,
          perguntas (modulo_area, pergunta, tipo)
        `)
        .eq('projeto_id', projetoId)

      // Buscar módulos
      const modulosAplicaveis = projeto.modulos_aplicaveis || []

      // Buscar análises CTI
      const { data: analises } = await supabase
        .from('analises_cti')
        .select('*')
        .eq('projeto_id', projetoId)

      // Buscar inconsistências
      const { data: inconsistencias } = await supabase
        .from('inconsistencias')
        .select('*')
        .eq('projeto_id', projetoId)

      // Buscar evidências
      const { data: evidencias } = await supabase
        .from('evidencias')
        .select('*')
        .eq('projeto_id', projetoId)

      // Buscar instrumentos coletivos
      const { data: instrumentos } = await supabase
        .from('instrumentos_coletivos')
        .select('*')
        .eq('projeto_id', projetoId)
        .eq('status_analise', 'CONCLUIDO')

      // Gerar o relatório
      const relatorio: RelatorioPremium = {
        titulo: projeto.titulo || 'Diagnóstico Vigorre',
        empresa: projeto.empresas?.nome || 'Empresa não identificada',
        data: new Date().toISOString(),
        versao: '3.0 "QUANTUM"',

        resumo: this.gerarResumo(projeto, analises || []),
        imv: projeto.imv || 0,
        maturidade: projeto.maturidade || 0,
        conformidade: projeto.conformidade || 0,
        risco: projeto.risco || 0,
        confianca: projeto.confianca || 0,

        pontos_fortes: this.identificarPontosFortes(respostas || [], analises || []),
        lacunas: this.identificarLacunas(respostas || [], analises || []),

        prioridades: this.gerarPrioridades(analises || []),

        modulos: this.gerarModulos(modulosAplicaveis, analises || []),

        inconsistencias: (inconsistencias || []).map(i => ({
          descricao: i.descricao,
          gravidade: i.gravidade,
          recomendacao: i.recomendacao
        })),

        documentos: (evidencias || []).map(e => ({
          nome: e.nome_arquivo,
          tipo: e.tipo,
          valido: e.validado || false,
          validade: e.data_validade
        })),

        instrumentos: (instrumentos || []).map(i => ({
          titulo: i.titulo,
          tipo: i.tipo,
          vigencia: `${i.vigencia_inicio} até ${i.vigencia_fim}`,
          clausulas: i.clausulas_identificadas ? Object.keys(i.clausulas_identificadas) : []
        })),

        cobertura: projeto.cobertura || 0,
        total_perguntas: projeto.total_perguntas || 0,
        respondidas: projeto.respondidas || 0,
        nao_aplicaveis: projeto.nao_aplicaveis || 0
      }

      return relatorio
    } catch (error) {
      console.error('Erro ao gerar relatório:', error)
      throw error
    }
  }

  private gerarResumo(projeto: any, analises: any[]): string {
    const imv = projeto.imv || 0
    const maturidade = projeto.maturidade || 0
    const risco = projeto.risco || 0

    let resumo = `A organização apresenta uma maturidade ${this.obterNivelTexto(maturidade)} `
    resumo += `com IMV™ de ${imv} pontos. `

    if (risco > 70) {
      resumo += '⚠️ Atenção: riscos elevados identificados. '
    } else if (risco > 50) {
      resumo += '🟡 Riscos moderados. '
    } else {
      resumo += '✅ Riscos controlados. '
    }

    if (analises.length > 0) {
      const criticas = analises.filter(a => a.prioridade === 'CRITICA')
      if (criticas.length > 0) {
        resumo += `🔴 ${criticas.length} itens críticos identificados. `
      }
    }

    return resumo
  }

  private obterNivelTexto(nivel: number): string {
    if (nivel >= 80) return 'Excelência'
    if (nivel >= 60) return 'Gerenciado'
    if (nivel >= 40) return 'Estruturado'
    if (nivel >= 20) return 'Básico'
    return 'Inicial'
  }

  private identificarPontosFortes(respostas: any[], analises: any[]): string[] {
    const fortes: string[] = []
    
    for (const r of respostas) {
      if (r.resposta === true || r.resposta === 'SIM' || (typeof r.resposta === 'number' && r.resposta >= 4)) {
        const pergunta = r.perguntas?.pergunta || ''
        if (pergunta && fortes.length < 10) {
          fortes.push(`✅ ${pergunta}`)
        }
      }
    }

    return fortes
  }

  private identificarLacunas(respostas: any[], analises: any[]): string[] {
    const lacunas: string[] = []
    
    for (const r of respostas) {
      if (r.resposta === false || r.resposta === 'NAO' || (typeof r.resposta === 'number' && r.resposta < 3)) {
        const pergunta = r.perguntas?.pergunta || ''
        if (pergunta && lacunas.length < 10) {
          lacunas.push(`❌ ${pergunta}`)
        }
      }
    }

    return lacunas
  }

  private gerarPrioridades(analises: any[]): any[] {
    const prioridades: any[] = []

    for (const a of analises) {
      if (a.prioridade === 'CRITICA' || a.prioridade === 'ALTA') {
        prioridades.push({
          modulo: a.modulo_area,
          item: a.recomendacao || 'Item pendente',
          impacto: a.prioridade === 'CRITICA' ? 'CRITICO' : 'ALTO',
          recomendacao: a.recomendacao || 'Ação necessária'
        })
      }
    }

    return prioridades.slice(0, 10)
  }

  private gerarModulos(modulosAplicaveis: string[], analises: any[]): any[] {
    return modulosAplicaveis.map(area => {
      const analise = analises.find(a => a.modulo_area === area)
      return {
        nome: this.obterNomeModulo(area),
        area: area,
        maturidade: analise?.maturidade || 0,
        conformidade: analise?.conformidade || 0,
        risco: analise?.risco || 0,
        cobertura: analise?.cobertura_percentual || 0,
        pontos_fortes: this.extrairPontosFortes(analise?.parecer || ''),
        pontos_atencao: this.extrairPontosAtencao(analise?.parecer || ''),
        recomendacoes: this.extrairRecomendacoes(analise?.recomendacao || '')
      }
    })
  }

  private obterNomeModulo(area: string): string {
    const nomes: Record<string, string> = {
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
    return nomes[area] || area
  }

  private extrairPontosFortes(parecer: string): string[] {
    const fortes: string[] = []
    const linhas = parecer.split('\n')
    for (const linha of linhas) {
      if (linha.includes('✅') || linha.includes('forte') || linha.includes('positivo')) {
        fortes.push(linha.trim())
      }
    }
    return fortes.slice(0, 5)
  }

  private extrairPontosAtencao(parecer: string): string[] {
    const atencao: string[] = []
    const linhas = parecer.split('\n')
    for (const linha of linhas) {
      if (linha.includes('❌') || linha.includes('atenção') || linha.includes('crítico') || linha.includes('risco')) {
        atencao.push(linha.trim())
      }
    }
    return atencao.slice(0, 5)
  }

  private extrairRecomendacoes(recomendacao: string): string[] {
    return recomendacao.split('\n')
      .filter(l => l.trim().length > 0)
      .slice(0, 5)
  }
}

export const geradorRelatorioPremium = new GeradorRelatorioPremium()
