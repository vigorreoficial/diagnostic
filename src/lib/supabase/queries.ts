// src/lib/supabase/queries.ts
import { createClient } from '@/lib/supabase/server'

/**
 * Busca usuário pelo auth_id (UUID do Supabase Auth)
 * ⚠️ Ajuste o nome da coluna conforme sua tabela: 'user_id' OU 'id'
 */
export async function getUsuarioByAuthId(authUserId: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('usuarios')
    .select(`
      *,
      empresas (id, nome, cnpj)
    `)
    .eq('user_id', authUserId) // ← Mude para 'id' se for o caso
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
  user_id: string
  nome: string
  email: string
  empresa_id?: string
  perfil?: string
}) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('usuarios')
    .upsert({
      user_id: userData.user_id,
      nome: userData.nome,
      email: userData.email,
      empresa_id: userData.empresa_id,
      perfil: userData.perfil || 'profissional',
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'user_id' // ← Mude para 'id' se for o caso
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
