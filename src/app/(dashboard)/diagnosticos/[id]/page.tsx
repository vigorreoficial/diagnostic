'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ArrowLeft,
  Building2,
  User,
  Calendar,
  Pencil,
  Loader2,
  ClipboardList,
  CheckCircle,
  Clock,
  AlertCircle,
  Users,
  Award,
  UserCheck
} from 'lucide-react'
import { toast } from 'sonner'

// Lista de módulos para exibição
const MODULOS_LABELS: Record<string, string> = {
  'ESTRATEGIA': 'Estratégia e Governança',
  'RH': 'Recursos Humanos',
  'DP': 'Departamento Pessoal',
  'JURIDICO': 'Jurídico e Compliance',
  'SST': 'Saúde e Segurança do Trabalho',
  'NUTRICAO': 'Nutrição Organizacional',
  'FINANCEIRO': 'Financeiro',
  'COMERCIAL': 'Comercial e Marketing',
  'QUALIDADE': 'Qualidade',
  'MELHORIA_CONTINUA': 'Melhoria Contínua',
  'OPERACOES': 'Operações e Logística',
  'COMPRAS': 'Compras e Suprimentos',
  'TI': 'Tecnologia da Informação',
  'AGRO': 'Agronegócio',
}

export default function DetalhesDiagnosticoPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [diagnostico, setDiagnostico] = useState<any>(null)
  const [modulos, setModulos] = useState<any[]>([])
  const [userData, setUserData] = useState<any>(null)
  const [auditoresCount, setAuditoresCount] = useState(0)
  const [especialistasCount, setEspecialistasCount] = useState(0)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)

      try {
        const id = params.id as string

        // Buscar usuário
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data } = await supabase
            .from('usuarios')
            .select('*')
            .eq('auth_user_id', user.id)
            .single()
          setUserData(data)
        }

        // Buscar diagnóstico
        const { data, error } = await supabase
          .from('projetos_diagnostico')
          .select(`
            *,
            empresas (id, nome, cnpj, porte, segmento),
            usuarios (id, nome, perfil)
          `)
          .eq('id', id)
          .single()

        if (error) {
          toast.error('Diagnóstico não encontrado')
          router.push('/diagnosticos')
          return
        }

        setDiagnostico(data)

        // Buscar módulos
        const { data: modulosData } = await supabase
          .from('modulos_diagnostico')
          .select('*')
          .eq('projeto_id', id)
          .order('area', { ascending: true })

        setModulos(modulosData || [])

        // Contar auditores vinculados
        const { count: auditoresCount } = await supabase
          .from('modulo_auditor')
          .select('*', { count: 'exact', head: true })
          .eq('projeto_id', id)

        setAuditoresCount(auditoresCount || 0)

        // Contar especialistas vinculados
        const moduloIds = modulosData?.map(m => m.id) || []
        if (moduloIds.length > 0) {
          const { count: especialistasCount } = await supabase
            .from('modulo_especialista')
            .select('*', { count: 'exact', head: true })
            .in('modulo_id', moduloIds)

          setEspecialistasCount(especialistasCount || 0)
        }
      } catch (error) {
        toast.error('Erro ao carregar dados')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [params.id, supabase, router])

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

  const getStatusIcon = (status: string) => {
    if (status === 'ENTREGA' || status === 'MONITORAMENTO') {
      return <CheckCircle className="w-5 h-5 text-green-500" />
    }
    if (status === 'CADASTRO' || status === 'PLANEJAMENTO') {
      return <Clock className="w-5 h-5 text-blue-500" />
    }
    return <AlertCircle className="w-5 h-5 text-yellow-500" />
  }

  const getModuloStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'PENDENTE': 'bg-gray-200 text-gray-600',
      'EM_ANDAMENTO': 'bg-yellow-100 text-yellow-700',
      'CONCLUIDO': 'bg-green-100 text-green-700',
      'VALIDADO': 'bg-blue-100 text-blue-700',
    }
    return colors[status] || 'bg-gray-200 text-gray-600'
  }

  const getModuloStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'PENDENTE': 'Pendente',
      'EM_ANDAMENTO': 'Em andamento',
      'CONCLUIDO': 'Concluído',
      'VALIDADO': 'Validado',
    }
    return labels[status] || status
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#0F5FA8]" />
      </div>
    )
  }

  if (!diagnostico) {
    return (
      <div className="text-center py-12">
        <p className="text-[#5E6C84]">Diagnóstico não encontrado</p>
        <Button className="mt-4" onClick={() => router.push('/diagnosticos')}>
          Voltar para diagnósticos
        </Button>
      </div>
    )
  }

  const isAdmin = userData?.perfil === 'ADMIN'
  const isConsultor = userData?.perfil === 'CONSULTOR'
  const canEdit = isAdmin || (isConsultor && diagnostico.usuarios?.id === userData?.id)

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="text-[#5E6C84] hover:text-[#0F5FA8]"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-[#0A3D78]">
              {diagnostico.titulo || 'Diagnóstico sem título'}
            </h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-sm text-[#5E6C84]">
                <Building2 className="w-4 h-4 inline mr-1" />
                {diagnostico.empresas?.nome || 'Empresa não identificada'}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium text-white ${getStatusColor(diagnostico.status)}`}>
                {getStatusLabel(diagnostico.status)}
              </span>
            </div>
          </div>
        </div>
        {canEdit && (
          <Link href={`/diagnosticos/${diagnostico.id}/editar`}>
            <Button variant="outline">
              <Pencil className="w-4 h-4 mr-2" />
              Editar
            </Button>
          </Link>
        )}
      </div>

      {/* Informações do Diagnóstico */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-[#0A3D78]">Informações Gerais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Building2 className="w-4 h-4 text-[#5E6C84]" />
              <span className="text-[#5E6C84]">Empresa:</span>
              <Link href={`/clientes/${diagnostico.empresas?.id}`} className="text-[#0F5FA8] hover:underline">
                {diagnostico.empresas?.nome || '—'}
              </Link>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <User className="w-4 h-4 text-[#5E6C84]" />
              <span className="text-[#5E6C84]">Responsável:</span>
              <span className="text-[#1C1F26] font-medium">
                {diagnostico.usuarios?.nome || 'Não atribuído'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-[#5E6C84]" />
              <span className="text-[#5E6C84]">Criado em:</span>
              <span className="text-[#1C1F26] font-medium">
                {diagnostico.created_at ? new Date(diagnostico.created_at).toLocaleString('pt-BR') : '—'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              {getStatusIcon(diagnostico.status)}
              <span className="text-[#5E6C84]">Status:</span>
              <span className="text-[#1C1F26] font-medium">
                {getStatusLabel(diagnostico.status)}
              </span>
            </div>

            {/* Link para Módulos do Diagnóstico */}
            <div className="pt-2 mt-2 border-t border-[#D7DEE8]" />
            <div className="flex items-center gap-2 text-sm">
              <ClipboardList className="w-4 h-4 text-[#0F5FA8]" />
              <Link 
                href={`/diagnosticos/${diagnostico.id}/modulos`}
                className="text-[#0F5FA8] hover:underline font-medium"
              >
                Responder Módulos ({modulos.filter(m => m.status === 'CONCLUIDO' || m.status === 'VALIDADO').length}/{modulos.length})
              </Link>
            </div>

            {/* Links para Auditores e Especialistas (apenas ADMIN) */}
            {isAdmin && (
              <>
                <div className="flex items-center gap-2 text-sm">
                  <Users className="w-4 h-4 text-[#5E6C84]" />
                  <span className="text-[#5E6C84]">Auditores:</span>
                  <Link 
                    href={`/diagnosticos/${diagnostico.id}/auditores`} 
                    className="text-[#0F5FA8] hover:underline font-medium"
                  >
                    Gerenciar ({auditoresCount})
                  </Link>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Award className="w-4 h-4 text-[#5E6C84]" />
                  <span className="text-[#5E6C84]">Especialistas:</span>
                  <Link 
                    href={`/diagnosticos/${diagnostico.id}/especialistas`} 
                    className="text-[#0F5FA8] hover:underline font-medium"
                  >
                    Gerenciar ({especialistasCount})
                  </Link>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-[#0A3D78]">Módulos ({modulos.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {modulos.length === 0 ? (
              <p className="text-[#5E6C84] text-center py-6">
                Nenhum módulo selecionado.
              </p>
            ) : (
              <div className="space-y-2">
                {modulos.map((modulo) => (
                  <div
                    key={modulo.id}
                    className="flex items-center justify-between p-2 bg-[#F7F8FA] rounded-lg"
                  >
                    <div>
                      <span className="text-sm font-medium text-[#1C1F26]">
                        {MODULOS_LABELS[modulo.area] || modulo.area}
                      </span>
                      <span className="ml-2 text-xs text-[#5E6C84]">
                        peso {modulo.peso}%
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {modulo.pontuacao > 0 && (
                        <span className="text-xs font-medium text-[#0F5FA8]">
                          {modulo.pontuacao}%
                        </span>
                      )}
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getModuloStatusColor(modulo.status)}`}>
                        {getModuloStatusLabel(modulo.status)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
