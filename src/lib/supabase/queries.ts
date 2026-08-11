// src/lib/supabase/queries.ts
import { createClient } from '@/lib/supabase/server'

/**
 * Busca usuário pelo auth_id (UUID do Supabase Auth)
 */
export async function getUsuarioByAuthId(authUserId: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('usuarios')
    .select('*')
    .eq('user_id', authUserId) // ✅ Verifique: é 'user_id' ou 'auth_user_id'?
    .single()

  if (error) {
    console.error('Erro ao buscar usuário:', error)
    return null
  }

  return data
}

/**
 * Busca relatórios com relacionamento correto
 */
export async function getRelatoriosComProjetos(limit: number = 10) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('relatorios')
    .select(`
      *,
      projetos_diagnostico:projeto_id (
        id,
        titulo,
        empresas:empresa_id (
          id,
          nome
        )
      )
    `)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Erro ao buscar relatórios:', error)
    return []
  }

  return data
}

/**
 * Busca respostas de um projeto específico
 */
export async function getRespostasByProjeto(projetoId: string) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('respostas')
    .select(`
      *,
      perguntas (
        id,
        modulo_area,
        pergunta,
        tipo
      )
    `)
    .eq('projeto_id', projetoId)

  if (error) {
    console.error('Erro ao buscar respostas:', error)
    return []
  }

  return data
}
