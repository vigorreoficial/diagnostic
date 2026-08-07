'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  ClipboardList, 
  CheckCircle, 
  Building2, 
  TrendingUp 
} from 'lucide-react'

export default function DashboardPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalDiagnosticos: 0,
    emAndamento: 0,
    concluidos: 0,
    totalClientes: 0,
  })
  const [diagnosticosRecentes, setDiagnosticosRecentes] = useState<any[]>([])

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      
      // Buscar diagnósticos
      const { data: diagnosticos } = await supabase
        .from('projetos_diagnostico')
        .select('*')
        .order('created_at', { ascending: false })

      // Buscar clientes
      const { data: clientes } = await supabase
        .from('empresas')
        .select('id')

      // Calcular estatísticas
      const emAndamento = diagnosticos?.filter(d => 
        d.status !== 'ENTREGA' && d.status !== 'MONITORAMENTO'
      ).length || 0

      const concluidos = diagnosticos?.filter(d => 
        d.status === 'ENTREGA' || d.status === 'MONITORAMENTO'
      ).length || 0

      setStats({
        totalDiagnosticos: diagnosticos?.length || 0,
        emAndamento,
        concluidos,
        totalClientes: clientes?.length || 0,
      })

      setDiagnosticosRecentes(diagnosticos?.slice(0, 5) || [])
      setLoading(false)
    }

    fetchData()
  }, [supabase])

  const getStatusColor = (status: string) => {
    const colors = {
      'CADASTRO': 'bg-gray-400',
      'PLANEJAMENTO': 'bg-blue-400',
      'COLETA': 'bg-yellow-400',
      'ANALISE': 'bg-purple-400',
      'REVISAO': 'bg-orange-400',
      'PREDICAO': 'bg-indigo-400',
      'ENTREGA': 'bg-green-400',
      'MONITORAMENTO': 'bg-teal-400',
    }
    return colors[status as keyof typeof colors] || 'bg-gray-400'
  }

  const getStatusLabel = (status: string) => {
    const labels = {
      'CADASTRO': 'Cadastro',
      'PLANEJAMENTO': 'Planejamento',
      'COLETA': 'Coleta de dados',
      'ANALISE': 'Análise',
      'REVISAO': 'Revisão',
      'PREDICAO': 'Predição',
      'ENTREGA': 'Entrega',
      'MONITORAMENTO': 'Monitoramento',
    }
    return labels[status as keyof typeof labels] || status
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-vigorre-primary"></div>
      </div>
    )
  }

  const cards = [
    {
      title: 'Total de Diagnósticos',
      value: stats.totalDiagnosticos,
      icon: ClipboardList,
      color: 'text-vigorre-primary',
      bg: 'bg-vigorre-very-light'
    },
    {
      title: 'Em Andamento',
      value: stats.emAndamento,
      icon: TrendingUp,
      color: 'text-yellow-500',
      bg: 'bg-yellow-50'
    },
    {
      title: 'Concluídos',
      value: stats.concluidos,
      icon: CheckCircle,
      color: 'text-green-500',
      bg: 'bg-green-50'
    },
    {
      title: 'Clientes Atendidos',
      value: stats.totalClientes,
      icon: Building2,
      color: 'text-vigorre-light',
      bg: 'bg-blue-50'
    }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-vigorre-secondary">
          Dashboard
        </h1>
        <p className="text-vigorre-gray-dark">
          Bem-vindo(a) ao Vigorre Diagnostics™ 3.0 "QUANTUM"
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-vigorre-gray-dark">
                {card.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${card.bg}`}>
                <card.icon className={`w-5 h-5 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-vigorre-dark">
                {card.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-vigorre-secondary">
            Diagnósticos Recentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {diagnosticosRecentes.length === 0 ? (
            <p className="text-vigorre-gray-dark text-center py-8">
              Nenhum diagnóstico iniciado ainda.
              <br />
              <button className="text-vigorre-primary font-medium hover:underline mt-2">
                + Criar primeiro diagnóstico
              </button>
            </p>
          ) : (
            <div className="space-y-4">
              {diagnosticosRecentes.map((diag) => (
                <div
                  key={diag.id}
                  className="flex items-center justify-between p-4 border border-vigorre-gray-medium rounded-lg hover:border-vigorre-primary transition-colors"
                >
                  <div>
                    <h4 className="font-medium text-vigorre-dark">
                      {diag.titulo || 'Diagnóstico sem título'}
                    </h4>
                    <div className="flex items-center gap-4 mt-1 text-sm text-vigorre-gray-dark">
                      <span>ID: {diag.id.slice(0, 8)}</span>
                      <span>
                        {new Date(diag.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs text-white ${getStatusColor(diag.status)}`}>
                      {getStatusLabel(diag.status)}
                    </span>
                    <button className="text-vigorre-primary hover:underline text-sm font-medium">
                      Ver detalhes
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
