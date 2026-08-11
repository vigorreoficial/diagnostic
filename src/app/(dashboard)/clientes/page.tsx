// src/app/(dashboard)/clientes/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Plus, 
  Search, 
  Building2, 
  Users, 
  Calendar,
  Eye,
  Pencil,
  Trash2,
  Loader2
} from 'lucide-react'
import { toast } from 'sonner'

export default function ClientesPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [clientes, setClientes] = useState<any[]>([])
  const [filteredClientes, setFilteredClientes] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [user, setUser] = useState<any>(null)
  const [userData, setUserData] = useState<any>(null)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      
      try {
        // Buscar usuário logado
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)

        if (user) {
          // ✅ CORREÇÃO: usar 'user_id' (nome real da coluna)
          const { data: userInfo } = await supabase
            .from('usuarios')
            .select('*')
            .eq('user_id', user.id) // ✅ Correto: user_id (não auth_user_id)
            .single()
          setUserData(userInfo)
        }

        // Buscar clientes (as políticas RLS já filtram)
        const { data, error } = await supabase
          .from('empresas')
          .select('*')
          .order('nome', { ascending: true })

        if (error) {
          toast.error('Erro ao carregar clientes: ' + error.message)
          return
        }

        setClientes(data || [])
        setFilteredClientes(data || [])
      } catch (error) {
        toast.error('Erro ao carregar dados')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [supabase])

  // Filtro de busca
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredClientes(clientes)
    } else {
      const term = searchTerm.toLowerCase()
      const filtered = clientes.filter(c => 
        c.nome?.toLowerCase().includes(term) ||
        c.nome_fantasia?.toLowerCase().includes(term) ||
        c.cnpj?.includes(term) ||
        c.segmento?.toLowerCase().includes(term)
      )
      setFilteredClientes(filtered)
    }
  }, [searchTerm, clientes])

  const handleDelete = async (id: string, nome: string) => {
    if (!confirm(`Tem certeza que deseja excluir o cliente "${nome}"?`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('empresas')
        .delete()
        .eq('id', id)

      if (error) {
        toast.error('Erro ao excluir cliente: ' + error.message)
        return
      }

      toast.success('Cliente excluído com sucesso!')
      setClientes(clientes.filter(c => c.id !== id))
    } catch (error) {
      toast.error('Erro ao excluir cliente')
    }
  }

  const isAdmin = userData?.perfil === 'ADMIN'

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#0F5FA8]" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0A3D78]">Clientes</h1>
          <p className="text-[#5E6C84] text-sm">
            Gerencie as empresas atendidas pela Vigorre
          </p>
        </div>
        {isAdmin && (
          <Button 
            className="bg-[#0F5FA8] hover:bg-[#0A3D78]"
            onClick={() => router.push('/clientes/novo')}
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Cliente
          </Button>
        )}
      </div>

      {/* Busca */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5E6C84]" />
        <Input
          placeholder="Buscar cliente por nome, CNPJ ou segmento..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Lista de Clientes */}
      {filteredClientes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="w-12 h-12 text-[#D7DEE8] mx-auto mb-4" />
            <p className="text-[#5E6C84]">
              {clientes.length === 0 
                ? 'Nenhum cliente cadastrado ainda.' 
                : 'Nenhum cliente encontrado com esse filtro.'}
            </p>
            {isAdmin && clientes.length === 0 && (
              <Button 
                className="mt-4 bg-[#0F5FA8] hover:bg-[#0A3D78]"
                onClick={() => router.push('/clientes/novo')}
              >
                <Plus className="w-4 h-4 mr-2" />
                Cadastrar primeiro cliente
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClientes.map((cliente) => (
            <Card key={cliente.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-[#0A3D78] truncate">
                      {cliente.nome || 'Sem nome'}
                    </CardTitle>
                    {cliente.nome_fantasia && (
                      <p className="text-sm text-[#5E6C84] truncate">
                        {cliente.nome_fantasia}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Link
                      href={`/clientes/${cliente.id}`}
                      className="p-2 text-[#5E6C84] hover:text-[#0F5FA8] hover:bg-[#EAF3FC] rounded-lg transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                    {isAdmin && (
                      <>
                        <Link
                          href={`/clientes/${cliente.id}/editar`}
                          className="p-2 text-[#5E6C84] hover:text-[#0F5FA8] hover:bg-[#EAF3FC] rounded-lg transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(cliente.id, cliente.nome)}
                          className="p-2 text-[#5E6C84] hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-[#5E6C84]">
                  <Building2 className="w-4 h-4 flex-shrink-0" />
                  <span>CNPJ: {cliente.cnpj || '—'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-[#5E6C84]">
                  <Users className="w-4 h-4 flex-shrink-0" />
                  <span>Porte: {cliente.porte || '—'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-[#5E6C84]">
                  <Calendar className="w-4 h-4 flex-shrink-0" />
                  <span>Cadastro: {cliente.created_at ? new Date(cliente.created_at).toLocaleDateString('pt-BR') : '—'}</span>
                </div>
                <div className="pt-3 flex gap-2">
                  <Link
                    href={`/clientes/${cliente.id}`}
                    className="flex-1 text-center text-sm bg-[#F7F8FA] text-[#1C1F26] px-4 py-2 rounded-lg hover:bg-[#EAF3FC] transition-colors"
                  >
                    Ver Diagnósticos
                  </Link>
                  {isAdmin && (
                    <Link
                      href={`/diagnosticos/novo?empresa=${cliente.id}`}
                      className="flex-1 text-center text-sm bg-[#0F5FA8] text-white px-4 py-2 rounded-lg hover:bg-[#0A3D78] transition-colors"
                    >
                      Novo Diagnóstico
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
