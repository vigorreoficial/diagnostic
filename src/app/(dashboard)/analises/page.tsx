'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, TrendingUp, TrendingDown, Activity, Zap, Shield, Award, Users, Building2, Calendar } from 'lucide-react'
import { toast } from 'sonner'

// Mapeamento de módulos
const MODULOS_LABELS: Record<string, string> = {
  'ESTRATEGIA': 'Estratégia',
  'RH': 'RH',
  'DP': 'DP',
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

const CORES_MODULOS = [
  '#0F5FA8', '#4D90D9', '#0A3D78', '#072F5F', '#2E7DB5',
  '#6BA3E0', '#1A5A9E', '#3A7FC7', '#0B4A8A', '#5A9FD6',
  '#2A6FB0', '#4A8FD0', '#1A5AA0', '#3A80C0'
]

export default function AnalisesPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [userData, setUserData] = useState<any>(null)
  const [stats, setStats] = useState({
    totalDiagnosticos: 0,
    totalClientes: 0,
    imvMedio: 0,
    imvMaximo: 0,
    emAndamento: 0,
    concluidos: 0,
    evolucao: 0,
  })
  const [modulosData, setModulosData] = useState<any[]>([])
  const [diagnosticosRecentes, setDiagnosticosRecentes] = useState<any[]>([])
  const [filter, setFilter] = useState('todos')

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

        const { data: diagnosticos } = await supabase
          .from('projetos_diagnostico')
          .select(`
            *,
            empresas (id, nome),
            usuarios (id, nome)
          `)
          .order('created_at', { ascending: false })

        const { data: modulos } = await supabase
          .from('modulos_diagnostico')
          .select('*')
          .eq('status', 'CONCLUIDO')

        const { data: clientes } = await supabase
          .from('empresas')
          .select('id')

        const total = diagnosticos?.length || 0
        const emAndamento = diagnosticos?.filter(d => 
          d.status !== 'ENTREGA' && d.status !== 'MONITORAMENTO'
        ).length || 0
        const concluidos = diagnosticos?.filter(d => 
          d.status === 'ENTREGA' || d.status === 'MONITORAMENTO'
        ).length || 0

        let imvTotal = 0
        let imvMax = 0
        if (modulos) {
          const porDiagnostico: Record<string, number> = {}
          modulos.forEach(m => {
            if (!porDiagnostico[m.projeto_id]) {
              porDiagnostico[m.projeto_id] = 0
            }
            porDiagnostico[m.projeto_id] += m.pontuacao || 0
          })
          const valores = Object.values(porDiagnostico)
          if (valores.length > 0) {
            imvTotal = valores.reduce((a, b) => a + b, 0) / valores.length
            imvMax = Math.max(...valores)
          }
          setModulosData(modulos)
        }

        setStats({
          totalDiagnosticos: total,
          totalClientes: clientes?.length || 0,
          imvMedio: Math.round(imvTotal),
          imvMaximo: imvMax,
          emAndamento,
          concluidos,
          evolucao: 12,
        })

        setDiagnosticosRecentes(diagnosticos?.slice(0, 5) || [])
      } catch (error) {
        toast.error('Erro ao carregar dados')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [supabase])

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
      <div>
        <h1 className="text-2xl font-bold text-[#0A3D78]">Análises e Indicadores</h1>
        <p className="text-[#5E6C84] text-sm">
          Visão consolidada dos diagnósticos e métricas de maturidade
        </p>
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#5E6C84] font-medium">IMV™ Médio</p>
                <p className="text-2xl font-bold text-[#0F5FA8]">{stats.imvMedio}</p>
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  +{stats.evolucao}% vs último mês
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-[#EAF3FC] flex items-center justify-center">
                <Zap className="w-5 h-5 text-[#0F5FA8]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#5E6C84] font-medium">Diagnósticos</p>
                <p className="text-2xl font-bold text-[#0A3D78]">{stats.totalDiagnosticos}</p>
                <p className="text-xs text-[#5E6C84]">
                  {stats.emAndamento} em andamento, {stats.concluidos} concluídos
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-[#EAF3FC] flex items-center justify-center">
                <Activity className="w-5 h-5 text-[#0A3D78]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#5E6C84] font-medium">Clientes</p>
                <p className="text-2xl font-bold text-[#4D90D9]">{stats.totalClientes}</p>
                <p className="text-xs text-[#5E6C84]">
                  <Building2 className="w-3 h-3 inline" /> empresas atendidas
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-[#4D90D9]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#5E6C84] font-medium">Melhor IMV™</p>
                <p className="text-2xl font-bold text-green-600">{stats.imvMaximo}</p>
                <p className="text-xs text-[#5E6C84]">
                  <Award className="w-3 h-3 inline" /> pontuação máxima
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                <Award className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        <Button 
          variant={filter === 'todos' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => setFilter('todos')}
          className={filter === 'todos' ? 'bg-[#0F5FA8]' : ''}
        >
          Todos
        </Button>
        <Button 
          variant={filter === 'concluidos' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => setFilter('concluidos')}
          className={filter === 'concluidos' ? 'bg-[#0F5FA8]' : ''}
        >
          Concluídos
        </Button>
        <Button 
          variant={filter === 'andamento' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => setFilter('andamento')}
          className={filter === 'andamento' ? 'bg-[#0F5FA8]' : ''}
        >
          Em Andamento
        </Button>
      </div>

      {/* Radar - Maturidade por Área */}
      <Card>
        <CardHeader>
          <CardTitle className="text-[#0A3D78] flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Radar de Maturidade por Área
          </CardTitle>
          <p className="text-sm text-[#5E6C84]">
            Distribuição da maturidade nas áreas diagnosticadas
          </p>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] flex items-center justify-center bg-[#F7F8FA] rounded-lg">
            <div className="text-center text-[#5E6C84]">
              <div className="w-64 h-64 mx-auto relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-full h-full rounded-full border-2 border-[#D7DEE8]">
                    <div className="absolute inset-[10%] rounded-full border-2 border-[#D7DEE8]"></div>
                    <div className="absolute inset-[30%] rounded-full border-2 border-[#D7DEE8]"></div>
                    <div className="absolute inset-[50%] rounded-full border-2 border-[#D7DEE8]"></div>
                    <div className="absolute inset-[70%] rounded-full border-2 border-[#D7DEE8]"></div>
                    
                    {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => (
                      <div
                        key={i}
                        className="absolute inset-0"
                        style={{
                          transform: `rotate(${deg}deg)`,
                          transformOrigin: 'center'
                        }}
                      >
                        <div className="absolute top-1/2 left-1/2 w-[1px] h-[50%] bg-[#D7DEE8] -translate-x-1/2 -translate-y-1/2"></div>
                      </div>
                    ))}

                    <div className="absolute inset-[15%] bg-[#0F5FA8]/20 rounded-full">
                      <div className="absolute inset-0 bg-[#0F5FA8]/10" 
                        style={{
                          clipPath: 'polygon(50% 0%, 80% 30%, 90% 70%, 60% 90%, 30% 80%, 10% 60%, 20% 20%)'
                        }}
                      />
                    </div>

                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-medium text-[#0A3D78]">Estratégia</div>
                    <div className="absolute top-1/2 -right-16 -translate-y-1/2 text-xs font-medium text-[#0A3D78]">RH</div>
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs font-medium text-[#0A3D78]">Qualidade</div>
                    <div className="absolute top-1/2 -left-16 -translate-y-1/2 text-xs font-medium text-[#0A3D78]">SST</div>
                  </div>
                </div>
              </div>
              <p className="mt-4 text-sm text-[#5E6C84]">
                Gráfico completo disponível em breve com dados reais
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Heatmap - Riscos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-[#0A3D78] flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Heatmap de Riscos por Área
          </CardTitle>
          <p className="text-sm text-[#5E6C84]">
            Identificação de riscos críticos por área
          </p>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center bg-[#F7F8FA] rounded-lg">
            <div className="text-center text-[#5E6C84]">
              <div className="grid grid-cols-4 gap-4 max-w-md mx-auto">
                {[
                  { area: 'Estratégia', risco: 'Baixo', cor: 'bg-green-500' },
                  { area: 'RH', risco: 'Médio', cor: 'bg-yellow-500' },
                  { area: 'Jurídico', risco: 'Alto', cor: 'bg-red-500' },
                  { area: 'SST', risco: 'Médio', cor: 'bg-yellow-500' },
                  { area: 'Qualidade', risco: 'Baixo', cor: 'bg-green-500' },
                  { area: 'Financeiro', risco: 'Médio', cor: 'bg-yellow-500' },
                  { area: 'Operações', risco: 'Alto', cor: 'bg-red-500' },
                  { area: 'TI', risco: 'Baixo', cor: 'bg-green-500' },
                ].map((item, i) => (
                  <div key={i} className="text-center">
                    <div className={`w-full h-12 rounded-lg ${item.cor} flex items-center justify-center text-white text-xs font-medium`}>
                      {item.risco}
                    </div>
                    <p className="text-xs mt-1 text-[#5E6C84]">{item.area}</p>
                  </div>
                ))}
              </div>
              <div className="flex justify-center gap-4 mt-4 text-xs">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-green-500"></span> Baixo
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-yellow-500"></span> Médio
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-red-500"></span> Alto
                </span>
              </div>
              <p className="mt-4 text-sm text-[#5E6C84]">
                Heatmap completo disponível em breve com dados reais
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Diagnósticos Recentes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-[#0A3D78] flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Diagnósticos Recentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {diagnosticosRecentes.length === 0 ? (
            <p className="text-[#5E6C84] text-center py-6">
              Nenhum diagnóstico realizado ainda.
            </p>
          ) : (
            <div className="space-y-3">
              {diagnosticosRecentes.map((diag) => (
                <div
                  key={diag.id}
                  className="flex items-center justify-between p-3 border border-[#D7DEE8] rounded-lg hover:border-[#0F5FA8] transition-colors"
                >
                  <div>
                    <p className="font-medium text-[#1C1F26] text-sm">
                      {diag.titulo || 'Diagnóstico sem título'}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-[#5E6C84]">
                      <span>{diag.empresas?.nome || '—'}</span>
                      <span className={`px-2 py-0.5 rounded-full text-white ${getStatusColor(diag.status)}`}>
                        {getStatusLabel(diag.status)}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-[#5E6C84]">
                      {diag.created_at ? new Date(diag.created_at).toLocaleDateString('pt-BR') : '—'}
                    </p>
                    <p className="text-xs font-medium text-[#0F5FA8]">
                      IMV: 0
                    </p>
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
