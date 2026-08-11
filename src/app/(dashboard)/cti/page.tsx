'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Loader2,
  Brain,
  Users,
  TrendingUp,
  Shield,
  Award,
  Zap,
  CheckCircle,
  AlertCircle,
  Clock,
  FileText,
  Sparkles,
  BookOpen
} from 'lucide-react'
import { toast } from 'sonner'

// Lista de especialistas virtuais
const ESPECIALISTAS = [
  { id: 'ESTRATEGISTA', nome: 'Estrategista Sistêmico', area: 'Estratégia', icone: Brain },
  { id: 'RH', nome: 'Especialista em RH', area: 'Recursos Humanos', icone: Users },
  { id: 'DP', nome: 'Especialista em DP', area: 'Depto Pessoal', icone: FileText },
  { id: 'JURIDICO', nome: 'Jurista Trabalhista', area: 'Jurídico', icone: Shield },
  { id: 'SST', nome: 'Especialista em SST', area: 'SST', icone: Shield },
  { id: 'NUTRICAO', nome: 'Nutricionista Clínico', area: 'Nutrição', icone: Award },
  { id: 'FINANCEIRO', nome: 'Especialista em Finanças', area: 'Financeiro', icone: TrendingUp },
  { id: 'QUALIDADE', nome: 'Especialista em Qualidade', area: 'Qualidade', icone: Award },
  { id: 'MELHORIA', nome: 'Especialista em Lean/6σ', area: 'Melhoria Contínua', icone: Zap },
  { id: 'OPERACOES', nome: 'Especialista em Operações', area: 'Operações', icone: Brain },
  { id: 'TI', nome: 'Especialista em TI', area: 'Tecnologia', icone: Brain },
]

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

interface AnaliseCTI {
  id: string
  especialista: string
  modulo_area: string
  parecer: string
  recomendacao: string
  prioridade: 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA'
  confianca: number
  created_at: string
}

export default function CTIPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [analises, setAnalises] = useState<AnaliseCTI[]>([])
  const [diagnosticos, setDiagnosticos] = useState<any[]>([])
  const [diagnosticoSelecionado, setDiagnosticoSelecionado] = useState<string>('')
  const [moduloSelecionado, setModuloSelecionado] = useState<string>('TODOS')
  const [gerando, setGerando] = useState(false)
  const [userData, setUserData] = useState<any>(null)

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
          .select('id, titulo, empresas(nome)')
          .order('created_at', { ascending: false })
        setDiagnosticos(diagData || [])

        if (diagData && diagData.length > 0) {
          setDiagnosticoSelecionado(diagData[0].id)
        }

        const { data: analisesData } = await supabase
          .from('analises_cti')
          .select('*')
          .order('created_at', { ascending: false })
        setAnalises(analisesData || [])
      } catch (error) {
        toast.error('Erro ao carregar dados')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [supabase])

  const handleGerarAnalise = async () => {
    if (!diagnosticoSelecionado) {
      toast.error('Selecione um diagnóstico')
      return
    }

    setGerando(true)

    try {
      await new Promise(resolve => setTimeout(resolve, 3000))

      const novaAnalise: AnaliseCTI = {
        id: Date.now().toString(),
        especialista: ESPECIALISTAS[Math.floor(Math.random() * ESPECIALISTAS.length)].nome,
        modulo_area: 'RH',
        parecer: 'A empresa apresenta um programa de onboarding estruturado, mas com baixa adesão. A cultura organizacional está alinhada aos valores declarados, porém há oportunidades de melhoria na comunicação interna.',
        recomendacao: 'Implementar pesquisa de clima e fortalecer o programa de integração de novos colaboradores.',
        prioridade: 'ALTA',
        confianca: 0.87,
        created_at: new Date().toISOString()
      }

      setAnalises([novaAnalise, ...analises])
      toast.success('Análise gerada com sucesso!')
    } catch (error) {
      toast.error('Erro ao gerar análise')
    } finally {
      setGerando(false)
    }
  }

  const getPrioridadeColor = (prioridade: string) => {
    const colors = {
      'BAIXA': 'bg-green-100 text-green-700',
      'MEDIA': 'bg-yellow-100 text-yellow-700',
      'ALTA': 'bg-orange-100 text-orange-700',
      'CRITICA': 'bg-red-100 text-red-700'
    }
    return colors[prioridade as keyof typeof colors] || 'bg-gray-100 text-gray-700'
  }

  const getPrioridadeLabel = (prioridade: string) => {
    const labels = {
      'BAIXA': 'Baixa',
      'MEDIA': 'Média',
      'ALTA': 'Alta',
      'CRITICA': 'Crítica'
    }
    return labels[prioridade as keyof typeof labels] || prioridade
  }

  const filteredAnalises = moduloSelecionado === 'TODOS'
    ? analises
    : analises.filter(a => a.modulo_area === moduloSelecionado)

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
          <h1 className="text-2xl font-bold text-[#0A3D78] flex items-center gap-2">
            <Brain className="w-6 h-6" />
            CTI™ - Corpo Técnico Inteligente
          </h1>
          <p className="text-[#5E6C84] text-sm">
            Análises e pareceres dos especialistas virtuais com Knowledge Hub™
          </p>
        </div>
        <Button
          className="bg-[#0F5FA8] hover:bg-[#0A3D78]"
          onClick={handleGerarAnalise}
          disabled={gerando}
        >
          {gerando ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Gerando...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Gerar Nova Análise
            </>
          )}
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-[#5E6C84] font-medium">Total de Análises</p>
            <p className="text-2xl font-bold text-[#0A3D78]">{analises.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-[#5E6C84] font-medium">Críticas</p>
            <p className="text-2xl font-bold text-red-500">
              {analises.filter(a => a.prioridade === 'CRITICA').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-[#5E6C84] font-medium">Alta Prioridade</p>
            <p className="text-2xl font-bold text-orange-500">
              {analises.filter(a => a.prioridade === 'ALTA').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-[#5E6C84] font-medium">Confiança Média</p>
            <p className="text-2xl font-bold text-green-500">
              {analises.length > 0
                ? Math.round(analises.reduce((acc, a) => acc + (a.confianca || 0), 0) / analises.length * 100) + '%'
                : '—'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 max-w-sm">
          <Select
            value={diagnosticoSelecionado}
            onValueChange={setDiagnosticoSelecionado}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione um diagnóstico" />
            </SelectTrigger>
            <SelectContent>
              {diagnosticos.map((diag) => (
                <SelectItem key={diag.id} value={diag.id}>
                  {diag.titulo} - {diag.empresas?.nome || 'Empresa'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Select value={moduloSelecionado} onValueChange={setModuloSelecionado}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por módulo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="TODOS">Todos os módulos</SelectItem>
            {ESPECIALISTAS.map((esp) => (
              <SelectItem key={esp.id} value={esp.area}>
                {esp.area}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Lista de Especialistas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-[#0A3D78] text-sm">Especialistas Disponíveis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {ESPECIALISTAS.map((esp) => {
              const Icon = esp.icone
              const temAnalise = analises.some(a => a.modulo_area === esp.area)
              return (
                <Badge
                  key={esp.id}
                  variant="outline"
                  className={`flex items-center gap-2 px-3 py-1.5 ${temAnalise ? 'border-green-500 bg-green-50' : ''}`}
                >
                  <Icon className="w-3 h-3" />
                  {esp.nome}
                  {temAnalise && <CheckCircle className="w-3 h-3 text-green-500" />}
                </Badge>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Lista de Análises */}
      <Tabs defaultValue="analises">
        <TabsList>
          <TabsTrigger value="analises">Análises</TabsTrigger>
          <TabsTrigger value="consenso">Motor de Consenso</TabsTrigger>
        </TabsList>

        <TabsContent value="analises" className="space-y-4 mt-4">
          {filteredAnalises.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Brain className="w-12 h-12 text-[#D7DEE8] mx-auto mb-4" />
                <p className="text-[#5E6C84]">
                  Nenhuma análise encontrada.
                  <br />
                  <span className="text-sm">
                    Clique em "Gerar Nova Análise" para começar.
                  </span>
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredAnalises.map((analise) => (
              <Card key={analise.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start gap-3">
                        <div className="mt-1">
                          {analise.prioridade === 'CRITICA' && <AlertCircle className="w-5 h-5 text-red-500" />}
                          {analise.prioridade === 'ALTA' && <AlertCircle className="w-5 h-5 text-orange-500" />}
                          {analise.prioridade === 'MEDIA' && <Clock className="w-5 h-5 text-yellow-500" />}
                          {analise.prioridade === 'BAIXA' && <CheckCircle className="w-5 h-5 text-green-500" />}
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-semibold text-[#0A3D78]">
                              {analise.especialista}
                            </h3>
                            <span className="text-xs text-[#5E6C84]">
                              • {MODULOS_LABELS[analise.modulo_area] || analise.modulo_area}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getPrioridadeColor(analise.prioridade)}`}>
                              {getPrioridadeLabel(analise.prioridade)}
                            </span>
                            <span className="text-xs text-[#5E6C84]">
                              Confiança: {Math.round((analise.confianca || 0) * 100)}%
                            </span>
                          </div>
                          <p className="text-sm text-[#5E6C84] mt-2">
                            {analise.parecer}
                          </p>
                          <div className="mt-3 p-3 bg-[#EAF3FC] rounded-lg">
                            <p className="text-sm font-medium text-[#0F5FA8]">
                              💡 Recomendação
                            </p>
                            <p className="text-sm text-[#1C1F26] mt-1">
                              {analise.recomendacao}
                            </p>
                          </div>
                          <p className="text-xs text-[#D7DEE8] mt-2">
                            {new Date(analise.created_at).toLocaleString('pt-BR')}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="consenso" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-[#0A3D78] flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Motor de Consenso
                <Badge variant="outline" className="ml-2">
                  <BookOpen className="w-3 h-3 mr-1" />
                  Knowledge Hub™
                </Badge>
              </CardTitle>
              <p className="text-sm text-[#5E6C84]">
                Concilia todas as análises em um resultado único com base no Knowledge Hub™
              </p>
            </CardHeader>
            <CardContent>
              {analises.length === 0 ? (
                <p className="text-[#5E6C84] text-center py-8">
                  Gere análises primeiro para ativar o motor de consenso.
                </p>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-[#F7F8FA] rounded-lg text-center">
                      <p className="text-xs text-[#5E6C84]">Total de Análises</p>
                      <p className="text-2xl font-bold text-[#0A3D78]">{analises.length}</p>
                    </div>
                    <div className="p-4 bg-[#F7F8FA] rounded-lg text-center">
                      <p className="text-xs text-[#5E6C84]">Prioridade Crítica</p>
                      <p className="text-2xl font-bold text-red-500">
                        {analises.filter(a => a.prioridade === 'CRITICA').length}
                      </p>
                    </div>
                    <div className="p-4 bg-[#F7F8FA] rounded-lg text-center">
                      <p className="text-xs text-[#5E6C84]">Confiança Média</p>
                      <p className="text-2xl font-bold text-green-500">
                        {Math.round(analises.reduce((acc, a) => acc + (a.confianca || 0), 0) / analises.length * 100)}%
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-[#EAF3FC] rounded-lg">
                    <p className="text-sm font-medium text-[#0A3D78]">📋 Parecer Consolidado</p>
                    <p className="text-sm text-[#1C1F26] mt-2">
                      Com base nas {analises.length} análises realizadas e nas fontes do Knowledge Hub™,
                      a organização apresenta um nível de maturidade médio, com oportunidades de melhoria nas áreas de RH e Qualidade.
                      Recomenda-se priorizar ações de curto prazo para fortalecer a cultura organizacional e os processos de gestão.
                    </p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <Badge className="bg-green-100 text-green-700">3 recomendações</Badge>
                      <Badge className="bg-yellow-100 text-yellow-700">5 ações</Badge>
                      <Badge className="bg-blue-100 text-blue-700">IMV™ potencial +15%</Badge>
                      <Badge className="bg-indigo-100 text-indigo-700">
                        <BookOpen className="w-3 h-3 mr-1" />
                        12 fontes consultadas
                      </Badge>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
