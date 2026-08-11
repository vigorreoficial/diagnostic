// src/lib/supabase/queries.ts
import { createClient } from '@/lib/supabase/server'

// =============================================================
// 🧑‍ USUÁRIOS
// =============================================================

/**
 * Busca um usuário pelo ID de autenticação (UUID)
 * ✅ CORREÇÃO: Usa 'user_id' conforme confirmado no banco
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
    .eq('user_id', authUserId) // ✅ Nome correto da coluna
    .single()

  if (error) {
    console.error('Erro ao buscar usuário:', error)
    return null
  }

  return data
}

/**
 * Cria ou atualiza um usuário no banco (Upsert)
 * ✅ Útil após login/signup
 */
export async function upsertUsuario(userData: {
  user_id: string // ✅ Nome correto
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
      user_id: userData.user_id, // ✅ Nome correto
      nome: userData.nome,
      email: userData.email,
      empresa_id: userData.empresa_id,
      perfil: userData.perfil || 'profissional',
      especializacao: userData.especializacao,
      competencias: userData.competencias,
      certificacoes: userData.certificacoes,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'user_id' // ✅ Conflito baseado na coluna correta
    })
    .select()
    .single()

  if (error) {
    console.error('Erro ao salvar usuário:', error)
    return null
  }

  return data
}

// =============================================================
// 📊 RELATÓRIOS E PROJETOS
// =============================================================

/**
 * Busca lista de relatórios com dados dos projetos e empresas
 * ✅ CORREÇÃO: Join correto para evitar erro 400
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
        status,
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
 * Busca um projeto específico pelo ID com dados completos
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
        cnpj
      ),
      usuarios (
        id,
        nome,
        email
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

/**
 * Busca todas as respostas de um projeto
 * ✅ Inclui dados da pergunta relacionada
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
