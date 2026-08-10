'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Loader2, TrendingUp, TrendingDown, Zap, Target, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

type Cenario = 'OTIMISTA' | 'REALISTA' | 'PESSIMISTA'

interface Projecao {
  mes: string
  imv: number
  cenario: Cenario
}

// Mapeamento de módulos
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

export default function PredicaoPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  const diagnosticoId = params.id as string

  const [loading, setLoading] = useState(true)
  const [diagnostico, setDiagnostico] = useState<any>(null)
  const [modulos, setModulos] = useState<any[]>([])
  const [cenario, setCenario] = useState<Cenario>('REALISTA')
  const [projecoes, setProjecoes] = useState<Projecao[]>([])
  const [imvAtual, setImvAtual] = useState(0)
  const [imvFinal, setImvFinal] = useState(0)
  const [impactoAcoes, setImpactoAcoes] = useState(0)
  const [acoesRecomendadas, setAcoesRecomendadas] = useState<string[]>([])

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)

      try {
        // Buscar diagnóstico
        const { data: diagData } = await supabase
          .from('projetos_diagnostico')
          .select('*, empresas(nome)')
          .eq('id', diagnosticoId)
          .single()
        setDiagnostico(diagData)

        // Buscar módulos
        const { data: modulosData } = await supabase
          .from('modulos_diagnostico')
          .select('*')
          .eq('projeto_id', diagnosticoId)
        
        const modulosList = modulosData || []
        setModulos(modulosList)

        // Calcular IMV atual
        let imv = 0
        if (modulosList.length > 0) {
          const total = modulosList.reduce((acc, m) => acc + (m.pontuacao || 0), 0)
          imv = Math.round(total / modulosList.length)
        }
        setImvAtual(imv)

        // Gerar projeções
        gerarProjecoes(imv, 'REALISTA', 0)

        // Buscar ações para impacto
        const { data: acoesData } = await supabase
          .from('acoes_plano')
          .select('*')
          .eq('projeto_id', diagnosticoId)
          .eq('status', 'PENDENTE')

        const impacto = acoesData?.reduce((acc, a) => acc + (a.impacto_imv || 0), 0) || 0
        setImpactoAcoes(impacto)

        // Recomendações
        gerarRecomendacoes(imv, 'REALISTA')

      } catch (error) {
        toast.error('Erro ao carregar dados')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [supabase, diagnosticoId])

  const gerarProjecoes = (imvBase: number, cenarioSelecionado: Cenario, impacto: number) => {
    const meses = ['12', '24', '36']
    const fatores: Record<Cenario, number> = {
      'OTIMISTA': 1.4,
      'REALISTA': 1.2,
      'PESSIMISTA': 0.9
    }

    const fator = fatores[cenarioSelecionado]
    const imvComAcoes = Math.min(imvBase + impacto, 1000)

    const novasProjecoes = meses.map((mes, index) => {
      const progresso = (index + 1) / meses.length
      const imv = Math.min(
        Math.round(imvBase + (imvComAcoes - imvBase) * progresso * fator),
        1000
      )
      return {
        mes: `${mes} meses`,
        imv,
        cenario: cenarioSelecionado
      }
    })

    setProjecoes(novasProjecoes)
    setImvFinal(novasProjecoes[novasProjecoes.length - 1]?.imv || imvBase)
  }

  const gerarRecomendacoes = (imvBase: number, cenarioSelecionado: Cenario) => {
    const recomendacoes: Record<Cenario, string[]> = {
      'OTIMISTA': [
        '✅ Continue implementando as ações corretivas',
        '🚀 Invista em inovação e tecnologia',
        '📈 Monitore os indicadores mensalmente'
      ],
      'REALISTA': [
        '📋 Priorize ações de alto impacto no IMV™',
        '🔄 Estabeleça metas trimestrais de evolução',
        '📊 Acompanhe a execução do plano de ação'
      ],
      'PESSIMISTA': [
        '⚠️ Reveja o plano de ação e reforce as prioridades',
        '🔍 Identifique gargalos que estão travando a evolução',
        '👥 Consulte a equipe para ajustar estratégias'
      ]
    }

    const recomendacoesEspecificas = []
    if (imvBase < 400) {
      recomendacoesEspecificas.push('🔴 Priorize ações de curto prazo para sair do nível básico')
    } else if (imvBase < 600) {
      recomendacoesEspecificas.push('🟡 Foque em padronizar processos para atingir o nível estruturado')
    } else if (imvBase < 800) {
      recomendacoesEspecificas.push('🟢 Mantenha o ritmo e invista em melhoria contínua')
    } else {
      recomendacoesEspecificas.push('🏆 Busque a excelência com inovação e diferenciação')
    }

    setAcoesRecomendadas([...recomendacoes[cenarioSelecionado], ...recomendacoesEspecificas])
  }

  const handleCenarioChange = (novoCenario: Cenario) => {
    setCenario(novoCenario)
    gerarProjecoes(imvAtual, novoCenario, impactoAcoes)
    gerarRecomendacoes(imvAtual, novoCenario)
  }

  const getNivelMaturidade = (imv: number) => {
    if (imv <= 200) return { label: 'Inicial', cor: 'text-red-500' }
    if (imv <= 400) return { label: 'Básico', cor: 'text-orange-500' }
    if (imv <= 600) return { label: 'Estruturado', cor: 'text-yellow-500' }
    if (imv <= 800) return { label: 'Gerenciado', cor: 'text-blue-500' }
    if (imv <= 900) return { label: 'Estratégico', cor: 'text-purple-500' }
    return { label: 'Excelência', cor: 'text-green-500' }
  }

  const getNivelCor = (imv: number) => {
    if (imv <= 200) return 'bg-red-500'
    if (imv <= 400) return 'bg-orange-500'
    if (imv <= 600) return 'bg-yellow-500'
    if (imv <= 800) return 'bg-blue-500'
    if (imv <= 900) return 'bg-purple-500'
    return 'bg-green-500'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#0F5FA8]" />
      </div>
    )
  }

  const nivelAtual = getNivelMaturidade(imvAtual)
  const nivelFinal = getNivelMaturidade(imvFinal)

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
          <h1 className="text-2xl font-bold text-[#0A3D78]">Predição - IMV™</h1>
          <p className="text-[#5E6C84] text-sm">
            {diagnostico?.titulo} - {diagnostico?.empresas?.nome || 'Empresa'}
          </p>
        </div>
      </div>

      {/* IMV Atual */}
      <Card className="bg-gradient-to-r from-[#0F5FA8] to-[#0A3D78] text-white">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <p className="text-sm opacity-80">IMV™ Atual</p>
              <p className="text-4xl font-bold">{imvAtual}</p>
              <p className={`text-sm font-medium ${nivelAtual.cor}`}>
                {nivelAtual.label}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm opacity-80">Impacto das Ações</p>
              <p className="text-2xl font-bold text-green-400">+{impactoAcoes}</p>
              <p className="text-xs opacity-70">pontos potenciais</p>
            </div>
            <div className="text-center">
              <p className="text-sm opacity-80">Módulos Avaliados</p>
              <p className="text-2xl font-bold">{modulos.length}</p>
              <p className="text-xs opacity-70">de 14 possíveis</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Seletor de Cenário */}
      <div className="flex flex-wrap items-center gap-4">
        <span className="text-sm font-medium text-[#1C1F26]">Cenário:</span>
        <Select value={cenario} onValueChange={(v) => handleCenarioChange(v as Cenario)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="OTIMISTA">🚀 Otimista</SelectItem>
            <SelectItem value="REALISTA">📊 Realista</SelectItem>
            <SelectItem value="PESSIMISTA">⚠️ Pessimista</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2 ml-4 text-sm">
          <span className="text-[#5E6C84]">Projeção:</span>
          <span className="font-medium text-[#0F5FA8]">
            {imvAtual} → {imvFinal}
          </span>
          <span className={`text-sm font-medium ${imvFinal > imvAtual ? 'text-green-500' : 'text-red-500'}`}>
            {imvFinal > imvAtual ? `+${imvFinal - imvAtual}` : `${imvFinal - imvAtual}`}
          </span>
        </div>
      </div>

      {/* Gráfico de Projeção */}
      <Card>
        <CardHeader>
          <CardTitle className="text-[#0A3D78] flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Projeção de Evolução do IMV™
          </CardTitle>
          <p className="text-sm text-[#5E6C84]">
            Cenário {cenario === 'OTIMISTA' ? '🚀 Otimista' : cenario === 'REALISTA' ? '📊 Realista' : '⚠️ Pessimista'}
          </p>
        </CardHeader>
        <CardContent>
          <div className="relative h-[300px]">
            <div className="absolute left-0 top-0 bottom-0 w-12 flex flex-col justify-between text-xs text-[#5E6C84]">
              <span>1000</span>
              <span>750</span>
              <span>500</span>
              <span>250</span>
              <span>0</span>
            </div>

            <div className="absolute left-12 right-0 top-0 bottom-0">
              <div className="relative w-full h-full">
                <div className="absolute inset-0 flex flex-col justify-between">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <div key={i} className="border-t border-[#D7DEE8] w-full" />
                  ))}
                </div>

                <div className="absolute inset-0 flex items-end justify-around px-4 pb-4">
                  {projecoes.map((projecao, index) => {
                    const altura = (projecao.imv / 1000) * 100
                    const isFinal = index === projecoes.length - 1
                    const cores = {
                      'OTIMISTA': 'bg-green-500',
                      'REALISTA': 'bg-[#0F5FA8]',
                      'PESSIMISTA': 'bg-red-500'
                    }

                    return (
                      <div key={index} className="flex flex-col items-center gap-2 flex-1">
                        <div
                          className={`w-16 rounded-t-lg transition-all duration-500 ${cores[cenario]}`}
                          style={{ height: `${Math.max(altura, 5)}%` }}
                        >
                          <div className="text-center text-white text-sm font-bold pt-1">
                            {projecao.imv}
                          </div>
                        </div>
                        <span className="text-xs text-[#5E6C84]">{projecao.mes}</span>
                        {isFinal && (
                          <span className="text-[10px] text-[#0F5FA8] font-medium">
                            {getNivelMaturidade(projecao.imv).label}
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>

                <div
                  className="absolute left-0 right-0 border-t-2 border-dashed border-[#0F5FA8]"
                  style={{ bottom: `${(imvAtual / 1000) * 100}%` }}
                >
                  <span className="absolute -top-3 -right-2 text-xs text-[#0F5FA8] font-medium">
                    Atual: {imvAtual}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-center gap-6 mt-4 text-xs text-[#5E6C84]">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-[#0F5FA8] rounded" />
              Projeção
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 border-2 border-dashed border-[#0F5FA8]" />
              IMV Atual
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Cards de Níveis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-[#0A3D78] text-sm">Nível Atual</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white ${getNivelCor(imvAtual)}`}>
                {imvAtual}
              </div>
              <div>
                <p className="text-lg font-bold text-[#1C1F26]">{nivelAtual.label}</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-32 h-2 bg-[#F7F8FA] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${getNivelCor(imvAtual)}`}
                      style={{ width: `${(imvAtual / 1000) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-[#5E6C84]">{Math.round((imvAtual / 1000) * 100)}%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-[#0A3D78] text-sm">Nível Projetado ({cenario})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white ${getNivelCor(imvFinal)}`}>
                {imvFinal}
              </div>
              <div>
                <p className="text-lg font-bold text-[#1C1F26]">{nivelFinal.label}</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-32 h-2 bg-[#F7F8FA] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${getNivelCor(imvFinal)}`}
                      style={{ width: `${(imvFinal / 1000) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-[#5E6C84]">{Math.round((imvFinal / 1000) * 100)}%</span>
                </div>
                <p className="text-xs text-[#5E6C84] mt-1">
                  {imvFinal > imvAtual
                    ? `📈 Evolução de ${imvFinal - imvAtual} pontos`
                    : imvFinal === imvAtual
                    ? '⏸️ Manutenção do nível atual'
                    : `📉 Queda de ${imvAtual - imvFinal} pontos`
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recomendações */}
      <Card>
        <CardHeader>
          <CardTitle className="text-[#0A3D78] flex items-center gap-2">
            <Target className="w-5 h-5" />
            Recomendações para o Cenário {cenario === 'OTIMISTA' ? 'Otimista' : cenario === 'REALISTA' ? 'Realista' : 'Pessimista'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {acoesRecomendadas.map((recomendacao, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 bg-[#F7F8FA] rounded-lg hover:bg-[#EAF3FC] transition-colors"
              >
                <span className="text-sm font-medium text-[#0F5FA8]">#{index + 1}</span>
                <p className="text-sm text-[#1C1F26]">{recomendacao}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 p-4 bg-[#EAF3FC] rounded-lg">
            <p className="text-sm text-[#0F5FA8] font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Resumo Executivo
            </p>
            <p className="text-sm text-[#5E6C84] mt-1">
              {imvFinal >= 800
                ? '🏆 A organização tem potencial para atingir o nível de Excelência. Continue investindo em inovação e melhoria contínua.'
                : imvFinal >= 600
                ? '📈 A organização está no caminho certo para atingir o nível Gerenciado. Foque em padronizar processos e monitorar indicadores.'
                : imvFinal >= 400
                ? '🔄 A organização precisa estruturar processos básicos para evoluir. Priorize ações de curto prazo.'
                : '⚠️ A organização está em nível inicial. Recomenda-se um plano de ação emergencial com foco em processos básicos.'
              }
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
