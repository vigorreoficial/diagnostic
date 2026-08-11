// src/lib/supabase/queries.ts
import { createClient } from '@/lib/supabase/server'

/**
 * Busca usuário pelo auth_user_id (UUID do Supabase Auth)
 * ✅ Usa o nome REAL da coluna na sua tabela: 'auth_user_id'
 */
export async function getUsuarioByAuthId(authUserId: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('usuarios')
    .select(`
      *,
      empresas (
        id,
        nome,
        cnpj,
        porte,
        segmento
      )
    `)
    .eq('auth_user_id', authUserId) // ✅ COLUNA CORRETA
    .single()

  if (error) {
    console.error('Erro ao buscar usuário:', error)
    return null
  }

  return data
}

/**
 * Cria ou atualiza usuário após login/signup
 */
export async function upsertUsuario(userData: {
  auth_user_id: string
  nome: string
  email: string
  empresa_id?: string
  perfil?: string
  especializacao?: string
  competencias?: any
  certificacoes?: any
}) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('usuarios')
    .upsert({
      auth_user_id: userData.auth_user_id,
      nome: userData.nome,
      email: userData.email,
      empresa_id: userData.empresa_id,
      perfil: userData.perfil || 'profissional',
      especializacao: userData.especializacao,
      competencias: userData.competencias,
      certificacoes: userData.certificacoes,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'auth_user_id' // ✅ COLUNA CORRETA
    })
    .select()
    .single()

  if (error) {
    console.error('Erro ao salvar usuário:', error)
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

/**
 * Busca projeto por ID com dados relacionados
 */
export async function getProjetoById(projetoId: string) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('projetos_diagnostico')
    .select(`
      *,
      empresas (
        id,
        nome,
        cnpj,
        porte,
        segmento
      ),
      usuarios (
        id,
        nome,
        email,
        auth_user_id
      )
    `)
    .eq('id', projetoId)
    .single()

  if (error) {
    console.error('Erro ao buscar projeto:', error)
    return null
  }

  return data
}
