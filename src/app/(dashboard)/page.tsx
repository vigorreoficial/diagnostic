'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  ComposedChart,
  Scatter,
} from 'recharts'
import {
  Loader2,
  TrendingUp,
  TrendingDown,
  Activity,
  Zap,
  Shield,
  Award,
  Building2,
  Calendar,
  Users,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
} from 'lucide-react'

// Mapeamento de módulos para exibição
const MODULOS_LABELS: Record<string, string> = {
  ESTRATEGIA: 'Estratégia',
  RH: 'RH',
  DP: 'DP',
  JURIDICO: 'Jurídico',
  SST: 'SST',
  NUTRICAO: 'Nutrição',
  FINANCEIRO: 'Financeiro',
  COMERCIAL: 'Comercial',
  QUALIDADE: 'Qualidade',
  MELHORIA_CONTINUA: 'Melhoria Contínua',
  OPERACOES: 'Operações',
  COMPRAS: 'Compras',
  TI: 'TI',
  AGRO: 'Agronegócio',
}

const CORES_MODULOS = [
  '#0F5FA8',
  '#4D90D9',
  '#0A3D78',
  '#072F5F',
  '#2E7DB5',
  '#6BA3E0',
  '#1A5A9E',
  '#3A7FC7',
  '#0B4A8A',
  '#5A9FD6',
  '#2A6FB0',
  '#4A8FD0',
  '#1A5AA0',
  '#3A80C0',
]

const CORES_STATUS = {
  CADASTRO: '#94a3b8',
  PLANEJAMENTO: '#60a5fa',
  COLETA: '#facc15',
  ANALISE: '#a78bfa',
  REVISAO: '#fb923c',
  PREDICAO: '#818cf8',
  ENTREGA: '#4ade80',
  MONITORAMENTO: '#2dd4bf',
}

export default function DashboardPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    total: 0,
    emAndamento: 0,
    concluidos: 0,
    imvMedio: 0,
    imvMax: 0,
    imvMin: 0,
  })
  const [radarData, setRadarData] = useState<any[]>([])
  const [barData, setBarData] = useState<any[]>([])
  const [lineData, setLineData] = useState<any[]>([])
  const [pieData, setPieData] = useState<any[]>([])
  const [heatmapData, setHeatmapData] = useState<any[]>([])
  const [diagnosticos, setDiagnosticos] = useState<any[]>([])
  const [periodo, setPeriodo] = useState('6')

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        // Buscar diagnósticos com dados completos
        const { data: diagData } = await supabase
          .from('projetos_diagnostico')
          .select(
            `
            *,
            empresas (id, nome),
            usuarios (id, nome)
          `
          )
          .order('created_at', { ascending: true })

        // Buscar módulos com pontuações
        const { data: modulosData } = await supabase
          .from('modulos_diagnostico')
          .select('*')
          .eq('status', 'CONCLUIDO')

        // Buscar respostas para análise
        const { data: respostasData } = await supabase
          .from('perguntas_respondidas')
          .select('*')

        // Processar dados para os gráficos
        processarDados(diagData || [], modulosData || [], respostasData || [])

        setDiagnosticos(diagData || [])
      } catch (error) {
        console.error('Erro ao carregar dados:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [supabase])

  const processarDados = (
    diagData: any[],
    modulosData: any[],
    respostasData: any[]
  ) => {
    // ========== 1. STATS ==========
    const total = diagData.length
    const emAndamento = diagData.filter(
      d => d.status !== 'ENTREGA' && d.status !== 'MONITORAMENTO'
    ).length
    const concluidos = diagData.filter(
      d => d.status === 'ENTREGA' || d.status === 'MONITORAMENTO'
    ).length

    // Calcular IMV por diagnóstico
    const imvs: number[] = []
    diagData.forEach((diag) => {
      const modulosDiag = modulosData.filter((m) => m.projeto_id === diag.id)
      if (modulosDiag.length > 0) {
        const totalPeso = modulosDiag.reduce((acc, m) => acc + (m.peso || 0), 0)
        const totalPontos = modulosDiag.reduce(
          (acc, m) => acc + (m.pontuacao || 0),
          0
        )
        const imv = totalPeso > 0 ? Math.round((totalPontos / totalPeso) * 100) : 0
        imvs.push(imv)
      }
    })

    const imvMedio = imvs.length > 0 ? Math.round(imvs.reduce((a, b) => a + b, 0) / imvs.length) : 0
    const imvMax = imvs.length > 0 ? Math.max(...imvs) : 0
    const imvMin = imvs.length > 0 ? Math.min(...imvs) : 0

    setStats({
      total,
      emAndamento,
      concluidos,
      imvMedio,
      imvMax,
      imvMin,
    })

    // ========== 2. RADAR DATA ==========
    const areas = [
      'ESTRATEGIA',
      'RH',
      'DP',
      'JURIDICO',
      'SST',
      'NUTRICAO',
      'FINANCEIRO',
      'COMERCIAL',
      'QUALIDADE',
      'MELHORIA_CONTINUA',
      'OPERACOES',
      'COMPRAS',
      'TI',
      'AGRO',
    ]

    const radarMap: Record<string, number> = {}
    areas.forEach((area) => {
      const modulosArea = modulosData.filter((m) => m.area === area)
      if (modulosArea.length > 0) {
        const totalPeso = modulosArea.reduce((acc, m) => acc + (m.peso || 0), 0)
        const totalPontos = modulosArea.reduce(
          (acc, m) => acc + (m.pontuacao || 0),
          0
        )
        radarMap[area] =
          totalPeso > 0 ? Math.round((totalPontos / totalPeso) * 100) : 0
      } else {
        radarMap[area] = 0
      }
    })

    setRadarData(
      areas.map((area) => ({
        area: MODULOS_LABELS[area] || area,
        valor: radarMap[area] || 0,
        fullMark: 100,
      }))
    )

    // ========== 3. BAR DATA ==========
    const barMap: Record<string, number> = {}
    diagData.forEach((diag) => {
      const nome = diag.empresas?.nome || 'Empresa'
      const modulosDiag = modulosData.filter((m) => m.projeto_id === diag.id)
      if (modulosDiag.length > 0) {
        const totalPeso = modulosDiag.reduce((acc, m) => acc + (m.peso || 0), 0)
        const totalPontos = modulosDiag.reduce(
          (acc, m) => acc + (m.pontuacao || 0),
          0
        )
        barMap[nome] = totalPeso > 0 ? Math.round((totalPontos / totalPeso) * 100) : 0
      }
    })

    setBarData(
      Object.entries(barMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([nome, valor]) => ({
          nome: nome.length > 15 ? nome.slice(0, 15) + '...' : nome,
          IMV: valor,
        }))
    )

    // ========== 4. LINE DATA ==========
    const lineMap: Record<string, number> = {}
    diagData.forEach((diag) => {
      const data = new Date(diag.created_at).toLocaleDateString('pt-BR', {
        month: 'short',
        year: 'numeric',
      })
      const modulosDiag = modulosData.filter((m) => m.projeto_id === diag.id)
      if (modulosDiag.length > 0) {
        const totalPeso = modulosDiag.reduce((acc, m) => acc + (m.peso || 0), 0)
        const totalPontos = modulosDiag.reduce(
          (acc, m) => acc + (m.pontuacao || 0),
          0
        )
        const imv = totalPeso > 0 ? Math.round((totalPontos / totalPeso) * 100) : 0
        if (!lineMap[data] || lineMap[data] < imv) {
          lineMap[data] = imv
        }
      }
    })

    // Pegar últimos 6 meses
    const sortedKeys = Object.keys(lineMap).sort(
      (a, b) => new Date(a).getTime() - new Date(b).getTime()
    )
    const lastKeys = sortedKeys.slice(-6)
    setLineData(
      lastKeys.map((key) => ({
        mes: key,
        IMV: lineMap[key],
      }))
    )

    // ========== 5. PIE DATA ==========
    const pieMap: Record<string, number> = {}
    diagData.forEach((diag) => {
      const status = diag.status
      if (!pieMap[status]) pieMap[status] = 0
      pieMap[status]++
    })

    setPieData(
      Object.entries(pieMap).map(([status, count]) => ({
        status: getStatusLabel(status),
        count,
        color: CORES_STATUS[status as keyof typeof CORES_STATUS] || '#94a3b8',
      }))
    )

    // ========== 6. HEATMAP DATA ==========
    const heatmapMap: Record<string, { area: string; risco: number }> = {}
    const areasRisco = [
      'ESTRATEGIA',
      'RH',
      'DP',
      'JURIDICO',
      'SST',
      'NUTRICAO',
      'FINANCEIRO',
      'COMERCIAL',
      'QUALIDADE',
      'MELHORIA_CONTINUA',
      'OPERACOES',
      'COMPRAS',
      'TI',
      'AGRO',
    ]

    areasRisco.forEach((area) => {
      const modulosArea = modulosData.filter((m) => m.area === area)
      if (modulosArea.length > 0) {
        const totalPeso = modulosArea.reduce((acc, m) => acc + (m.peso || 0), 0)
        const totalPontos = modulosArea.reduce(
          (acc, m) => acc + (m.pontuacao || 0),
          0
        )
        const imv = totalPeso > 0 ? Math.round((totalPontos / totalPeso) * 100) : 0
        const risco = Math.max(0, 100 - imv)
        heatmapMap[area] = { area: MODULOS_LABELS[area] || area, risco }
      } else {
        heatmapMap[area] = { area: MODULOS_LABELS[area] || area, risco: 0 }
      }
    })

    setHeatmapData(Object.values(heatmapMap))
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      CADASTRO: 'Cadastro',
      PLANEJAMENTO: 'Planejamento',
      COLETA: 'Coleta',
      ANALISE: 'Análise',
      REVISAO: 'Revisão',
      PREDICAO: 'Predição',
      ENTREGA: 'Entrega',
      MONITORAMENTO: 'Monitoramento',
    }
    return labels[status] || status
  }

  const getRiskColor = (risco: number) => {
    if (risco >= 70) return 'bg-red-500'
    if (risco >= 40) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const getRiskText = (risco: number) => {
    if (risco >= 70) return 'Alto'
    if (risco >= 40) return 'Médio'
    return 'Baixo'
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
          <h1 className="text-2xl font-bold text-[#0A3D78]">Dashboard</h1>
          <p className="text-[#5E6C84] text-sm">
            Visão completa dos diagnósticos e métricas de maturidade
          </p>
        </div>
        <Select value={periodo} onValueChange={setPeriodo}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="3">Últimos 3 meses</SelectItem>
            <SelectItem value="6">Últimos 6 meses</SelectItem>
            <SelectItem value="12">Últimos 12 meses</SelectItem>
            <SelectItem value="TODOS">Todos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-[#5E6C84] font-medium">Total Diagnósticos</p>
            <p className="text-2xl font-bold text-[#0A3D78]">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-[#5E6C84] font-medium">Em Andamento</p>
            <p className="text-2xl font-bold text-yellow-500">{stats.emAndamento}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-[#5E6C84] font-medium">Concluídos</p>
            <p className="text-2xl font-bold text-green-500">{stats.concluidos}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-[#5E6C84] font-medium">IMV™ Médio</p>
            <p className="text-2xl font-bold text-[#0F5FA8]">{stats.imvMedio}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-[#5E6C84] font-medium">Melhor IMV™</p>
            <p className="text-2xl font-bold text-green-600">{stats.imvMax}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="radar" className="space-y-6">
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="radar">📡 Radar</TabsTrigger>
          <TabsTrigger value="barras">📊 Barras</TabsTrigger>
          <TabsTrigger value="evolucao">📈 Evolução</TabsTrigger>
          <TabsTrigger value="distribuicao">🍩 Distribuição</TabsTrigger>
          <TabsTrigger value="riscos">🔥 Riscos</TabsTrigger>
        </TabsList>

        {/* RADAR */}
        <TabsContent value="radar">
          <Card>
            <CardHeader>
              <CardTitle className="text-[#0A3D78]">Radar de Maturidade</CardTitle>
              <CardDescription>
                Distribuição da maturidade por área de diagnóstico
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                    <PolarGrid stroke="#D7DEE8" />
                    <PolarAngleAxis
                      dataKey="area"
                      tick={{ fill: '#1C1F26', fontSize: 11 }}
                    />
                    <PolarRadiusAxis
                      angle={30}
                      domain={[0, 100]}
                      tick={{ fill: '#5E6C84', fontSize: 10 }}
                    />
                    <Radar
                      name="Maturidade"
                      dataKey="valor"
                      stroke="#0F5FA8"
                      fill="#0F5FA8"
                      fillOpacity={0.6}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        borderRadius: '8px',
                        border: '1px solid #D7DEE8',
                      }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* BARRAS */}
        <TabsContent value="barras">
          <Card>
            <CardHeader>
              <CardTitle className="text-[#0A3D78]">IMV™ por Diagnóstico</CardTitle>
              <CardDescription>
                Comparação da maturidade entre diagnósticos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#D7DEE8" />
                    <XAxis dataKey="nome" tick={{ fill: '#5E6C84', fontSize: 11 }} />
                    <YAxis domain={[0, 100]} tick={{ fill: '#5E6C84', fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        borderRadius: '8px',
                        border: '1px solid #D7DEE8',
                      }}
                    />
                    <Bar dataKey="IMV" fill="#0F5FA8" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* EVOLUÇÃO */}
        <TabsContent value="evolucao">
          <Card>
            <CardHeader>
              <CardTitle className="text-[#0A3D78]">Evolução do IMV™</CardTitle>
              <CardDescription>
                Projeção da maturidade ao longo do tempo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={lineData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#D7DEE8" />
                    <XAxis dataKey="mes" tick={{ fill: '#5E6C84', fontSize: 11 }} />
                    <YAxis domain={[0, 100]} tick={{ fill: '#5E6C84', fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        borderRadius: '8px',
                        border: '1px solid #D7DEE8',
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="IMV"
                      stroke="#0F5FA8"
                      strokeWidth={2}
                      dot={{ fill: '#0F5FA8', r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* DISTRIBUIÇÃO */}
        <TabsContent value="distribuicao">
          <Card>
            <CardHeader>
              <CardTitle className="text-[#0A3D78]">Distribuição de Status</CardTitle>
              <CardDescription>
                Status atual dos diagnósticos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={130}
                      paddingAngle={2}
                      dataKey="count"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        borderRadius: '8px',
                        border: '1px solid #D7DEE8',
                      }}
                    />
                    <Legend
                      formatter={(value) => <span style={{ color: '#1C1F26', fontSize: 12 }}>{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* RISCOS */}
        <TabsContent value="riscos">
          <Card>
            <CardHeader>
              <CardTitle className="text-[#0A3D78]">Heatmap de Riscos</CardTitle>
              <CardDescription>
                Identificação de riscos por área
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {heatmapData.map((item) => (
                  <div key={item.area} className="text-center">
                    <div
                      className={`w-full h-16 rounded-lg ${getRiskColor(item.risco)} flex items-center justify-center text-white font-bold text-lg`}
                    >
                      {getRiskText(item.risco)}
                    </div>
                    <p className="text-xs mt-1 text-[#5E6C84]">{item.area}</p>
                    <p className="text-xs font-medium text-[#1C1F26]">
                      Risco: {item.risco}%
                    </p>
                  </div>
                ))}
              </div>
              <div className="flex justify-center gap-4 mt-6 text-xs">
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
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

