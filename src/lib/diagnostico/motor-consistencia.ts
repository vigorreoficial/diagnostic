import { createClient } from '@/lib/supabase/client'

export interface Inconsistencia {
  id: string
  tipo: 'CONFLITO' | 'FALTA_EVIDENCIA' | 'DIVERGENCIA' | 'INFORMACAO_INSUFICIENTE'
  gravidade: 'CRITICA' | 'ALTA' | 'MEDIA' | 'BAIXA'
  descricao: string
  modulo_origem: string
  modulo_destino?: string
  respostas_envolvidas: string[]
  recomendacao: string
  status: 'IDENTIFICADO' | 'EM_ANALISE' | 'RESOLVIDO' | 'VALIDADO'
}

export class MotorConsistencia {
  private supabase = createClient()

  /**
   * Analisa todas as respostas em busca de inconsistências
   */
  async analisarConsistencia(projetoId: string): Promise<Inconsistencia[]> {
    const inconsistencias: Inconsistencia[] = []

    try {
      // Buscar todas as respostas do projeto
      const { data: respostas } = await this.supabase
        .from('respostas')
        .select(`
          *,
          perguntas (modulo_area, pergunta, tipo)
        `)
        .eq('projeto_id', projetoId)

      if (!respostas) return []

      // 1. Verificar conflitos entre módulos
      const conflitos = this.verificarConflitos(respostas)
      inconsistencias.push(...conflitos)

      // 2. Verificar respostas sem evidência
      const semEvidencia = await this.verificarEvidenciasFaltantes(projetoId, respostas)
      inconsistencias.push(...semEvidencia)

      // 3. Verificar divergências (ex: diz que tem, mas não tem documento)
      const divergencias = await this.verificarDivergencias(projetoId, respostas)
      inconsistencias.push(...divergencias)

      // 4. Verificar informações insuficientes
      const insuficientes = this.verificarInfoInsuficiente(respostas)
      inconsistencias.push(...insuficientes)

      return inconsistencias
    } catch (error) {
      console.error('Erro ao analisar consistência:', error)
      return []
    }
  }

  /**
   * Verifica conflitos entre respostas de módulos diferentes
   */
  private verificarConflitos(respostas: any[]): Inconsistencia[] {
    const conflitos: Inconsistencia[] = []

    // Agrupar respostas por módulo
    const porModulo: Record<string, any[]> = {}
    for (const r of respostas) {
      const modulo = r.perguntas?.modulo_area || 'DESCONHECIDO'
      if (!porModulo[modulo]) porModulo[modulo] = []
      porModulo[modulo].push(r)
    }

    // Verificar conflitos conhecidos
    // Exemplo: RH diz que tem PDI, mas DP não tem registros de treinamento
    const rhRespostas = porModulo['RH'] || []
    const dpRespostas = porModulo['DP'] || []

    // Verificar PDI vs treinamentos
    const temPDI = rhRespostas.some(r => 
      r.perguntas?.pergunta?.includes('PDI') && r.resposta === true
    )
    const temRegistros = dpRespostas.some(r => 
      r.perguntas?.pergunta?.includes('treinamento') && r.resposta === true
    )

    if (temPDI && !temRegistros) {
      conflitos.push({
        id: `conf-${Date.now()}-1`,
        tipo: 'DIVERGENCIA',
        gravidade: 'ALTA',
        descricao: 'RH informa que existe PDI, mas DP não tem registros de treinamentos documentados.',
        modulo_origem: 'RH',
        modulo_destino: 'DP',
        respostas_envolvidas: [],
        recomendacao: 'Validar se os PDIs estão sendo executados e registrados em DP.',
        status: 'IDENTIFICADO'
      })
    }

    return conflitos
  }

  /**
   * Verifica respostas que afirmam algo sem evidência documental
   */
  private async verificarEvidenciasFaltantes(projetoId: string, respostas: any[]): Promise<Inconsistencia[]> {
    const inconsistencias: Inconsistencia[] = []

    // Buscar evidências do projeto
    const { data: evidencias } = await this.supabase
      .from('evidencias')
      .select('*')
      .eq('projeto_id', projetoId)

    const evidenciasPorPergunta: Record<string, any[]> = {}
    for (const e of evidencias || []) {
      if (e.pergunta_id) {
        if (!evidenciasPorPergunta[e.pergunta_id]) evidenciasPorPergunta[e.pergunta_id] = []
        evidenciasPorPergunta[e.pergunta_id].push(e)
      }
    }

    // Verificar respostas positivas sem evidência
    for (const r of respostas) {
      const resposta = r.resposta
      const pergunta = r.perguntas?.pergunta || ''
      
      // Se resposta for SIM ou positiva
      if (resposta === true || resposta === 'SIM' || (typeof resposta === 'number' && resposta >= 4)) {
        const evidenciasDaPergunta = evidenciasPorPergunta[r.pergunta_id] || []
        
        // Se não tem evidência e é uma pergunta que deveria ter
        if (evidenciasDaPergunta.length === 0 && this.perguntaExigeEvidencia(pergunta)) {
          inconsistencias.push({
            id: `evid-${Date.now()}-${r.id}`,
            tipo: 'FALTA_EVIDENCIA',
            gravidade: 'MEDIA',
            descricao: `Resposta positiva para "${pergunta}" sem evidência documental anexada.`,
            modulo_origem: r.perguntas?.modulo_area || 'DESCONHECIDO',
            respostas_envolvidas: [r.id],
            recomendacao: 'Solicitar o envio de documento que comprove a prática informada.',
            status: 'IDENTIFICADO'
          })
        }
      }
    }

    return inconsistencias
  }

  /**
   * Verifica divergências entre respostas e documentos
   */
  private async verificarDivergencias(projetoId: string, respostas: any[]): Promise<Inconsistencia[]> {
    const inconsistencias: Inconsistencia[] = []

    // Buscar instrumentos coletivos
    const { data: instrumentos } = await this.supabase
      .from('instrumentos_coletivos')
      .select('*')
      .eq('projeto_id', projetoId)
      .eq('status_analise', 'CONCLUIDO')

    if (!instrumentos || instrumentos.length === 0) return []

    // Verificar se as respostas estão alinhadas com a CCT
    for (const inst of instrumentos) {
      const clausulas = inst.clausulas_identificadas || {}
      
      // Exemplo: verificar se há conflito com piso salarial
      if (clausulas.piso_salarial) {
        // Buscar resposta sobre salário
        const respostaSalario = respostas.find(r => 
          r.perguntas?.pergunta?.includes('salário') || 
          r.perguntas?.pergunta?.includes('salarial')
        )
        
        if (respostaSalario && respostaSalario.resposta === false) {
          inconsistencias.push({
            id: `div-${Date.now()}-${inst.id}`,
            tipo: 'DIVERGENCIA',
            gravidade: 'CRITICA',
            descricao: `A CCT/ACT prevê piso salarial, mas a empresa informou não estar em conformidade.`,
            modulo_origem: 'DP',
            respostas_envolvidas: [respostaSalario.id],
            recomendacao: 'Validar urgentemente a situação salarial com DP e jurídico.',
            status: 'IDENTIFICADO'
          })
        }
      }
    }

    return inconsistencias
  }

  /**
   * Verifica respostas com informações insuficientes
   */
  private verificarInfoInsuficiente(respostas: any[]): Inconsistencia[] {
    const inconsistencias: Inconsistencia[] = []

    for (const r of respostas) {
      // Se resposta for "NÃO SEI" ou "PREFIRO NÃO RESPONDER"
      if (r.status === 'NAO_SEI' || r.status === 'PREFIRO_NAO_RESPONDER') {
        // Verificar se a pergunta é crítica
        const pergunta = r.perguntas?.pergunta || ''
        if (this.perguntaCritica(pergunta)) {
          inconsistencias.push({
            id: `info-${Date.now()}-${r.id}`,
            tipo: 'INFORMACAO_INSUFICIENTE',
            gravidade: 'MEDIA',
            descricao: `Pergunta crítica "${pergunta}" não foi respondida adequadamente.`,
            modulo_origem: r.perguntas?.modulo_area || 'DESCONHECIDO',
            respostas_envolvidas: [r.id],
            recomendacao: 'Recomenda-se buscar informações com a área responsável.',
            status: 'IDENTIFICADO'
          })
        }
      }
    }

    return inconsistencias
  }

  /**
   * Verifica se uma pergunta exige evidência documental
   */
  private perguntaExigeEvidencia(pergunta: string): boolean {
    const palavrasChave = [
      'documento', 'contrato', 'política', 'procedimento', 'regulamento',
      'norma', 'certificado', 'licença', 'alvará', 'registro', 'laudo',
      'exame', 'treinamento', 'certificação', 'auditoria'
    ]
    return palavrasChave.some(p => pergunta.toLowerCase().includes(p))
  }

  /**
   * Verifica se uma pergunta é crítica
   */
  private perguntaCritica(pergunta: string): boolean {
    const palavrasChave = [
      'legal', 'obrigação', 'norma', 'lei', 'NR', 'CLT', 'conformidade',
      'risco', 'segurança', 'trabalhista', 'previdenciário', 'fiscal'
    ]
    return palavrasChave.some(p => pergunta.toLowerCase().includes(p))
  }
}

export const motorConsistencia = new MotorConsistencia()
