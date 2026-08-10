import { createClient } from '@/lib/supabase/client'

export interface PerguntaAdaptativa {
  id: string
  modulo_area: string
  submodulo?: string
  pergunta: string
  descricao_ajuda?: string
  tipo: 'SIM_NAO' | 'ESCALA_1_5' | 'TEXTO' | 'MULTIPLA_ESCOLHA' | 'NUMERICO'
  opcoes?: string[]
  peso_base: number
  fator_criticidade: number
  categoria: string
  condicao_aplicabilidade?: {
    campo: string
    operador: 'eq' | 'neq' | 'gt' | 'lt' | 'in' | 'contains'
    valor: any
  }
  tags: string[]
  ativo: boolean
  ordem: number
}

export class PerguntasAdaptativas {
  private supabase = createClient()

  /**
   * Busca perguntas de um módulo, aplicando as condições de aplicabilidade
   */
  async buscarPerguntasDoModulo(
    moduloArea: string,
    caracteristicas: Record<string, any>
  ): Promise<PerguntaAdaptativa[]> {
    try {
      // Buscar todas as perguntas do módulo
      const { data: perguntas, error } = await this.supabase
        .from('perguntas')
        .select('*')
        .eq('modulo_area', moduloArea)
        .eq('ativo', true)
        .order('ordem', { ascending: true })

      if (error) {
        throw error
      }

      // Filtrar perguntas aplicáveis
      const aplicaveis = perguntas?.filter(p => {
        return this.isPerguntaAplicavel(p, caracteristicas)
      }) || []

      return aplicaveis
    } catch (error) {
      console.error('Erro ao buscar perguntas:', error)
      return []
    }
  }

  /**
   * Verifica se uma pergunta é aplicável com base nas características da empresa
   */
  private isPerguntaAplicavel(
    pergunta: any,
    caracteristicas: Record<string, any>
  ): boolean {
    // Se não tem condição, é sempre aplicável
    if (!pergunta.condicao_aplicabilidade) {
      return true
    }

    const condicao = pergunta.condicao_aplicabilidade
    const valor = caracteristicas[condicao.campo]

    switch (condicao.operador) {
      case 'eq':
        return valor === condicao.valor
      case 'neq':
        return valor !== condicao.valor
      case 'gt':
        return valor > condicao.valor
      case 'lt':
        return valor < condicao.valor
      case 'in':
        return Array.isArray(condicao.valor) && condicao.valor.includes(valor)
      case 'contains':
        return Array.isArray(valor) && valor.includes(condicao.valor)
      default:
        return true
    }
  }

  /**
   * Gera a árvore de perguntas para um módulo
   */
  async gerarArvorePerguntas(
    moduloArea: string,
    projetoId: string,
    caracteristicas: Record<string, any>
  ): Promise<{
    pergunta: PerguntaAdaptativa
    subperguntas?: PerguntaAdaptativa[]
  }[]> {
    const arvore: any[] = []

    try {
      // Buscar perguntas principais (sem submodulo)
      const { data: principais } = await this.supabase
        .from('perguntas')
        .select('*')
        .eq('modulo_area', moduloArea)
        .is('submodulo', null)
        .eq('ativo', true)
        .order('ordem', { ascending: true })

      if (!principais) return []

      for (const principal of principais) {
        if (!this.isPerguntaAplicavel(principal, caracteristicas)) {
          continue
        }

        // Buscar subperguntas
        const { data: subperguntas } = await this.supabase
          .from('perguntas')
          .select('*')
          .eq('modulo_area', moduloArea)
          .eq('submodulo', principal.id)
          .eq('ativo', true)
          .order('ordem', { ascending: true })

        const subAplicaveis = subperguntas?.filter(s => 
          this.isPerguntaAplicavel(s, caracteristicas)
        ) || []

        arvore.push({
          pergunta: principal,
          subperguntas: subAplicaveis
        })
      }

      return arvore
    } catch (error) {
      console.error('Erro ao gerar árvore de perguntas:', error)
      return []
    }
  }

  /**
   * Busca perguntas por tags
   */
  async buscarPorTags(tags: string[]): Promise<PerguntaAdaptativa[]> {
    try {
      const { data, error } = await this.supabase
        .from('perguntas')
        .select('*')
        .contains('tags', tags)
        .eq('ativo', true)
        .order('ordem', { ascending: true })

      if (error) {
        throw error
      }

      return data || []
    } catch (error) {
      console.error('Erro ao buscar por tags:', error)
      return []
    }
  }

  /**
   * Busca perguntas por categoria
   */
  async buscarPorCategoria(categoria: string): Promise<PerguntaAdaptativa[]> {
    try {
      const { data, error } = await this.supabase
        .from('perguntas')
        .select('*')
        .eq('categoria', categoria)
        .eq('ativo', true)
        .order('ordem', { ascending: true })

      if (error) {
        throw error
      }

      return data || []
    } catch (error) {
      console.error('Erro ao buscar por categoria:', error)
      return []
    }
  }

  /**
   * Busca perguntas obrigatórias (legais)
   */
  async buscarPerguntasObrigatorias(moduloArea?: string): Promise<PerguntaAdaptativa[]> {
    try {
      let query = this.supabase
        .from('perguntas')
        .select('*')
        .eq('categoria', 'OBRIGACAO_LEGAL')
        .eq('ativo', true)
        .order('ordem', { ascending: true })

      if (moduloArea) {
        query = query.eq('modulo_area', moduloArea)
      }

      const { data, error } = await query

      if (error) {
        throw error
      }

      return data || []
    } catch (error) {
      console.error('Erro ao buscar perguntas obrigatórias:', error)
      return []
    }
  }

  /**
   * Busca perguntas por módulo e submodulo
   */
  async buscarPorModuloESubmodulo(
    moduloArea: string,
    submodulo: string
  ): Promise<PerguntaAdaptativa[]> {
    try {
      const { data, error } = await this.supabase
        .from('perguntas')
        .select('*')
        .eq('modulo_area', moduloArea)
        .eq('submodulo', submodulo)
        .eq('ativo', true)
        .order('ordem', { ascending: true })

      if (error) {
        throw error
      }

      return data || []
    } catch (error) {
      console.error('Erro ao buscar por módulo e submodulo:', error)
      return []
    }
  }
}

export const perguntasAdaptativas = new PerguntasAdaptativas()

// ============================================
// DADOS INICIAIS - PERGUNTAS DO MÓDULO RH
// ============================================

export const perguntasRhIniciais = [
  // Estratégia e Cultura
  {
    modulo_area: 'RH',
    submodulo: null,
    pergunta: 'A empresa possui missão, visão e valores definidos e comunicados?',
    tipo: 'ESCALA_1_5',
    peso_base: 8,
    fator_criticidade: 1.2,
    categoria: 'BOA_PRATICA',
    tags: ['Estratégia', 'Cultura'],
    ordem: 1
  },
  {
    modulo_area: 'RH',
    submodulo: null,
    pergunta: 'Os valores organizacionais são praticados pela liderança no dia a dia?',
    tipo: 'ESCALA_1_5',
    peso_base: 8,
    fator_criticidade: 1.3,
    categoria: 'BOA_PRATICA',
    tags: ['Liderança', 'Cultura'],
    ordem: 2
  },
  // Processos de Gestão
  {
    modulo_area: 'RH',
    submodulo: null,
    pergunta: 'A empresa possui processos de gestão de pessoas documentados e padronizados?',
    tipo: 'ESCALA_1_5',
    peso_base: 8,
    fator_criticidade: 1.2,
    categoria: 'BOA_PRATICA',
    tags: ['Processos', 'Gestão'],
    ordem: 3
  },
  {
    modulo_area: 'RH',
    submodulo: null,
    pergunta: 'Existem reuniões gerenciais periódicas para alinhamento de equipes?',
    tipo: 'SIM_NAO',
    peso_base: 6,
    fator_criticidade: 1.0,
    categoria: 'BOA_PRATICA',
    tags: ['Reuniões', 'Alinhamento'],
    ordem: 4
  },
  {
    modulo_area: 'RH',
    submodulo: null,
    pergunta: 'A empresa realiza feedback estruturado (avaliação de desempenho, feedback 360°)?',
    tipo: 'ESCALA_1_5',
    peso_base: 8,
    fator_criticidade: 1.2,
    categoria: 'BOA_PRATICA',
    tags: ['Feedback', 'Desempenho'],
    ordem: 5
  },
  // Liderança e Comunicação
  {
    modulo_area: 'RH',
    submodulo: null,
    pergunta: 'Os colaboradores têm acesso transparente aos processos e decisões da empresa?',
    tipo: 'ESCALA_1_5',
    peso_base: 7,
    fator_criticidade: 1.1,
    categoria: 'BOA_PRATICA',
    tags: ['Transparência', 'Comunicação'],
    ordem: 6
  },
  {
    modulo_area: 'RH',
    submodulo: null,
    pergunta: 'A liderança promove reuniões de alinhamento e comunicação com suas equipes?',
    tipo: 'ESCALA_1_5',
    peso_base: 7,
    fator_criticidade: 1.0,
    categoria: 'BOA_PRATICA',
    tags: ['Liderança', 'Comunicação'],
    ordem: 7
  },
  // Gestão de Talentos
  {
    modulo_area: 'RH',
    submodulo: null,
    pergunta: 'A empresa mapeia a jornada completa do colaborador (onboarding até desligamento)?',
    tipo: 'SIM_NAO',
    peso_base: 7,
    fator_criticidade: 1.1,
    categoria: 'BOA_PRATICA',
    tags: ['Jornada', 'Colaborador'],
    ordem: 8
  },
  {
    modulo_area: 'RH',
    submodulo: null,
    pergunta: 'Existe um programa estruturado de onboarding com duração mínima de 30 dias?',
    tipo: 'ESCALA_1_5',
    peso_base: 6,
    fator_criticidade: 1.0,
    categoria: 'BOA_PRATICA',
    tags: ['Onboarding', 'Integração'],
    ordem: 9
  },
  {
    modulo_area: 'RH',
    submodulo: null,
    pergunta: 'Existe Plano de Desenvolvimento Individual (PDI) para todos os colaboradores?',
    tipo: 'SIM_NAO',
    peso_base: 6,
    fator_criticidade: 1.1,
    categoria: 'BOA_PRATICA',
    tags: ['PDI', 'Desenvolvimento'],
    ordem: 10
  },
  {
    modulo_area: 'RH',
    submodulo: null,
    pergunta: 'A empresa investe em upskilling e reskilling com orçamento definido?',
    tipo: 'ESCALA_1_5',
    peso_base: 8,
    fator_criticidade: 1.2,
    categoria: 'BOA_PRATICA',
    tags: ['Upskilling', 'Capacitação'],
    ordem: 11
  },
  // Clima e Bem-Estar
  {
    modulo_area: 'RH',
    submodulo: null,
    pergunta: 'A empresa realiza pesquisas de clima organizacional com ações baseadas nos resultados?',
    tipo: 'SIM_NAO',
    peso_base: 7,
    fator_criticidade: 1.2,
    categoria: 'BOA_PRATICA',
    tags: ['Clima', 'Pesquisa'],
    ordem: 12
  },
  {
    modulo_area: 'RH',
    submodulo: null,
    pergunta: 'A empresa oferece programas estruturados de saúde mental e bem-estar?',
    tipo: 'ESCALA_1_5',
    peso_base: 8,
    fator_criticidade: 1.3,
    categoria: 'BOA_PRATICA',
    tags: ['Saúde', 'Bem-estar'],
    ordem: 13
  }
]
