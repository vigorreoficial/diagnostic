// Cálculo Inteligente - Pesos dinâmicos e índices

export interface ResultadoModulo {
  area: string
  nome: string
  aplicavel: boolean
  peso_efetivo: number
  pontuacao: number
  maturidade: number
  conformidade: number
  risco: number
  cobertura: number
  respostas: {
    total: number
    respondidas: number
    nao_aplicaveis: number
    nao_sei: number
  }
  inconsistencias: string[]
  fontes_utilizadas: string[]
}

export interface ResultadoDiagnostico {
  imv: number
  maturidade: number
  conformidade: number
  risco: number
  confianca: number
  cobertura: number
  modulos: ResultadoModulo[]
  inconsistencias: string[]
  prioridades: {
    modulo: string
    item: string
    impacto: 'CRITICO' | 'ALTO' | 'MEDIO' | 'BAIXO'
    recomendacao: string
  }[]
}

export class CalculoInteligente {

  /**
   * Calcula o diagnóstico completo com pesos dinâmicos
   */
  calcularDiagnostico(modulos: ResultadoModulo[]): ResultadoDiagnostico {
    // Filtrar módulos aplicáveis
    const aplicaveis = modulos.filter(m => m.aplicavel)
    
    if (aplicaveis.length === 0) {
      return this.diagnosticoVazio()
    }

    // Calcular índices ponderados
    let totalPeso = 0
    let totalMaturidade = 0
    let totalConformidade = 0
    let totalRisco = 0
    let totalCobertura = 0

    for (const modulo of aplicaveis) {
      const peso = modulo.peso_efetivo / 100
      totalPeso += peso
      totalMaturidade += modulo.maturidade * peso
      totalConformidade += modulo.conformidade * peso
      totalRisco += modulo.risco * peso
      totalCobertura += modulo.cobertura * peso
    }

    // Normalizar
    const imv = totalPeso > 0 ? Math.round(totalMaturidade) : 0
    const maturidade = totalPeso > 0 ? Math.round(totalMaturidade) : 0
    const conformidade = totalPeso > 0 ? Math.round(totalConformidade) : 0
    const risco = totalPeso > 0 ? Math.round(totalRisco) : 0
    const cobertura = totalPeso > 0 ? Math.round(totalCobertura) : 0

    // Confiança baseada na cobertura
    const confianca = cobertura >= 80 ? 0.95 : cobertura >= 60 ? 0.75 : cobertura >= 40 ? 0.50 : 0.30

    // Identificar inconsistências
    const inconsistencias = this.identificarInconsistencias(modulos)

    // Prioridades
    const prioridades = this.gerarPrioridades(modulos)

    return {
      imv,
      maturidade,
      conformidade,
      risco,
      confianca,
      cobertura,
      modulos: aplicaveis,
      inconsistencias,
      prioridades
    }
  }

  private identificarInconsistencias(modulos: ResultadoModulo[]): string[] {
    const inconsistencias: string[] = []
    
    // Exemplo: verificar se RH tem PDI mas DP não tem registros
    const rh = modulos.find(m => m.area === 'RH')
    const dp = modulos.find(m => m.area === 'DP')
    
    if (rh && dp) {
      // Placeholder - lógica real virá com os dados
    }

    return inconsistencias
  }

  private gerarPrioridades(modulos: ResultadoModulo[]): any[] {
    const prioridades: any[] = []
    
    for (const modulo of modulos) {
      if (modulo.risco > 70) {
        prioridades.push({
          modulo: modulo.nome,
          item: 'Risco elevado identificado',
          impacto: 'CRITICO',
          recomendacao: 'Ação imediata necessária'
        })
      }
    }

    return prioridades.slice(0, 5)
  }

  private diagnosticoVazio(): ResultadoDiagnostico {
    return {
      imv: 0,
      maturidade: 0,
      conformidade: 0,
      risco: 0,
      confianca: 0,
      cobertura: 0,
      modulos: [],
      inconsistencias: [],
      prioridades: []
    }
  }
}

export const calculoInteligente = new CalculoInteligente()
