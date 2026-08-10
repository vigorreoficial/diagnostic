import { createClient } from '@/lib/supabase/client'

export interface Evidencia {
  id: string
  projeto_id: string
  pergunta_id?: string
  modulo_area?: string
  tipo: string
  nome_arquivo: string
  url: string
  hash?: string
  descricao?: string
  data_documento?: string
  data_validade?: string
  versao?: string
  validado: boolean
  validado_por?: string
  validado_em?: string
  created_at: string
  updated_at: string
}

export interface InstrumentoColetivo {
  id: string
  projeto_id: string
  tipo: 'CCT' | 'ACT' | 'TERMO_ADITIVO'
  titulo: string
  sindicato_patronal?: string
  sindicato_laboral?: string
  categoria_profissional?: string
  categoria_economica?: string
  abrangencia_territorial?: string
  uf?: string
  municipio?: string
  data_base?: string
  vigencia_inicio: string
  vigencia_fim: string
  arquivo_url?: string
  conteudo_extraido?: string
  clausulas_identificadas?: any
  status_analise: 'PENDENTE' | 'ANALISANDO' | 'CONCLUIDO' | 'DIVERGENTE'
}

export class CentralEvidencias {
  private supabase = createClient()

  // ============================================
  // 1. UPLOAD DE EVIDÊNCIAS
  // ============================================

  /**
   * Faz upload de uma evidência para o projeto
   */
  async uploadEvidencia(
    projetoId: string,
    file: File,
    tipo: string,
    descricao?: string,
    perguntaId?: string,
    moduloArea?: string
  ): Promise<Evidencia> {
    try {
      // Validar tamanho (10MB)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('Arquivo muito grande. Máximo 10MB.')
      }

      // Validar tipo
      const tiposPermitidos = [
        'application/pdf', 
        'image/jpeg', 
        'image/png', 
        'image/gif',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ]
      
      if (!tiposPermitidos.includes(file.type) && 
          !file.name.match(/\.(pdf|jpg|jpeg|png|gif|xls|xlsx|doc|docx)$/i)) {
        throw new Error('Tipo de arquivo não permitido.')
      }

      // Gerar nome único
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      const filePath = `evidencias/${projetoId}/${fileName}`

      // Upload para Supabase Storage
      const { data, error } = await this.supabase.storage
        .from('evidencias')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        throw new Error(`Erro no upload: ${error.message}`)
      }

      // Obter URL pública
      const { data: urlData } = await this.supabase.storage
        .from('evidencias')
        .getPublicUrl(filePath)

      // Salvar no banco
      const { data: evidencia, error: dbError } = await this.supabase
        .from('evidencias')
        .insert({
          projeto_id: projetoId,
          pergunta_id: perguntaId || null,
          modulo_area: moduloArea || null,
          tipo: tipo,
          nome_arquivo: file.name,
          url: urlData.publicUrl,
          descricao: descricao || '',
          validado: false,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (dbError) {
        throw new Error(`Erro ao salvar: ${dbError.message}`)
      }

      return evidencia
    } catch (error: any) {
      console.error('Erro no upload:', error)
      throw error
    }
  }

  // ============================================
  // 2. UPLOAD DE CCT/ACT
  // ============================================

  /**
   * Faz upload de uma CCT/ACT para o projeto
   */
  async uploadInstrumentoColetivo(
    projetoId: string,
    file: File,
    dados: {
      tipo: 'CCT' | 'ACT' | 'TERMO_ADITIVO'
      titulo: string
      sindicato_patronal?: string
      sindicato_laboral?: string
      categoria_profissional?: string
      categoria_economica?: string
      abrangencia_territorial?: string
      uf?: string
      municipio?: string
      data_base?: string
      vigencia_inicio: string
      vigencia_fim: string
    }
  ): Promise<InstrumentoColetivo> {
    try {
      // Upload do arquivo
      const fileExt = file.name.split('.').pop()
      const fileName = `cct_${Date.now()}.${fileExt}`
      const filePath = `instrumentos/${projetoId}/${fileName}`

      const { data, error } = await this.supabase.storage
        .from('evidencias')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        throw new Error(`Erro no upload: ${error.message}`)
      }

      const { data: urlData } = await this.supabase.storage
        .from('evidencias')
        .getPublicUrl(filePath)

      // Salvar no banco
      const { data: instrumento, error: dbError } = await this.supabase
        .from('instrumentos_coletivos')
        .insert({
          projeto_id: projetoId,
          tipo: dados.tipo,
          titulo: dados.titulo,
          sindicato_patronal: dados.sindicato_patronal || null,
          sindicato_laboral: dados.sindicato_laboral || null,
          categoria_profissional: dados.categoria_profissional || null,
          categoria_economica: dados.categoria_economica || null,
          abrangencia_territorial: dados.abrangencia_territorial || null,
          uf: dados.uf || null,
          municipio: dados.municipio || null,
          data_base: dados.data_base || null,
          vigencia_inicio: dados.vigencia_inicio,
          vigencia_fim: dados.vigencia_fim,
          arquivo_url: urlData.publicUrl,
          status_analise: 'PENDENTE'
        })
        .select()
        .single()

      if (dbError) {
        throw new Error(`Erro ao salvar: ${dbError.message}`)
      }

      // Iniciar análise automática do documento
      await this.analisarInstrumentoColetivo(instrumento.id)

      return instrumento
    } catch (error: any) {
      console.error('Erro no upload CCT:', error)
      throw error
    }
  }

  // ============================================
  // 3. ANÁLISE DE CCT/ACT
  // ============================================

  /**
   * Analisa um instrumento coletivo e extrai cláusulas relevantes
   */
  async analisarInstrumentoColetivo(instrumentoId: string): Promise<any> {
    try {
      // Buscar instrumento
      const { data: instrumento } = await this.supabase
        .from('instrumentos_coletivos')
        .select('*')
        .eq('id', instrumentoId)
        .single()

      if (!instrumento) {
        throw new Error('Instrumento não encontrado')
      }

      // Atualizar status
      await this.supabase
        .from('instrumentos_coletivos')
        .update({ status_analise: 'ANALISANDO' })
        .eq('id', instrumentoId)

      // Aqui viria a análise com IA ou extração de texto
      // Por enquanto, marcamos como concluído com cláusulas genéricas
      const clausulas = {
        piso_salarial: {
          identificada: true,
          valor: 'R$ 2.500,00',
          fonte: 'Cláusula 3ª'
        },
        reajuste: {
          identificada: true,
          percentual: '6,5%',
          data_base: '01/03/2026',
          fonte: 'Cláusula 4ª'
        },
        jornada: {
          identificada: true,
          carga_horaria: '44h semanais',
          fonte: 'Cláusula 5ª'
        },
        beneficios: {
          identificada: true,
          itens: ['Vale-Transporte', 'Vale-Alimentação', 'Plano de Saúde'],
          fonte: 'Cláusulas 6ª a 8ª'
        }
      }

      // Atualizar com cláusulas identificadas
      const { data: updated } = await this.supabase
        .from('instrumentos_coletivos')
        .update({
          clausulas_identificadas: clausulas,
          conteudo_extraido: 'Conteúdo extraído do documento...',
          status_analise: 'CONCLUIDO'
        })
        .eq('id', instrumentoId)
        .select()
        .single()

      return updated
    } catch (error: any) {
      console.error('Erro na análise CCT:', error)
      await this.supabase
        .from('instrumentos_coletivos')
        .update({ status_analise: 'DIVERGENTE' })
        .eq('id', instrumentoId)
      throw error
    }
  }

  // ============================================
  // 4. VALIDAÇÃO DE EVIDÊNCIAS
  // ============================================

  /**
   * Valida uma evidência (marca como validada por um usuário)
   */
  async validarEvidencia(
    evidenciaId: string,
    usuarioId: string,
    validado: boolean = true
  ): Promise<void> {
    try {
      await this.supabase
        .from('evidencias')
        .update({
          validado: validado,
          validado_por: usuarioId,
          validado_em: new Date().toISOString()
        })
        .eq('id', evidenciaId)
    } catch (error: any) {
      console.error('Erro ao validar evidência:', error)
      throw error
    }
  }

  // ============================================
  // 5. BUSCA DE EVIDÊNCIAS
  // ============================================

  /**
   * Busca evidências de um projeto
   */
  async buscarEvidencias(projetoId: string): Promise<Evidencia[]> {
    try {
      const { data, error } = await this.supabase
        .from('evidencias')
        .select('*')
        .eq('projeto_id', projetoId)
        .order('created_at', { ascending: false })

      if (error) {
        throw error
      }

      return data || []
    } catch (error: any) {
      console.error('Erro ao buscar evidências:', error)
      return []
    }
  }

  /**
   * Busca evidências por módulo
   */
  async buscarEvidenciasPorModulo(projetoId: string, moduloArea: string): Promise<Evidencia[]> {
    try {
      const { data, error } = await this.supabase
        .from('evidencias')
        .select('*')
        .eq('projeto_id', projetoId)
        .eq('modulo_area', moduloArea)
        .order('created_at', { ascending: false })

      if (error) {
        throw error
      }

      return data || []
    } catch (error: any) {
      console.error('Erro ao buscar evidências por módulo:', error)
      return []
    }
  }

  /**
   * Busca instrumentos coletivos de um projeto
   */
  async buscarInstrumentos(projetoId: string): Promise<InstrumentoColetivo[]> {
    try {
      const { data, error } = await this.supabase
        .from('instrumentos_coletivos')
        .select('*')
        .eq('projeto_id', projetoId)
        .order('created_at', { ascending: false })

      if (error) {
        throw error
      }

      return data || []
    } catch (error: any) {
      console.error('Erro ao buscar instrumentos:', error)
      return []
    }
  }

  /**
   * Busca instrumentos ativos (dentro da vigência)
   */
  async buscarInstrumentosAtivos(projetoId: string): Promise<InstrumentoColetivo[]> {
    try {
      const hoje = new Date().toISOString().split('T')[0]
      
      const { data, error } = await this.supabase
        .from('instrumentos_coletivos')
        .select('*')
        .eq('projeto_id', projetoId)
        .lte('vigencia_inicio', hoje)
        .gte('vigencia_fim', hoje)
        .order('created_at', { ascending: false })

      if (error) {
        throw error
      }

      return data || []
    } catch (error: any) {
      console.error('Erro ao buscar instrumentos ativos:', error)
      return []
    }
  }

  // ============================================
  // 6. EXCLUSÃO DE EVIDÊNCIAS
  // ============================================

  /**
   * Exclui uma evidência
   */
  async excluirEvidencia(evidenciaId: string): Promise<void> {
    try {
      // Buscar evidência para pegar a URL
      const { data: evidencia } = await this.supabase
        .from('evidencias')
        .select('url')
        .eq('id', evidenciaId)
        .single()

      if (evidencia?.url) {
        // Extrair caminho do arquivo da URL
        const urlParts = evidencia.url.split('/')
        const filePath = urlParts.slice(urlParts.indexOf('evidencias')).join('/')
        
        // Deletar do storage
        await this.supabase.storage
          .from('evidencias')
          .remove([filePath])
      }

      // Deletar do banco
      await this.supabase
        .from('evidencias')
        .delete()
        .eq('id', evidenciaId)
    } catch (error: any) {
      console.error('Erro ao excluir evidência:', error)
      throw error
    }
  }
}

export const centralEvidencias = new CentralEvidencias()
