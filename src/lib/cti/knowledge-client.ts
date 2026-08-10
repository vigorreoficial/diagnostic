import { createClient } from '@/lib/supabase/client'

interface KnowledgeResult {
  id: string
  titulo: string
  descricao: string
  conteudo: string
  categoria: string
  modulo_area: string | null
  tags: string[]
  fonte: string
  versao: string
  data_publicacao: string
  url: string | null
}

export class KnowledgeClient {
  private supabase = createClient()

  /**
   * Busca conteúdo no Knowledge Hub™ por módulo e tags
   */
  async buscarPorModulo(moduloArea: string, tags: string[] = []): Promise<KnowledgeResult[]> {
    try {
      let query = this.supabase
        .from('knowledge_base')
        .select('*')
        .eq('ativo', true)
        .eq('modulo_area', moduloArea)

      // Se houver tags, buscar também por tags
      if (tags.length > 0) {
        // Buscar por módulo OU tags
        const { data } = await this.supabase
          .from('knowledge_base')
          .select('*')
          .eq('ativo', true)
          .or(`modulo_area.eq.${moduloArea},tags.cs.{${tags.join(',')}}`)
          .order('created_at', { ascending: false })

        return data || []
      }

      const { data } = await query.order('created_at', { ascending: false })
      return data || []
    } catch (error) {
      console.error('Erro ao buscar conhecimento:', error)
      return []
    }
  }

  /**
   * Busca conteúdo por categoria
   */
  async buscarPorCategoria(categoria: string): Promise<KnowledgeResult[]> {
    try {
      const { data } = await this.supabase
        .from('knowledge_base')
        .select('*')
        .eq('ativo', true)
        .eq('categoria', categoria)
        .order('created_at', { ascending: false })

      return data || []
    } catch (error) {
      console.error('Erro ao buscar por categoria:', error)
      return []
    }
  }

  /**
   * Busca conteúdo por tags específicas
   */
  async buscarPorTags(tags: string[]): Promise<KnowledgeResult[]> {
    try {
      const { data } = await this.supabase
        .from('knowledge_base')
        .select('*')
        .eq('ativo', true)
        .contains('tags', tags)
        .order('created_at', { ascending: false })

      return data || []
    } catch (error) {
      console.error('Erro ao buscar por tags:', error)
      return []
    }
  }

  /**
   * Busca conteúdo por termo de pesquisa
   */
  async buscarPorTermo(termo: string): Promise<KnowledgeResult[]> {
    try {
      const { data } = await this.supabase
        .from('knowledge_base')
        .select('*')
        .eq('ativo', true)
        .or(`titulo.ilike.%${termo}%,descricao.ilike.%${termo}%,conteudo.ilike.%${termo}%`)
        .order('created_at', { ascending: false })

      return data || []
    } catch (error) {
      console.error('Erro ao buscar por termo:', error)
      return []
    }
  }

  /**
   * Busca conteúdo específico por ID
   */
  async buscarPorId(id: string): Promise<KnowledgeResult | null> {
    try {
      const { data } = await this.supabase
        .from('knowledge_base')
        .select('*')
        .eq('id', id)
        .single()

      return data || null
    } catch (error) {
      console.error('Erro ao buscar por ID:', error)
      return null
    }
  }

  /**
   * Registra consulta no log de auditoria
   */
  async registrarConsulta(knowledgeId: string, consulta: string, moduloArea: string, usuarioId: string) {
    try {
      await this.supabase
        .from('knowledge_base_audit')
        .insert({
          knowledge_id: knowledgeId,
          consulta,
          modulo_area: moduloArea,
          usuario_id: usuarioId
        })
    } catch (error) {
      console.error('Erro ao registrar consulta:', error)
    }
  }
}

export const knowledgeClient = new KnowledgeClient()
