// src/components/UsuarioProfile.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

// ✅ Interface Empresa (objeto único)
interface Empresa {
  id: string
  nome: string
  cnpj?: string
  porte?: string
  segmento?: string
}

// ✅ Interface Usuario corrigida
interface Usuario {
  id: string
  user_id: string // ✅ Nome correto da coluna (não auth_user_id)
  nome: string
  email: string
  perfil: string
  especializacao?: string
  competencias?: any
  certificacoes?: any
  empresas?: Empresa[] // ✅ Array, pois o join do Supabase retorna lista
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
      // ✅ Usa 'user_id' (nome REAL da coluna)
      const { data, error } = await supabase
        .from('usuarios')
        .select(`
          id,
          user_id,
          nome,
          email,
          perfil,
          especializacao,
          competencias,
          certificacoes,
          empresas (
            id,
            nome,
            cnpj,
            porte,
            segmento
          )
        `)
        .eq('user_id', session.user.id) // ✅ Coluna correta
        .single()

      if (error) {
        console.error('Erro ao carregar usuário:', error)
      } else if (data) {
        // ✅ Tipagem correta: empresas já vem como array do Supabase
        setUsuario(data as Usuario)
      }
      setLoading(false)
    }

    loadUsuario()
  }, [])

  if (loading) return <div className="p-4">Carregando perfil...</div>
  if (!usuario) return <div className="p-4 text-gray-500">Usuário não encontrado</div>

  return (
    <div className="p-4 bg-white rounded-lg shadow space-y-3">
      <div>
        <h2 className="text-xl font-bold text-gray-900">{usuario.nome}</h2>
        <p className="text-gray-600">{usuario.email}</p>
      </div>
      
      <div className="flex gap-2 text-sm">
        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
          {usuario.perfil}
        </span>
        {usuario.especializacao && (
          <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded">
            {usuario.especializacao}
          </span>
        )}
      </div>

      {usuario.empresas && usuario.empresas.length > 0 && (
        <div className="pt-2 border-t">
          <p className="text-sm font-medium text-gray-700 mb-1">Empresas vinculadas:</p>
          <ul className="space-y-1">
            {usuario.empresas.map((empresa) => (
              <li key={empresa.id} className="text-sm text-gray-600">
                • {empresa.nome} {empresa.cnpj && `(${empresa.cnpj})`}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
