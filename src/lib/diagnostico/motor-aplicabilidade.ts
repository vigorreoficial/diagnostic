// Motor de Aplicabilidade - Determina o que é aplicável para cada empresa

export interface EmpresaDNA {
  id: string
  nome: string
  cnpj: string
  cnae: string
  cnaes_secundarios: string[]
  porte: 'MEI' | 'MICRO' | 'PEQUENA' | 'MEDIA' | 'GRANDE'
  segmento: string
  setor: string
  numero_funcionarios: number
  numero_terceiros: number
  possui_filiais: boolean
  estados_atuacao: string[]
  caracteristicas: {
    possui_empregados_clt?: boolean
    possui_estagiarios?: boolean
    possui_aprendizes?: boolean
    possui_pcd?: boolean
    possui_terceiros?: boolean
    possui_trabalho_remoto?: boolean
    possui_trabalho_externo?: boolean
    possui_trabalho_noturno?: boolean
    possui_turnos?: boolean
    trabalha_domingos?: boolean
    trabalha_feriados?: boolean
    possui_banco_horas?: boolean
    possui_frota?: boolean
    possui_maquinas?: boolean
    possui_producao?: boolean
    possui_estoque?: boolean
    possui_armazem?: boolean
    possui_produtos_quimicos?: boolean
    possui_inflamaveis?: boolean
    possui_eletricidade?: boolean
    possui_trabalho_altura?: boolean
    possui_espaco_confinado?: boolean
    possui_atividades_rurais?: boolean
    possui_atividades_ambientais?: boolean
    possui_alimentos?: boolean
    possui_atividades_reguladas?: boolean
    possui_operacoes_internacionais?: boolean
    importa?: boolean
    exporta?: boolean
    presta_servicos_externos?: boolean
    trabalha_orgaos_publicos?: boolean
    possui_certificacoes?: string[]
  }
}

export interface ModuloAplicavel {
  id: string
  nome: string
  area: string
  aplicavel: boolean
  razao: string
  peso_base: number
  fator_criticidade: number
  fator_relevancia: number
  peso_efetivo: number
  perguntas: string[]
}

export class MotorAplicabilidade {
  
  /**
   * Determina quais módulos são aplicáveis para a empresa
   */
  determinarModulosAplicaveis(empresa: EmpresaDNA): ModuloAplicavel[] {
    const modulos = [
      this.avaliarEstrategia(empresa),
      this.avaliarRH(empresa),
      this.avaliarDP(empresa),
      this.avaliarJuridico(empresa),
      this.avaliarSST(empresa),
      this.avaliarNutricao(empresa),
      this.avaliarFinanceiro(empresa),
      this.avaliarComercial(empresa),
      this.avaliarQualidade(empresa),
      this.avaliarMelhoriaContinua(empresa),
      this.avaliarOperacoes(empresa),
      this.avaliarCompras(empresa),
      this.avaliarTI(empresa),
      this.avaliarAgro(empresa),
    ]

    // Calcular pesos efetivos
    const totalPeso = modulos.filter(m => m.aplicavel).reduce((acc, m) => acc + m.peso_base, 0)
    
    modulos.forEach(m => {
      if (m.aplicavel && totalPeso > 0) {
        m.peso_efetivo = Math.round((m.peso_base / totalPeso) * 100)
      } else {
        m.peso_efetivo = 0
      }
    })

    return modulos
  }

  // ============================================
  // AVALIAÇÃO DE CADA MÓDULO
  // ============================================

  private avaliarEstrategia(empresa: EmpresaDNA): ModuloAplicavel {
    return {
      id: 'ESTRATEGIA',
      nome: 'Estratégia e Governança',
      area: 'ESTRATEGIA',
      aplicavel: true, // Sempre aplicável
      razao: 'Toda empresa precisa de estratégia',
      peso_base: 10,
      fator_criticidade: 1.0,
      fator_relevancia: 1.0,
      peso_efetivo: 0,
      perguntas: [
        'A empresa possui missão, visão e valores definidos?',
        'Existe planejamento estratégico formal?',
        'A governança é clara e documentada?'
      ]
    }
  }

  private avaliarRH(empresa: EmpresaDNA): ModuloAplicavel {
    const temEmpregados = empresa.numero_funcionarios > 0
    
    return {
      id: 'RH',
      nome: 'Recursos Humanos',
      area: 'RH',
      aplicavel: temEmpregados,
      razao: temEmpregados ? 'Empresa possui colaboradores' : 'Empresa não possui colaboradores',
      peso_base: 10,
      fator_criticidade: temEmpregados ? 1.2 : 0,
      fator_relevancia: temEmpregados ? 1.0 : 0,
      peso_efetivo: 0,
      perguntas: temEmpregados ? [
        'Possui missão, visão e valores definidos e comunicados?',
        'Os valores são praticados pela liderança?',
        'Possui processos de gestão de pessoas documentados?',
        'Existem reuniões gerenciais periódicas?',
        'Realiza feedback estruturado?',
        'Colaboradores têm acesso transparente aos processos?',
        'Liderança promove reuniões de alinhamento?',
        'Colaboradores têm acesso à diretoria?',
        'Existe transparência nas decisões estratégicas?',
        'Mapeia a jornada completa do colaborador?',
        'Possui programa estruturado de onboarding?',
        'Existe Plano de Desenvolvimento Individual (PDI)?',
        'Investe em upskilling e reskilling?',
        'Possui processo estruturado de sucessão?',
        'Realiza pesquisa de clima organizacional?',
        'Oferece programas de saúde mental e bem-estar?',
        'Possui programas de educação financeira?',
        'Existem metas formais de diversidade?'
      ] : []
    }
  }

  private avaliarDP(empresa: EmpresaDNA): ModuloAplicavel {
    const temEmpregados = empresa.numero_funcionarios > 0
    
    return {
      id: 'DP',
      nome: 'Departamento Pessoal',
      area: 'DP',
      aplicavel: temEmpregados,
      razao: temEmpregados ? 'Empresa possui colaboradores CLT' : 'Empresa não possui colaboradores CLT',
      peso_base: 8,
      fator_criticidade: temEmpregados ? 1.5 : 0,
      fator_relevancia: temEmpregados ? 1.2 : 0,
      peso_efetivo: 0,
      perguntas: temEmpregados ? [
        'O processo de admissão é formal e documentado?',
        'Os contratos de trabalho são registrados corretamente?',
        'Existe controle de jornada e ponto?',
        'As horas extras são controladas e pagas corretamente?',
        'Existe banco de horas instituído?',
        'As férias são concedidas e pagas no prazo?',
        'O 13º salário é pago corretamente?',
        'A folha de pagamento é calculada corretamente?',
        'Os encargos trabalhistas são recolhidos em dia?',
        'Os benefícios são concedidos conforme legislação?',
        'As rescisões são calculadas corretamente?',
        'O FGTS é recolhido mensalmente?',
        'O INSS é recolhido corretamente?',
        'O IRRF é retido corretamente?',
        'O eSocial é utilizado corretamente?',
        'A empresa está em dia com as obrigações do eSocial?'
      ] : []
    }
  }

  private avaliarJuridico(empresa: EmpresaDNA): ModuloAplicavel {
    return {
      id: 'JURIDICO',
      nome: 'Jurídico e Compliance',
      area: 'JURIDICO',
      aplicavel: true,
      razao: 'Toda empresa está sujeita a riscos jurídicos',
      peso_base: 8,
      fator_criticidade: 1.3,
      fator_relevancia: 1.0,
      peso_efetivo: 0,
      perguntas: [
        'Existe departamento jurídico ou assessoria jurídica?',
        'Os contratos são revisados regularmente?',
        'Existe programa de compliance documentado?',
        'Possui código de ética e canal de denúncias?',
        'A empresa está em conformidade com a LGPD?',
        'Existe gestão de riscos jurídicos formal?',
        'Há histórico de ações trabalhistas nos últimos anos?'
      ]
    }
  }

  private avaliarSST(empresa: EmpresaDNA): ModuloAplicavel {
    const temEmpregados = empresa.numero_funcionarios > 0
    const temRiscos = empresa.caracteristicas?.possui_maquinas || 
                     empresa.caracteristicas?.possui_produtos_quimicos ||
                     empresa.caracteristicas?.possui_inflamaveis ||
                     empresa.caracteristicas?.possui_eletricidade ||
                     empresa.caracteristicas?.possui_trabalho_altura ||
                     empresa.caracteristicas?.possui_espaco_confinado
    
    return {
      id: 'SST',
      nome: 'Saúde e Segurança do Trabalho',
      area: 'SST',
      aplicavel: temEmpregados,
      razao: temEmpregados ? 'Empresa possui colaboradores expostos a riscos' : 'Empresa não possui colaboradores',
      peso_base: 8,
      fator_criticidade: temEmpregados && temRiscos ? 1.8 : temEmpregados ? 1.2 : 0,
      fator_relevancia: temEmpregados ? 1.3 : 0,
      peso_efetivo: 0,
      perguntas: temEmpregados ? [
        'A empresa possui SESMT (Serviços Especializados em SST)?',
        'Possui PGR (Programa de Gerenciamento de Riscos) atualizado?',
        'Possui PCMSO (Programa de Controle Médico) atualizado?',
        'Os exames periódicos são realizados conforme NR-7?',
        'Possui CIPA ativa e com atuação efetiva?',
        'Os equipamentos de proteção individual (EPIs) são fornecidos?',
        'Existem treinamentos de segurança periódicos?',
        'Os acidentes são investigados e registrados?',
        'A empresa utiliza tecnologia para gestão de SST?'
      ] : []
    }
  }

  private avaliarNutricao(empresa: EmpresaDNA): ModuloAplicavel {
    const temAlimentacao = empresa.caracteristicas?.possui_alimentos || false
    
    return {
      id: 'NUTRICAO',
      nome: 'Nutrição Organizacional',
      area: 'NUTRICAO',
      aplicavel: temAlimentacao,
      razao: temAlimentacao ? 'Empresa trabalha com alimentos' : 'Empresa não trabalha com alimentos',
      peso_base: 6,
      fator_criticidade: temAlimentacao ? 1.4 : 0,
      fator_relevancia: temAlimentacao ? 1.0 : 0,
      peso_efetivo: 0,
      perguntas: temAlimentacao ? [
        'O cardápio é desenvolvido por nutricionista?',
        'As refeições são balanceadas nutricionalmente?',
        'Existe redução controlada de sódio e gorduras?',
        'O cardápio oferece opções para restrições alimentares?',
        'A empresa realiza análises laboratoriais dos alimentos?',
        'Segue as Boas Práticas de Fabricação (BPF)?',
        'Possui monitoramento da temperatura de armazenamento?',
        'Os colaboradores da alimentação passam por treinamento?',
        'Possui certificação em segurança de alimentos?'
      ] : []
    }
  }

  private avaliarFinanceiro(empresa: EmpresaDNA): ModuloAplicavel {
    return {
      id: 'FINANCEIRO',
      nome: 'Financeiro',
      area: 'FINANCEIRO',
      aplicavel: true,
      razao: 'Toda empresa tem gestão financeira',
      peso_base: 8,
      fator_criticidade: 1.2,
      fator_relevancia: 1.0,
      peso_efetivo: 0,
      perguntas: [
        'Possui planejamento financeiro formal?',
        'O fluxo de caixa é projetado com antecedência?',
        'Monitora indicadores de rentabilidade?',
        'Existe sistema de controle de custos integrado?',
        'Realiza análise de ROI para investimentos?',
        'O endividamento é controlado?',
        'Possui reservas financeiras para emergências?',
        'Há relatórios financeiros gerenciais mensais?'
      ]
    }
  }

  private avaliarComercial(empresa: EmpresaDNA): ModuloAplicavel {
    return {
      id: 'COMERCIAL',
      nome: 'Comercial e Marketing',
      area: 'COMERCIAL',
      aplicavel: true,
      razao: 'Toda empresa tem atividade comercial',
      peso_base: 6,
      fator_criticidade: 1.0,
      fator_relevancia: 1.0,
      peso_efetivo: 0,
      perguntas: [
        'Possui planejamento comercial anual?',
        'Existe processo estruturado de prospecção e vendas?',
        'Utiliza CRM integrado?',
        'Há métricas de satisfação do cliente?',
        'Possui estratégia de marketing digital?',
        'A equipe comercial tem metas claras?',
        'Há análise de concorrentes e posicionamento?'
      ]
    }
  }

  private avaliarQualidade(empresa: EmpresaDNA): ModuloAplicavel {
    const temProducao = empresa.caracteristicas?.possui_producao || false
    const temServicos = empresa.segmento === 'SERVICOS' || false
    
    return {
      id: 'QUALIDADE',
      nome: 'Qualidade',
      area: 'QUALIDADE',
      aplicavel: temProducao || temServicos,
      razao: temProducao || temServicos ? 'Empresa possui produção ou serviços' : 'Empresa não possui produção ou serviços',
      peso_base: 8,
      fator_criticidade: temProducao ? 1.3 : 1.0,
      fator_relevancia: 1.0,
      peso_efetivo: 0,
      perguntas: temProducao || temServicos ? [
        'O SGQ é integrado a todos os processos organizacionais?',
        'Existe responsável pela qualidade com autoridade?',
        'O SGQ é revisado pela alta direção periodicamente?',
        'Possui certificação ISO 9001 ou similar?',
        'A qualidade é prioridade estratégica?',
        'Os processos têm indicadores de qualidade monitorados?',
        'As não conformidades são analisadas com método de causa raiz?'
      ] : []
    }
  }

  private avaliarMelhoriaContinua(empresa: EmpresaDNA): ModuloAplicavel {
    return {
      id: 'MELHORIA_CONTINUA',
      nome: 'Melhoria Contínua',
      area: 'MELHORIA_CONTINUA',
      aplicavel: true,
      razao: 'Toda empresa pode melhorar continuamente',
      peso_base: 7,
      fator_criticidade: 1.0,
      fator_relevancia: 1.0,
      peso_efetivo: 0,
      perguntas: [
        'Possui cultura que incentiva melhoria contínua?',
        'A liderança apoia iniciativas de melhoria?',
        'Utiliza metodologias estruturadas (Lean, Six Sigma)?',
        'Existe processo formal para identificar oportunidades?',
        'Colaboradores são incentivados a propor melhorias?',
        'Os resultados das melhorias são mensurados?',
        'Houve redução de custos nos últimos 12 meses?'
      ]
    }
  }

  private avaliarOperacoes(empresa: EmpresaDNA): ModuloAplicavel {
    const temOperacoes = empresa.caracteristicas?.possui_producao || 
                        empresa.caracteristicas?.possui_estoque ||
                        empresa.caracteristicas?.possui_armazem ||
                        empresa.caracteristicas?.possui_frota
    
    return {
      id: 'OPERACOES',
      nome: 'Operações e Logística',
      area: 'OPERACOES',
      aplicavel: temOperacoes || empresa.segmento === 'INDUSTRIA',
      razao: temOperacoes || empresa.segmento === 'INDUSTRIA' ? 'Empresa possui operações' : 'Empresa não possui operações significativas',
      peso_base: 6,
      fator_criticidade: temOperacoes ? 1.2 : 0,
      fator_relevancia: temOperacoes ? 1.0 : 0,
      peso_efetivo: 0,
      perguntas: temOperacoes || empresa.segmento === 'INDUSTRIA' ? [
        'Os processos operacionais são documentados e padronizados?',
        'Existem indicadores de eficiência (OEE, lead time)?',
        'Utiliza tecnologia para gestão de operações?',
        'Há controle de capacidade e planejamento de demanda?',
        'A logística é integrada e monitorada?',
        'A empresa reduz custos operacionais continuamente?'
      ] : []
    }
  }

  private avaliarCompras(empresa: EmpresaDNA): ModuloAplicavel {
    return {
      id: 'COMPRAS',
      nome: 'Compras e Suprimentos',
      area: 'COMPRAS',
      aplicavel: true,
      razao: 'Toda empresa realiza compras',
      peso_base: 5,
      fator_criticidade: 1.0,
      fator_relevancia: 1.0,
      peso_efetivo: 0,
      perguntas: [
        'Existe processo estruturado de gestão de fornecedores?',
        'Utiliza sistema integrado de compras?',
        'Há análise de redução de custos em compras?',
        'Possui código de conduta para fornecedores?',
        'O processo de negociação é padronizado?'
      ]
    }
  }

  private avaliarTI(empresa: EmpresaDNA): ModuloAplicavel {
    return {
      id: 'TI',
      nome: 'Tecnologia da Informação',
      area: 'TI',
      aplicavel: true,
      razao: 'Toda empresa utiliza tecnologia',
      peso_base: 5,
      fator_criticidade: 1.0,
      fator_relevancia: 1.0,
      peso_efetivo: 0,
      perguntas: [
        'Possui governança de TI formalizada?',
        'Existe plano de segurança da informação e LGPD?',
        'A infraestrutura de TI é adequada e atualizada?',
        'Utiliza serviços em cloud?',
        'Há gestão de serviços e SLA definidos?',
        'Existem projetos de transformação digital em andamento?'
      ]
    }
  }

  private avaliarAgro(empresa: EmpresaDNA): ModuloAplicavel {
    const isAgro = empresa.segmento === 'AGRO' || 
                   empresa.caracteristicas?.possui_atividades_rurais || false
    
    return {
      id: 'AGRO',
      nome: 'Agronegócio',
      area: 'AGRO',
      aplicavel: isAgro,
      razao: isAgro ? 'Empresa atua no agronegócio' : 'Empresa não atua no agronegócio',
      peso_base: 5,
      fator_criticidade: isAgro ? 1.3 : 0,
      fator_relevancia: isAgro ? 1.0 : 0,
      peso_efetivo: 0,
      perguntas: isAgro ? [
        'A propriedade possui planejamento estratégico formal?',
        'Há gestão de pessoas com registro e conformidade trabalhista?',
        'Possui licenças ambientais atualizadas?',
        'Utiliza tecnologias (IoT, drones, gestão)?',
        'Há práticas de sustentabilidade e preservação?'
      ] : []
    }
  }
}

export const motorAplicabilidade = new MotorAplicabilidade()
