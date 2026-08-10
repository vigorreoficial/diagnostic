'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
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
import { Button } from '@/components/ui/button'
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
  ChevronRight,
  Eye,
  EyeOff,
} from 'lucide-react'
import Link from 'next/link'

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
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [userData, setUserData] = useState<any>(null)
  const [perfil, setPerfil] = useState<string>('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [isConsultor, setIsConsultor] = useState(false)
  const [isAuditor, setIsAuditor] = useState(false)
  const [isEspecialista, setIsEspecialista] = useState(false)
  const [isCliente, setIsCliente] = useState(false)

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
  const [diagnosticosRecentes, setDiagnosticosRecentes] = useState<any[]>([])
  const [periodo, setPeriodo] = useState('6')
  const [userId, setUserId] = useState<string>('')

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        // 1. Buscar usuário logado
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)

        if (user) {
          // 2. Buscar dados do usuário na tabela public
          const { data: userInfo } = await supabase
            .from('usuarios')
            .select('*')
            .eq('auth_user_id', user.id)
            .single()
          
          setUserData(userInfo)
          setUserId(userInfo?.id || '')
          
          const perfilUsuario = userInfo?.perfil || ''
          setPerfil(perfilUsuario)
          
          // 3. Definir permissões
          setIsAdmin(perfilUsuario === 'ADMIN')
          setIsConsultor(perfilUsuario === 'CONSULTOR')
          setIsAuditor(perfilUsuario === 'AUDITOR')
          setIsEspecialista(perfilUsuario === 'ESPECIALISTA')
          setIsCliente(perfilUsuario === 'CLIENTE')
        }

        // 4. Buscar dados conforme perfil
        await fetchDadosPorPerfil()
      } catch (error) {
        console.error('Erro ao carregar dados:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [supabase])

  const fetchDadosPorPerfil = async () => {
    let query = supabase.from('projetos_diagnostico').select(`
      *,
      empresas (id, nome),
      usuarios (id, nome)
    `)

    // ============================================
    // FILTROS POR PERFIL (CONFORME PRD)
    // ============================================

    if (isAdmin) {
      // ADMIN: Vê TUDO
      // Sem filtros adicionais
    } else if (isConsultor) {
      // CONSULTOR: Vê APENAS seus diagnósticos
      query = query.eq('responsavel_id', userId)
    } else if (isAuditor) {
      // AUDITOR: Vê APENAS diagnósticos onde é auditor
      const { data: auditorias } = await supabase
        .from('modulo_auditor')
        .select('projeto_id')
        .eq('auditor_id', userId)
      
      const projetoIds = auditorias?.map(a => a.projeto_id) || []
      if (projetoIds.length > 0) {
        query = query.in('id', projetoIds)
      } else {
        // Se não for auditor de nenhum projeto, retorna vazio
        setStats({ total: 0, emAndamento: 0, concluidos: 0, imvMedio: 0, imvMax: 0, imvMin: 0 })
        setRadarData([])
        setBarData([])
        setLineData([])
        setPieData([])
        setHeatmapData([])
        setDiagnosticosRecentes([])
        return
      }
    } else if (isEspecialista) {
      // ESPECIALISTA: Vê APENAS módulos onde é especialista
      const { data: especializacoes } = await supabase
        .from('modulo_especialista')
        .select('modulo_id')
        .eq('especialista_id', userId)
      
      const moduloIds = especializacoes?.map(e => e.modulo_id) || []
      if (moduloIds.length > 0) {
        const { data: modulos } = await supabase
          .from('modulos_diagnostico')
          .select('projeto_id')
          .in('id', moduloIds)
        
        const projetoIds = modulos?.map(m => m.projeto_id) || []
        if (projetoIds.length > 0) {
          query = query.in('id', projetoIds)
        } else {
          setStats({ total: 0, emAndamento: 0, concluidos: 0, imvMedio: 0, imvMax: 0, imvMin: 0 })
          setRadarData([])
          setBarData([])
          setLineData([])
          setPieData([])
          setHeatmapData([])
          setDiagnosticosRecentes([])
          return
        }
      } else {
        setStats({ total: 0, emAndamento: 0, concluidos: 0, imvMedio: 0, imvMax: 0, imvMin: 0 })
        setRadarData([])
        setBarData([])
        setLineData([])
        setPieData([])
        setHeatmapData([])
        setDiagnosticosRecentes([])
        return
      }
    } else if (isCliente) {
      // CLIENTE: Vê APENAS seu próprio diagnóstico
      const empresaId = userData?.empresa_id
      if (empresaId) {
        query = query.eq('empresa_id', empresaId)
      } else {
        setStats({ total: 0, emAndamento: 0, concluidos: 0, imvMedio: 0, imvMax: 0, imvMin: 0 })
        setRadarData([])
        setBarData([])
        setLineData([])
        setPieData([])
        setHeatmapData([])
        setDiagnosticosRecentes([])
        return
      }
    }

    // 5. Executar query
    const { data: diagData } = await query.order('created_at', { ascending: true })

    // 6. Buscar módulos relacionados
    let modulosData: any[] = []
    if (diagData && diagData.length > 0) {
      const projetoIds = diagData.map(d => d.id)
      const { data: modulos } = await supabase
        .from('modulos_diagnostico')
        .select('*')
        .in('projeto_id', projetoIds)
        .eq('status', 'CONCLUIDO')
      modulosData = modulos || []
    }

    // 7. Processar dados
    processarDados(diagData || [], modulosData)
    setDiagnosticosRecentes(diagData?.slice(-5).reverse() || [])
  }

  const processarDados = (diagData: any[], modulosData: any[]) => {
    const total = diagData.length
    const emAndamento = diagData.filter(
      d => d.status !== 'ENTREGA' && d.status !== 'MONITORAMENTO'
    ).length
    const concluidos = diagData.filter(
      d => d.status === 'ENTREGA' || d.status === 'MONITORAMENTO'
    ).length

    const imvs: number[] = []
    diagData.forEach((diag) => {
      const modulosDiag = modulosData.filter((m) => m.projeto_id === diag.id)
      if (modulosDiag.length > 0) {
        const totalPeso = modulosDiag.reduce((acc, m) => acc + (m.peso || 0), 0)
        const totalPontos = modulosDiag.reduce((acc, m) => acc + (m.pontuacao || 0), 0)
        const imv = totalPeso > 0 ? Math.round((totalPontos / totalPeso) * 100) : 0
        imvs.push(imv)
      }
    })

    const imvMedio = imvs.length > 0 ? Math.round(imvs.reduce((a, b) => a + b, 0) / imvs.length) : 0
    const imvMax = imvs.length > 0 ? Math.max(...imvs) : 0
    const imvMin = imvs.length > 0 ? Math.min(...imvs) : 0

    setStats({ total, emAndamento, concluidos, imvMedio, imvMax, imvMin })

    // Radar
    const areas = ['ESTRATEGIA', 'RH', 'DP', 'JURIDICO', 'SST', 'NUTRICAO', 'FINANCEIRO', 'COMERCIAL', 'QUALIDADE', 'MELHORIA_CONTINUA', 'OPERACOES', 'COMPRAS', 'TI', 'AGRO']
    const radarMap: Record<string, number> = {}
    areas.forEach((area) => {
      const modulosArea = modulosData.filter((m) => m.area === area)
      if (modulosArea.length > 0) {
        const totalPeso = modulosArea.reduce((acc, m) => acc + (m.peso || 0), 0)
        const totalPontos = modulosArea.reduce((acc, m) => acc + (m.pontuacao || 0), 0)
        radarMap[area] = totalPeso > 0 ? Math.round((totalPontos / totalPeso) * 100) : 0
      } else {
        radarMap[area] = 0
      }
    })
    setRadarData(areas.map((area) => ({ area: MODULOS_LABELS[area] || area, valor: radarMap[area] || 0, fullMark: 100 })))

    // Bar
    const barMap: Record<string, number> = {}
    diagData.forEach((diag) => {
      const nome = diag.empresas?.nome || 'Empresa'
      const modulosDiag = modulosData.filter((m) => m.projeto_id === diag.id)
      if (modulosDiag.length > 0) {
        const totalPeso = modulosDiag.reduce((acc, m) => acc + (m.peso || 0), 0)
        const totalPontos = modulosDiag.reduce((acc, m) => acc + (m.pontuacao || 0), 0)
        barMap[nome] = totalPeso > 0 ? Math.round((totalPontos / totalPeso) * 100) : 0
      }
    })
    setBarData(Object.entries(barMap).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([nome, valor]) => ({ nome: nome.length > 15 ? nome.slice(0, 15) + '...' : nome, IMV: valor })))

    // Line
    const lineMap: Record<string, number> = {}
    diagData.forEach((diag) => {
      const data = new Date(diag.created_at).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
      const modulosDiag = modulosData.filter((m) => m.projeto_id === diag.id)
      if (modulosDiag.length > 0) {
        const totalPeso = modulosDiag.reduce((acc, m) => acc + (m.peso || 0), 0)
        const totalPontos = modulosDiag.reduce((acc, m) => acc + (m.pontuacao || 0), 0)
        const imv = totalPeso > 0 ? Math.round((totalPontos / totalPeso) * 100) : 0
        if (!lineMap[data] || lineMap[data] < imv) lineMap[data] = imv
      }
    })
    const sortedKeys = Object.keys(lineMap).sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
    setLineData(sortedKeys.slice(-6).map((key) => ({ mes: key, IMV: lineMap[key] })))

    // Pie
    const pieMap: Record<string, number> = {}
    diagData.forEach((diag) => {
      const status = diag.status
      if (!pieMap[status]) pieMap[status] = 0
      pieMap[status]++
    })
    const getStatusLabel = (status: string) => {
      const labels: Record<string, string> = { CADASTRO: 'Cadastro', PLANEJAMENTO: 'Planejamento', COLETA: 'Coleta', ANALISE: 'Análise', REVISAO: 'Revisão', PREDICAO: 'Predição', ENTREGA: 'Entrega', MONITORAMENTO: 'Monitoramento' }
      return labels[status] || status
    }
    setPieData(Object.entries(pieMap).map(([status, count]) => ({ status: getStatusLabel(status), count, color: CORES_STATUS[status as keyof typeof CORES_STATUS] || '#94a3b8' })))

    // Heatmap
    const heatmapMap: Record<string, { area: string; risco: number }> = {}
    areas.forEach((area) => {
      const modulosArea = modulosData.filter((m) => m.area === area)
      if (modulosArea.length > 0) {
        const totalPeso = modulosArea.reduce((acc, m) => acc + (m.peso || 0), 0)
        const totalPontos = modulosArea.reduce((acc, m) => acc + (m.pontuacao || 0), 0)
        const imv = totalPeso > 0 ? Math.round((totalPontos / totalPeso) * 100) : 0
        heatmapMap[area] = { area: MODULOS_LABELS[area] || area, risco: Math.max(0, 100 - imv) }
      } else {
        heatmapMap[area] = { area: MODULOS_LABELS[area] || area, risco: 0 }
      }
    })
    setHeatmapData(Object.values(heatmapMap))
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

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      CADASTRO: 'bg-gray-400',
      PLANEJAMENTO: 'bg-blue-400',
      COLETA: 'bg-yellow-400',
      ANALISE: 'bg-purple-400',
      REVISAO: 'bg-orange-400',
      PREDICAO: 'bg-indigo-400',
      ENTREGA: 'bg-green-400',
      MONITORAMENTO: 'bg-teal-400',
    }
    return colors[status] || 'bg-gray-400'
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      CADASTRO: 'Cadastro',
      PLANEJAMENTO: 'Planejamento',
      COLETA: 'Coleta de dados',
      ANALISE: 'Análise',
      REVISAO: 'Revisão',
      PREDICAO: 'Predição',
      ENTREGA: 'Entrega',
      MONITORAMENTO: 'Monitoramento',
    }
    return labels[status] || status
  }

  const getPerfilLabel = (perfil: string) => {
    const labels: Record<string, string> = {
      ADMIN: 'Administrador',
      CONSULTOR: 'Consultor',
      AUDITOR: 'Auditor',
      ESPECIALISTA: 'Especialista',
      CLIENTE: 'Cliente',
    }
    return labels[perfil] || perfil
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#0F5FA8]" />
      </div>
    )
  }

  // Cards com links (INTERATIVOS)
  const cards = [
    { 
      title: 'Total Diagnósticos', 
      value: stats.total, 
      icon: Activity, 
      color: 'text-[#0A3D78]', 
      bg: 'bg-[#EAF3FC]', 
      href: isCliente ? '#' : '/diagnosticos',
      visible: !isCliente
    },
    { 
      title: 'Em Andamento', 
      value: stats.emAndamento, 
      icon: Clock, 
      color: 'text-yellow-500', 
      bg: 'bg-yellow-50', 
      href: isCliente ? '#' : '/diagnosticos',
      visible: !isCliente
    },
    { 
      title: 'Concluídos', 
      value: stats.concluidos, 
      icon: CheckCircle, 
      color: 'text-green-500', 
      bg: 'bg-green-50', 
      href: isCliente ? '#' : '/diagnosticos',
      visible: !isCliente
    },
    { 
      title: 'IMV™ Médio', 
      value: stats.imvMedio, 
      icon: TrendingUp, 
      color: 'text-[#0F5FA8]', 
      bg: 'bg-[#EAF3FC]', 
      href: isCliente ? '#' : '/analises',
      visible: !isCliente
    },
    { 
      title: 'Melhor IMV™', 
      value: stats.imvMax, 
      icon: Award, 
      color: 'text-green-600', 
      bg: 'bg-green-50', 
      href: isCliente ? '#' : '/analises',
      visible: !isCliente
    },
  ]

  const cardsVisiveis = cards.filter(c => c.visible)

  return (
    <div className="space-y-6">
      {/* Cabeçalho com Perfil */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0A3D78]">Dashboard</h1>
          <p className="text-[#5E6C84] text-sm flex items-center gap-2">
            Visão completa dos diagnósticos e métricas de maturidade
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
              isAdmin ? 'bg-red-100 text-red-700' :
              isConsultor ? 'bg-green-100 text-green-700' :
              isAuditor ? 'bg-yellow-100 text-yellow-700' :
              isEspecialista ? 'bg-purple-100 text-purple-700' :
              'bg-gray-100 text-gray-700'
            }`}>
              {getPerfilLabel(perfil)}
            </span>
          </p>
        </div>
        {!isCliente && (
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
        )}
      </div>

      {/* Cards com links (apenas para perfis que podem ver) */}
      {cardsVisiveis.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {cardsVisiveis.map((card) => (
            card.href && card.href !== '#' ? (
              <Link key={card.title} href={card.href}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer hover:border-[#0F5FA8]">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-[#5E6C84] font-medium">{card.title}</p>
                        <p className="text-2xl font-bold text-[#1C1F26]">{card.value}</p>
                      </div>
                      <div className={`p-2 rounded-lg ${card.bg}`}>
                        <card.icon className={`w-5 h-5 ${card.color}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ) : (
              <Card key={card.title}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-[#5E6C84] font-medium">{card.title}</p>
                      <p className="text-2xl font-bold text-[#1C1F26]">{card.value}</p>
                    </div>
                    <div className={`p-2 rounded-lg ${card.bg}`}>
                      <card.icon className={`w-5 h-5 ${card.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          ))}
        </div>
      )}

      {/* Cliente: Visão restrita */}
      {isCliente && (
        <Card>
          <CardHeader>
            <CardTitle className="text-[#0A3D78] flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Seu Diagnóstico
            </CardTitle>
            <CardDescription>
              Você tem acesso apenas ao seu próprio diagnóstico
            </CardDescription>
          </CardHeader>
          <CardContent>
            {diagnosticosRecentes.length === 0 ? (
              <p className="text-[#5E6C84] text-center py-6">
                Nenhum diagnóstico iniciado para sua empresa.
              </p>
            ) : (
              diagnosticosRecentes.map((diag) => (
                <Link key={diag.id} href={`/diagnosticos/${diag.id}`}>
                  <div className="flex items-center justify-between p-3 border border-[#D7DEE8] rounded-lg hover:border-[#0F5FA8] hover:bg-[#F7F8FA] transition-all cursor-pointer">
                    <div>
                      <p className="font-medium text-[#1C1F26] text-sm">{diag.titulo || 'Diagnóstico sem título'}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-[#5E6C84]">
                        <span className={`px-2 py-0.5 rounded-full text-white ${getStatusColor(diag.status)}`}>
                          {getStatusLabel(diag.status)}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#D7DEE8]" />
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      )}

      {/* Gráficos (apenas para perfis que não são CLIENTE) */}
      {!isCliente && (
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
            <Link href={isAdmin ? '/analises' : '#'}>
              <Card className={`${isAdmin ? 'hover:shadow-lg transition-shadow cursor-pointer hover:border-[#0F5FA8]' : ''}`}>
                <CardHeader>
                  <CardTitle className="text-[#0A3D78]">Radar de Maturidade</CardTitle>
                  <CardDescription>Distribuição da maturidade por área de diagnóstico</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                        <PolarGrid stroke="#D7DEE8" />
                        <PolarAngleAxis dataKey="area" tick={{ fill: '#1C1F26', fontSize: 11 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#5E6C84', fontSize: 10 }} />
                        <Radar name="Maturidade" dataKey="valor" stroke="#0F5FA8" fill="#0F5FA8" fillOpacity={0.6} />
                        <Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #D7DEE8' }} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                  {isAdmin && (
                    <p className="text-center text-sm text-[#0F5FA8] font-medium mt-2">
                      Clique para ver detalhes completos →
                    </p>
                  )}
                </CardContent>
              </Card>
            </Link>
          </TabsContent>

          {/* BARRAS */}
          <TabsContent value="barras">
            <Link href={isAdmin || isConsultor ? '/diagnosticos' : '#'}>
              <Card className={`${isAdmin || isConsultor ? 'hover:shadow-lg transition-shadow cursor-pointer hover:border-[#0F5FA8]' : ''}`}>
                <CardHeader>
                  <CardTitle className="text-[#0A3D78]">IMV™ por Diagnóstico</CardTitle>
                  <CardDescription>Comparação da maturidade entre diagnósticos</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={barData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#D7DEE8" />
                        <XAxis dataKey="nome" tick={{ fill: '#5E6C84', fontSize: 11 }} />
                        <YAxis domain={[0, 100]} tick={{ fill: '#5E6C84', fontSize: 11 }} />
                        <Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #D7DEE8' }} />
                        <Bar dataKey="IMV" fill="#0F5FA8" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  {(isAdmin || isConsultor) && (
                    <p className="text-center text-sm text-[#0F5FA8] font-medium mt-2">
                      Clique para ver todos os diagnósticos →
                    </p>
                  )}
                </CardContent>
              </Card>
            </Link>
          </TabsContent>

          {/* EVOLUÇÃO */}
          <TabsContent value="evolucao">
            <Link href={isAdmin ? '/analises' : '#'}>
              <Card className={`${isAdmin ? 'hover:shadow-lg transition-shadow cursor-pointer hover:border-[#0F5FA8]' : ''}`}>
                <CardHeader>
                  <CardTitle className="text-[#0A3D78]">Evolução do IMV™</CardTitle>
                  <CardDescription>Projeção da maturidade ao longo do tempo</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={lineData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#D7DEE8" />
                        <XAxis dataKey="mes" tick={{ fill: '#5E6C84', fontSize: 11 }} />
                        <YAxis domain={[0, 100]} tick={{ fill: '#5E6C84', fontSize: 11 }} />
                        <Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #D7DEE8' }} />
                        <Legend />
                        <Line type="monotone" dataKey="IMV" stroke="#0F5FA8" strokeWidth={2} dot={{ fill: '#0F5FA8', r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  {isAdmin && (
                    <p className="text-center text-sm text-[#0F5FA8] font-medium mt-2">
                      Clique para ver análises completas →
                    </p>
                  )}
                </CardContent>
              </Card>
            </Link>
          </TabsContent>

          {/* PIE */}
          <TabsContent value="distribuicao">
            <Link href={isAdmin || isConsultor ? '/diagnosticos' : '#'}>
              <Card className={`${isAdmin || isConsultor ? 'hover:shadow-lg transition-shadow cursor-pointer hover:border-[#0F5FA8]' : ''}`}>
                <CardHeader>
                  <CardTitle className="text-[#0A3D78]">Distribuição de Status</CardTitle>
                  <CardDescription>Status atual dos diagnósticos</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={130} paddingAngle={2} dataKey="count">
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #D7DEE8' }} />
                        <Legend formatter={(value) => <span style={{ color: '#1C1F26', fontSize: 12 }}>{value}</span>} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  {(isAdmin || isConsultor) && (
                    <p className="text-center text-sm text-[#0F5FA8] font-medium mt-2">
                      Clique para ver todos os diagnósticos →
                    </p>
                  )}
                </CardContent>
              </Card>
            </Link>
          </TabsContent>

          {/* HEATMAP */}
          <TabsContent value="riscos">
            <Link href={isAdmin ? '/analises' : '#'}>
              <Card className={`${isAdmin ? 'hover:shadow-lg transition-shadow cursor-pointer hover:border-[#0F5FA8]' : ''}`}>
                <CardHeader>
                  <CardTitle className="text-[#0A3D78]">Heatmap de Riscos</CardTitle>
                  <CardDescription>Identificação de riscos por área</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {heatmapData.map((item) => (
                      <div key={item.area} className="text-center">
                        <div className={`w-full h-16 rounded-lg ${getRiskColor(item.risco)} flex items-center justify-center text-white font-bold text-lg`}>
                          {getRiskText(item.risco)}
                        </div>
                        <p className="text-xs mt-1 text-[#5E6C84]">{item.area}</p>
                        <p className="text-xs font-medium text-[#1C1F26]">Risco: {item.risco}%</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-center gap-4 mt-6 text-xs">
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-500"></span> Baixo</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-500"></span> Médio</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-500"></span> Alto</span>
                  </div>
                  {isAdmin && (
                    <p className="text-center text-sm text-[#0F5FA8] font-medium mt-4">
                      Clique para ver análises completas →
                    </p>
                  )}
                </CardContent>
              </Card>
            </Link>
          </TabsContent>
        </Tabs>
      )}

      {/* Diagnósticos Recentes - Filtrado por perfil */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-[#0A3D78]">📋 Diagnósticos Recentes</CardTitle>
          {!isCliente && (
            <Link href="/diagnosticos" className="text-sm text-[#0F5FA8] hover:underline font-medium flex items-center gap-1">
              Ver todos <ChevronRight className="w-4 h-4" />
            </Link>
          )}
        </CardHeader>
        <CardContent>
          {diagnosticosRecentes.length === 0 ? (
            <p className="text-[#5E6C84] text-center py-6">
              {isCliente 
                ? 'Nenhum diagnóstico iniciado para sua empresa.' 
                : isAuditor || isEspecialista
                ? 'Você não está vinculado a nenhum diagnóstico.'
                : 'Nenhum diagnóstico realizado ainda.'}
            </p>
          ) : (
            <div className="space-y-3">
              {diagnosticosRecentes.map((diag) => (
                <Link key={diag.id} href={`/diagnosticos/${diag.id}`}>
                  <div className="flex items-center justify-between p-3 border border-[#D7DEE8] rounded-lg hover:border-[#0F5FA8] hover:bg-[#F7F8FA] transition-all cursor-pointer">
                    <div>
                      <p className="font-medium text-[#1C1F26] text-sm">{diag.titulo || 'Diagnóstico sem título'}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-[#5E6C84]">
                        <span>{diag.empresas?.nome || '—'}</span>
                        <span className={`px-2 py-0.5 rounded-full text-white ${getStatusColor(diag.status)}`}>
                          {getStatusLabel(diag.status)}
                        </span>
                        {isAdmin && diag.usuarios?.nome && (
                          <span>👤 {diag.usuarios.nome}</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-[#5E6C84]">
                        {diag.created_at ? new Date(diag.created_at).toLocaleDateString('pt-BR') : '—'}
                      </p>
                      <ChevronRight className="w-4 h-4 text-[#D7DEE8]" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
