'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Loader2, CheckCircle, Clock, AlertCircle, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { Progress } from '@/components/ui/progress'

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

export default function ListaModulosPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  const diagnosticoId = params.id as string

  const [loading, setLoading] = useState(true)
  const [modulos, setModulos] = useState<any[]>([])
  const [diagnostico, setDiagnostico] = useState<any>(null)
  const [userData, setUserData] = useState<any>(null)
  const [progressoTotal, setProgressoTotal] = useState(0)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)

      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data } = await supabase
            .from('usuarios')
            .select('*')
            .eq('user_id', user.id)
            .single()
          setUserData(data)
        }

        const { data: diagData } = await supabase
          .from('projetos_diagnostico')
          .select('*, empresas(nome)')
          .eq('id', diagnosticoId)
          .single()
        setDiagnostico(diagData)

        const { data: modulosData } = await supabase
          .from('modulos_diagnostico')
          .select('*')
          .eq('projeto_id', diagnosticoId)
          .order('area', { ascending: true })

        setModulos(modulosData || [])

        // Calcular progresso
        const total = modulosData?.length || 0
        const concluidos = modulosData?.filter(m => m.status === 'CONCLUIDO' || m.status === 'VALIDADO').length || 0
        setProgressoTotal(total > 0 ? Math.round((concluidos / total) * 100) : 0)
      } catch (error) {
        toast.error('Erro ao carregar dados')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [supabase, diagnosticoId])

  const getStatusIcon = (status: string) => {
    if (status === 'CONCLUIDO' || status === 'VALIDADO') {
      return <CheckCircle className="w-5 h-5 text-green-500" />
    }
    if (status === 'EM_ANDAMENTO') {
      return <Clock className="w-5 h-5 text-yellow-500" />
    }
    return <AlertCircle className="w-5 h-5 text-gray-400" />
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'PENDENTE': 'Pendente',
      'EM_ANDAMENTO': 'Em andamento',
      'CONCLUIDO': 'Concluído',
      'VALIDADO': 'Validado',
    }
    return labels[status] || status
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'PENDENTE': 'bg-gray-100 text-gray-600',
      'EM_ANDAMENTO': 'bg-yellow-100 text-yellow-700',
      'CONCLUIDO': 'bg-green-100 text-green-700',
      'VALIDADO': 'bg-blue-100 text-blue-700',
    }
    return colors[status] || 'bg-gray-100 text-gray-600'
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
          <h1 className="text-2xl font-bold text-[#0A3D78]">Módulos do Diagnóstico</h1>
          <p className="text-[#5E6C84] text-sm">
            {diagnostico?.titulo} - {diagnostico?.empresas?.nome || 'Empresa'}
          </p>
        </div>
      </div>

      {/* Progresso */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-[#5E6C84]">
              Progresso do diagnóstico: {modulos.filter(m => m.status === 'CONCLUIDO' || m.status === 'VALIDADO').length} de {modulos.length} módulos concluídos
            </span>
            <span className="text-sm font-medium text-[#0F5FA8]">
              {progressoTotal}%
            </span>
          </div>
          <Progress value={progressoTotal} className="h-2" />
        </CardContent>
      </Card>

      {/* Lista de Módulos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {modulos.map((modulo) => (
          <Link
            key={modulo.id}
            href={`/diagnosticos/${diagnosticoId}/modulos/${modulo.id}`}
            className="block"
          >
            <Card className="hover:shadow-lg transition-shadow cursor-pointer hover:border-[#0F5FA8]">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(modulo.status)}
                      <CardTitle className="text-[#0A3D78] text-base">
                        {MODULOS_LABELS[modulo.area] || modulo.area}
                      </CardTitle>
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(modulo.status)}`}>
                        {getStatusLabel(modulo.status)}
                      </span>
                      <span className="text-xs text-[#5E6C84]">
                        Peso: {modulo.peso}%
                      </span>
                      {modulo.pontuacao > 0 && (
                        <span className="text-xs font-medium text-[#0F5FA8]">
                          Nota: {modulo.pontuacao}%
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-[#D7DEE8]" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
