'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Plus,
  Search,
  Users,
  Mail,
  User,
  Shield,
  Eye,
  Pencil,
  Trash2,
  Loader2,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { toast } from 'sonner'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

export default function ColaboradoresPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [colaboradores, setColaboradores] = useState<any[]>([])
  const [filteredColaboradores, setFilteredColaboradores] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [userData, setUserData] = useState<any>(null)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)

      try {
        // Buscar usuário logado
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: userInfo } = await supabase
            .from('usuarios')
            .select('*')
            .eq('auth_user_id', user.id)
            .single()
          setUserData(userInfo)

          // Verificar se é ADMIN
          if (userInfo?.perfil !== 'ADMIN') {
            toast.error('Acesso negado. Apenas administradores podem ver colaboradores.')
            return
          }
        }

        // Buscar colaboradores
        const { data, error } = await supabase
          .from('usuarios')
          .select('*')
          .order('nome', { ascending: true })

        if (error) {
          toast.error('Erro ao carregar colaboradores: ' + error.message)
          return
        }

        setColaboradores(data || [])
        setFilteredColaboradores(data || [])
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
      setFilteredColaboradores(colaboradores)
    } else {
      const term = searchTerm.toLowerCase()
      const filtered = colaboradores.filter(c =>
        c.nome?.toLowerCase().includes(term) ||
        c.email?.toLowerCase().includes(term) ||
        c.perfil?.toLowerCase().includes(term) ||
        c.especializacao?.toLowerCase().includes(term)
      )
      setFilteredColaboradores(filtered)
    }
  }, [searchTerm, colaboradores])

  const handleDelete = async (id: string, nome: string) => {
    if (!confirm(`Tem certeza que deseja excluir o colaborador "${nome}"?`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('usuarios')
        .delete()
        .eq('id', id)

      if (error) {
        toast.error('Erro ao excluir colaborador: ' + error.message)
        return
      }

      toast.success('Colaborador excluído com sucesso!')
      setColaboradores(colaboradores.filter(c => c.id !== id))
    } catch (error) {
      toast.error('Erro ao excluir colaborador')
    }
  }

  const getInitials = (nome: string) => {
    if (!nome) return '??'
    return nome
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getPerfilColor = (perfil: string) => {
    const colors: Record<string, string> = {
      'ADMIN': 'bg-red-100 text-red-700 border-red-200',
      'DIRETOR': 'bg-purple-100 text-purple-700 border-purple-200',
      'GESTOR': 'bg-blue-100 text-blue-700 border-blue-200',
      'CONSULTOR': 'bg-green-100 text-green-700 border-green-200',
      'AUDITOR': 'bg-yellow-100 text-yellow-700 border-yellow-200',
      'ESPECIALISTA': 'bg-indigo-100 text-indigo-700 border-indigo-200',
      'CLIENTE': 'bg-gray-100 text-gray-700 border-gray-200',
    }
    return colors[perfil] || 'bg-gray-100 text-gray-700 border-gray-200'
  }

  const getPerfilLabel = (perfil: string) => {
    const labels: Record<string, string> = {
      'ADMIN': 'Administrador',
      'DIRETOR': 'Diretor',
      'GESTOR': 'Gestor de Projetos',
      'CONSULTOR': 'Consultor',
      'AUDITOR': 'Auditor',
      'ESPECIALISTA': 'Especialista',
      'CLIENTE': 'Cliente',
    }
    return labels[perfil] || perfil
  }

  const isAdmin = userData?.perfil === 'ADMIN'

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <Card className="max-w-md">
          <CardContent className="py-12 text-center">
            <Shield className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <p className="text-[#1C1F26] font-medium">Acesso Negado</p>
            <p className="text-[#5E6C84] text-sm">
              Apenas administradores podem acessar esta página.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

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
          <h1 className="text-2xl font-bold text-[#0A3D78]">Colaboradores</h1>
          <p className="text-[#5E6C84] text-sm">
            Gerencie a equipe Vigorre
          </p>
        </div>
        <Button
          className="bg-[#0F5FA8] hover:bg-[#0A3D78]"
          onClick={() => window.location.href = '/colaboradores/novo'}
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Colaborador
        </Button>
      </div>

      {/* Busca */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5E6C84]" />
        <Input
          placeholder="Buscar por nome, email ou perfil..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Lista de Colaboradores */}
      {filteredColaboradores.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="w-12 h-12 text-[#D7DEE8] mx-auto mb-4" />
            <p className="text-[#5E6C84]">
              {colaboradores.length === 0
                ? 'Nenhum colaborador cadastrado ainda.'
                : 'Nenhum colaborador encontrado com esse filtro.'}
            </p>
            {colaboradores.length === 0 && (
              <Button
                className="mt-4 bg-[#0F5FA8] hover:bg-[#0A3D78]"
                onClick={() => window.location.href = '/colaboradores/novo'}
              >
                <Plus className="w-4 h-4 mr-2" />
                Cadastrar primeiro colaborador
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredColaboradores.map((colaborador) => (
            <Card key={colaborador.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-12 h-12 bg-[#0F5FA8] text-white">
                      <AvatarFallback className="text-sm font-medium">
                        {getInitials(colaborador.nome)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-[#0A3D78] text-base">
                        {colaborador.nome || 'Sem nome'}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${getPerfilColor(colaborador.perfil)}`}>
                          {getPerfilLabel(colaborador.perfil)}
                        </span>
                        {colaborador.ativo ? (
                          <span className="text-xs text-green-600 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> Ativo
                          </span>
                        ) : (
                          <span className="text-xs text-red-600 flex items-center gap-1">
                            <XCircle className="w-3 h-3" /> Inativo
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Link
                      href={`/colaboradores/${colaborador.id}`}
                      className="p-2 text-[#5E6C84] hover:text-[#0F5FA8] hover:bg-[#EAF3FC] rounded-lg transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                    <Link
                      href={`/colaboradores/${colaborador.id}/editar`}
                      className="p-2 text-[#5E6C84] hover:text-[#0F5FA8] hover:bg-[#EAF3FC] rounded-lg transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => handleDelete(colaborador.id, colaborador.nome)}
                      className="p-2 text-[#5E6C84] hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-[#5E6C84]">
                  <Mail className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{colaborador.email || '—'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-[#5E6C84]">
                  <User className="w-4 h-4 flex-shrink-0" />
                  <span>Especialização: {colaborador.especializacao || '—'}</span>
                </div>
                {colaborador.competencias && Array.isArray(colaborador.competencias) && colaborador.competencias.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {colaborador.competencias.slice(0, 3).map((comp: string, i: number) => (
                      <span key={i} className="px-2 py-0.5 bg-[#EAF3FC] text-[#0F5FA8] rounded-full text-xs">
                        {comp}
                      </span>
                    ))}
                    {colaborador.competencias.length > 3 && (
                      <span className="text-xs text-[#5E6C84]">
                        +{colaborador.competencias.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
