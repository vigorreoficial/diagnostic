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
  ClipboardList,
  Building2,
  User,
  Calendar,
  Eye,
  Pencil,
  Trash2,
  Loader2,
  ChevronRight
} from 'lucide-react'
import { toast } from 'sonner'

// Lista de módulos para exibição
const MODULOS_LABELS: Record<string, string> = {
  'ESTRATEGIA': 'Estratégia',
  'RH': 'RH',
  'DP': 'Depto Pessoal',
  'JURIDICO': 'Jurídico',
  'SST': 'SST',
  'NUTRICAO': 'Nutrição',
  'FINANCEIRO': 'Financeiro',
  'COMERCIAL': 'Comercial',
  'QUALIDADE': 'Qualidade',
  'MELHORIA_CONTINUA': 'Melhoria Contínua',
  'OPERACOES': 'Operações',
  'COMPRAS': 'Compras',
  'TI': 'TI',
  'AGRO': 'Agronegócio',
}

export default function DiagnosticosPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [diagnosticos, setDiagnosticos] = useState<any[]>([])
  const [filteredDiagnosticos, setFilteredDiagnosticos] = useState<any[]>([])
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
            .eq('user_id', user.id)
            .single()
          setUserData(userInfo)
        }

        // Buscar diagnósticos (as políticas RLS já filtram)
        const { data, error } = await supabase
          .from('projetos_diagnostico')
          .select(`
            *,
            empresas (id, nome, cnpj),
            usuarios (id, nome)
          `)
          .order('created_at', { ascending: false })

        if (error) {
          toast.error('Erro ao carregar diagnósticos: ' + error.message)
          return
        }

        setDiagnosticos(data || [])
        setFilteredDiagnosticos(data || [])
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
      setFilteredDiagnosticos(diagnosticos)
    } else {
      const term = searchTerm.toLowerCase()
      const filtered = diagnosticos.filter(d =>
        d.titulo?.toLowerCase().includes(term) ||
        d.empresas?.nome?.toLowerCase().includes(term) ||
        d.empresas?.cnpj?.includes(term) ||
        d.status?.toLowerCase().includes(term)
      )
      setFilteredDiagnosticos(filtered)
    }
  }, [searchTerm, diagnosticos])

  const handleDelete = async (id: string, titulo: string) => {
    if (!confirm(`Tem certeza que deseja excluir o diagnóstico "${titulo}"?`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('projetos_diagnostico')
        .delete()
        .eq('id', id)

      if (error) {
        toast.error('Erro ao excluir diagnóstico: ' + error.message)
        return
      }

      toast.success('Diagnóstico excluído com sucesso!')
      setDiagnosticos(diagnosticos.filter(d => d.id !== id))
    } catch (error) {
      toast.error('Erro ao excluir diagnóstico')
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'CADASTRO': 'bg-gray-400',
      'PLANEJAMENTO': 'bg-blue-400',
      'COLETA': 'bg-yellow-400',
      'ANALISE': 'bg-purple-400',
      'REVISAO': 'bg-orange-400',
      'PREDICAO': 'bg-indigo-400',
      'ENTREGA': 'bg-green-400',
      'MONITORAMENTO': 'bg-teal-400',
    }
    return colors[status] || 'bg-gray-400'
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'CADASTRO': 'Cadastro',
      'PLANEJAMENTO': 'Planejamento',
      'COLETA': 'Coleta de dados',
      'ANALISE': 'Análise',
      'REVISAO': 'Revisão',
      'PREDICAO': 'Predição',
      'ENTREGA': 'Entrega',
      'MONITORAMENTO': 'Monitoramento',
    }
    return labels[status] || status
  }

  const getStatusProgress = (status: string) => {
    const progress: Record<string, number> = {
      'CADASTRO': 0,
      'PLANEJAMENTO': 15,
      'COLETA': 40,
      'ANALISE': 60,
      'REVISAO': 75,
      'PREDICAO': 85,
      'ENTREGA': 95,
      'MONITORAMENTO': 100,
    }
    return progress[status] || 0
  }

  const isAdmin = userData?.perfil === 'ADMIN'
  const isConsultor = userData?.perfil === 'CONSULTOR'
  const canCreate = isAdmin || isConsultor

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
          <h1 className="text-2xl font-bold text-[#0A3D78]">Diagnósticos</h1>
          <p className="text-[#5E6C84] text-sm">
            Acompanhe todos os diagnósticos em andamento e concluídos
          </p>
        </div>
        {canCreate && (
          <Button
            className="bg-[#0F5FA8] hover:bg-[#0A3D78]"
            onClick={() => window.location.href = '/diagnosticos/novo'}
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Diagnóstico
          </Button>
        )}
      </div>

      {/* Busca */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5E6C84]" />
        <Input
          placeholder="Buscar por título, empresa ou status..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Lista de Diagnósticos */}
      {filteredDiagnosticos.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ClipboardList className="w-12 h-12 text-[#D7DEE8] mx-auto mb-4" />
            <p className="text-[#5E6C84]">
              {diagnosticos.length === 0
                ? 'Nenhum diagnóstico iniciado ainda.'
                : 'Nenhum diagnóstico encontrado com esse filtro.'}
            </p>
            {canCreate && diagnosticos.length === 0 && (
              <Button
                className="mt-4 bg-[#0F5FA8] hover:bg-[#0A3D78]"
                onClick={() => window.location.href = '/diagnosticos/novo'}
              >
                <Plus className="w-4 h-4 mr-2" />
                Iniciar primeiro diagnóstico
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredDiagnosticos.map((diag) => (
            <Card key={diag.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start gap-3">
                      <div className={`mt-1 w-2 h-2 rounded-full ${getStatusColor(diag.status)}`} />
                      <div>
                        <h3 className="font-semibold text-[#0A3D78]">
                          {diag.titulo || 'Diagnóstico sem título'}
                        </h3>
                        <p className="text-sm text-[#5E6C84] flex items-center gap-2">
                          <Building2 className="w-3 h-3" />
                          {diag.empresas?.nome || 'Empresa não identificada'}
                          {diag.empresas?.cnpj && ` • CNPJ: ${diag.empresas.cnpj}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-[#5E6C84]">
                      <span className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {diag.usuarios?.nome || 'Não atribuído'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {diag.created_at ? new Date(diag.created_at).toLocaleDateString('pt-BR') : '—'}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium text-white bg-[#5E6C84]">
                        {getStatusLabel(diag.status)}
                      </span>
                    </div>

                    {/* Módulos selecionados */}
                    {diag.escopo && Array.isArray(diag.escopo) && diag.escopo.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {diag.escopo.slice(0, 5).map((modulo: string) => (
                          <span key={modulo} className="px-2 py-0.5 bg-[#EAF3FC] text-[#0F5FA8] rounded-full text-xs">
                            {MODULOS_LABELS[modulo] || modulo}
                          </span>
                        ))}
                        {diag.escopo.length > 5 && (
                          <span className="text-xs text-[#5E6C84]">
                            +{diag.escopo.length - 5} módulos
                          </span>
                        )}
                      </div>
                    )}

                    {/* Barra de progresso */}
                    <div className="mt-4">
                      <div className="w-full bg-[#F7F8FA] rounded-full h-2">
                        <div
                          className="bg-[#0F5FA8] h-2 rounded-full transition-all"
                          style={{ width: `${getStatusProgress(diag.status)}%` }}
                        />
                      </div>
                      <p className="text-xs text-[#5E6C84] mt-1">
                        {getStatusProgress(diag.status)}% concluído
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link href={`/diagnosticos/${diag.id}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-1" />
                        Ver
                      </Button>
                    </Link>
                    {(isAdmin || (isConsultor && diag.usuarios?.id === userData?.id)) && (
                      <Link href={`/diagnosticos/${diag.id}/editar`}>
                        <Button variant="outline" size="sm">
                          <Pencil className="w-4 h-4" />
                        </Button>
                      </Link>
                    )}
                    {isAdmin && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDelete(diag.id, diag.titulo)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                    <Link href={`/diagnosticos/${diag.id}`}>
                      <Button size="sm" className="bg-[#0F5FA8] hover:bg-[#0A3D78]">
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
