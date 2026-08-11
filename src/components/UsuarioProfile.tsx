// src/components/UsuarioProfile.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Usuario {
  id: string
  nome: string
  email: string
  perfil: string
  empresa?: {
    nome: string
  }
}

export default function UsuarioProfile() {
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadUsuario() {
      const supabase = createClient()
      
      // 1. Pega a sessão atual
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        setLoading(false)
        return
      }

      // 2. Busca o usuário na tabela 'usuarios'
      // ⚠️ Use 'user_id' (nome correto da coluna), não 'auth_user_id'
      const { data, error } = await supabase
        .from('usuarios')
        .select(`
          id,
          nome,
          email,
          perfil,
          empresas (nome)
        `)
        .eq('user_id', session.user.id)
        .single()

      if (error) {
        console.error('Erro ao carregar usuário:', error)
      } else {
        setUsuario(data)
      }
      setLoading(false)
    }

    loadUsuario()
  }, [])

  if (loading) return <div>Carregando...</div>
  if (!usuario) return <div>Usuário não encontrado</div>

  return (
    <div>
      <h2>{usuario.nome}</h2>
      <p>{usuario.email}</p>
      <p>Perfil: {usuario.perfil}</p>
      {usuario.empresas && <p>Empresa: {usuario.empresas.nome}</p>}
    </div>
  )
}
