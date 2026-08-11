// src/components/UsuarioProfile.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Empresa {
  id: string
  nome: string
  cnpj?: string
}

interface Usuario {
  id: string
  auth_user_id: string
  nome: string
  email: string
  perfil: string
  especializacao?: string
  empresas?: Empresa
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
      // ✅ Usa 'auth_user_id' (nome REAL da sua coluna)
      const { data, error } = await supabase
        .from('usuarios')
        .select(`
          id,
          auth_user_id,
          nome,
          email,
          perfil,
          especializacao,
          empresas (
            id,
            nome,
            cnpj
          )
        `)
        .eq('auth_user_id', session.user.id) // ✅ COLUNA CORRETA
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

  if (loading) return <div className="p-4">Carregando perfil...</div>
  if (!usuario) return <div className="p-4 text-gray-500">Usuário não encontrado</div>

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold">{usuario.nome}</h2>
      <p className="text-gray-600">{usuario.email}</p>
      <p className="text-sm text-gray-500">Perfil: {usuario.perfil}</p>
      {usuario.especializacao && (
        <p className="text-sm text-blue-600">Especialização: {usuario.especializacao}</p>
      )}
      {usuario.empresas && (
        <p className="text-sm text-gray-700">Empresa: {usuario.empresas.nome}</p>
      )}
    </div>
  )
}
