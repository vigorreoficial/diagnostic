'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  ArrowLeft,
  Loader2,
  FileText,
  Download,
  Eye,
  Trash2,
  Plus,
  AlertCircle,
  CheckCircle,
  Clock,
  BookOpen,
  Brain,
  Printer
} from 'lucide-react'
import { toast } from 'sonner'

type TipoRelatorio = 'EXECUTIVO' | 'COMPLETO' | 'PLANO_ACAO' | 'PREDICAO' | 'CTI_COMPLETO'

const TIPOS_RELATORIO = [
  { id: 'EXECUTIVO', label: 'Relatório Executivo', descricao: 'Resumo de 4-6 páginas com principais indicadores', icone: FileText },
  { id: 'COMPLETO', label: 'Relatório Completo', descricao: 'Relatório detalhado com todas as áreas', icone: FileText },
  { id: 'PLANO_ACAO', label: 'Plano de Ação', descricao: 'Tarefas priorizadas com prazos', icone: CheckCircle },
  { id: 'PREDICAO', label: 'Relatório de Predição', descricao: 'Projeção de evolução do IMV™', icone: Clock },
  { id: 'CTI_COMPLETO', label: 'CTI™ + Knowledge Hub™', descricao: 'Análise completa com fontes do Knowledge Hub™', icone: Brain },
]

export default function GerenciarRelatoriosPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  const diagnosticoId = params.id as string

  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [diagnostico, setDiagnostico] = useState<any>(null)
  const [relatorios, setRelatorios] = useState<any[]>([])
  const [userData, setUserData] = useState<any>(null)
  const [selectedTipo, setSelectedTipo] = useState<TipoRelatorio>('EXECUTIVO')
  const [modulos, setModulos] = useState<any[]>([])
  const [analisesCTI, setAnalisesCTI] = useState<any[]>([])
  const [knowledgeUsed, setKnowledgeUsed] = useState<any[]>([])
  const [visualizando, setVisualizando] = useState<any>(null)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)

      try {
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
        setModulos(modulosData || [])

        // Buscar análises CTI
        const { data: analisesData } = await supabase
          .from('analises_cti')
          .select('*')
          .in('modulo_id', modulosData?.map(m => m.id) || [])
        setAnalisesCTI(analisesData || [])

        // Buscar conhecimento utilizado
        const { data: knowledgeData } = await supabase
          .from('knowledge_base_audit')
          .select('knowledge_id, modulo_area, knowledge_base(*)')
          .limit(20)
        setKnowledgeUsed(knowledgeData || [])

        // Buscar relatórios
        const { data: relData } = await supabase
          .from('relatorios')
          .select('*')
          .eq('projeto_id', diagnosticoId)
          .order('created_at', { ascending: false })

        setRelatorios(relData || [])
      } catch (error) {
        toast.error('Erro ao carregar dados')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [supabase, diagnosticoId])

  const handleGenerate = async () => {
    setGenerating(true)

    try {
      // Simular geração de relatório
      await new Promise(resolve => setTimeout(resolve, 2000))

      const titulo = `${diagnostico?.titulo || 'Diagnóstico'} - ${TIPOS_RELATORIO.find(t => t.id === selectedTipo)?.label}`

      // Gerar conteúdo baseado no tipo
      let conteudo = ''
      let fontes = []

      switch (selectedTipo) {
        case 'CTI_COMPLETO':
          conteudo = gerarRelatorioCTICompleto(diagnostico, modulos, analisesCTI, knowledgeUsed)
          fontes = knowledgeUsed.map(k => k.knowledge_base).filter(Boolean)
          break
        case 'COMPLETO':
          conteudo = gerarRelatorioCompleto(diagnostico, modulos, analisesCTI)
          break
        case 'EXECUTIVO':
          conteudo = gerarRelatorioExecutivo(diagnostico, modulos, analisesCTI)
          break
        case 'PLANO_ACAO':
          conteudo = gerarPlanoAcao(diagnostico, modulos)
          break
        case 'PREDICAO':
          conteudo = gerarRelatorioPredicao(diagnostico, modulos)
          break
      }

      const { data, error } = await supabase
        .from('relatorios')
        .insert({
          projeto_id: diagnosticoId,
          tipo: selectedTipo,
          titulo: titulo,
          url: `/relatorios/${diagnosticoId}/${selectedTipo.toLowerCase()}.pdf`,
          data_geracao: new Date().toISOString(),
          conteudo: conteudo,
          fontes_utilizadas: fontes
        })
        .select()
        .single()

      if (error) {
        toast.error('Erro ao gerar relatório: ' + error.message)
        return
      }

      setRelatorios([data, ...relatorios])
      toast.success('Relatório gerado com sucesso!')
    } catch (error) {
      toast.error('Erro ao gerar relatório')
    } finally {
      setGenerating(false)
    }
  }

  // ============================================
  // FUNÇÕES DE GERAÇÃO DE RELATÓRIOS
  // ============================================

  const gerarRelatorioCTICompleto = (diagnostico: any, modulos: any[], analises: any[], knowledge: any[]) => {
    let texto = '╔═══════════════════════════════════════════════════════════════════════╗\n'
    texto += '║                                                                           ║\n'
    texto += '║    📋 RELATÓRIO CTI™ + KNOWLEDGE HUB™                                    ║\n'
    texto += '║    VIGORRE DIAGNOSTICS™ 3.0 "QUANTUM"                                   ║\n'
    texto += '║                                                                           ║\n'
    texto += '╚═══════════════════════════════════════════════════════════════════════╝\n\n'
    
    texto += `📌 Diagnóstico: ${diagnostico?.titulo || 'Sem título'}\n`
    texto += `🏢 Empresa: ${diagnostico?.empresas?.nome || 'Não informada'}\n`
    texto += `📅 Data: ${new Date().toLocaleDateString('pt-BR')}\n`
    texto += `⏰ Hora: ${new Date().toLocaleTimeString('pt-BR')}\n`
    texto += `🔖 Versão: 3.0 "QUANTUM"\n\n`
    texto += '─'.repeat(80) + '\n\n'

    // Resumo
    const totalModulos = modulos.length
    const concluidos = modulos.filter(m => m.status === 'CONCLUIDO' || m.status === 'VALIDADO').length
    const imv = totalModulos > 0 
      ? Math.round(modulos.reduce((acc, m) => acc + (m.pontuacao || 0), 0) / totalModulos)
      : 0
    
    texto += '📊 RESUMO EXECUTIVO\n'
    texto += '─'.repeat(40) + '\n\n'
    texto += `   IMV™ Total: ${imv}\n`
    texto += `   Módulos: ${concluidos}/${totalModulos} concluídos\n`
    texto += `   Nível: ${obterNivelMaturidade(imv)}\n\n`
    texto += '─'.repeat(80) + '\n\n'

    // Análises por módulo
    texto += '📌 ANÁLISE DETALHADA POR MÓDULO\n'
    texto += '─'.repeat(40) + '\n\n'

    for (const modulo of modulos) {
      const analise = analises.find(a => a.modulo_id === modulo.id)
      const areaLabel = MODULOS_LABELS[modulo.area] || modulo.area
      
      texto += `┌─ ${areaLabel}\n`
      texto += `│  Status: ${modulo.status}\n`
      texto += `│  Pontuação: ${modulo.pontuacao || 0}%\n`
      
      if (analise) {
        texto += `│\n`
        texto += `│  🔍 Análise do CTI™:\n`
        texto += `│  ${analise.parecer.replace(/\n/g, '\n│  ')}\n`
        texto += `│\n`
        texto += `│  💡 Recomendação:\n`
        texto += `│  ${analise.recomendacao.replace(/\n/g, '\n│  ')}\n`
        texto += `│\n`
        texto += `│  📊 Confiança: ${Math.round(analise.confianca * 100)}%\n`
        texto += `│  🔴 Prioridade: ${analise.prioridade}\n`
      }
      
      // Fontes do Knowledge Hub™ utilizadas
      const fontesModulo = knowledge.filter(k => k.modulo_area === modulo.area)
      if (fontesModulo.length > 0) {
        texto += `│\n`
        texto += `│  📚 Fontes consultadas no Knowledge Hub™:\n`
        for (const fonte of fontesModulo) {
          const kb = fonte.knowledge_base
          if (kb) {
            texto += `│     • ${kb.titulo} (v${kb.versao})\n`
            texto += `│       Fonte: ${kb.fonte}\n`
          }
        }
      }
      texto += `└─\n\n`
    }

    // Resumo do Knowledge Hub™
    const knowledgeUnicos = knowledge.filter((v, i, a) => 
      a.findIndex(t => t.knowledge_id === v.knowledge_id) === i
    )

    if (knowledgeUnicos.length > 0) {
      texto += '📚 KNOWLEDGE HUB™ UTILIZADO\n'
      texto += '─'.repeat(40) + '\n\n'
      for (const item of knowledgeUnicos) {
        const kb = item.knowledge_base
        if (kb) {
          texto += `   📖 ${kb.titulo}\n`
          texto += `      Categoria: ${kb.categoria}\n`
          texto += `      Fonte: ${kb.fonte}\n`
          texto += `      Versão: v${kb.versao}\n`
          if (kb.tags && kb.tags.length > 0) {
            texto += `      Tags: ${kb.tags.join(', ')}\n`
          }
          texto += '\n'
        }
      }
    }

    texto += '═'.repeat(80) + '\n'
    texto += `📅 Relatório gerado em ${new Date().toLocaleString('pt-BR')}\n`
    texto += `🔒 Confidencial - Uso Exclusivo Vigorre\n`
    texto += '═'.repeat(80) + '\n'

    return texto
  }

  const gerarRelatorioCompleto = (diagnostico: any, modulos: any[], analises: any[]) => {
    let texto = '╔═══════════════════════════════════════════════════════════════════════╗\n'
    texto += '║                                                                           ║\n'
    texto += '║    📋 RELATÓRIO COMPLETO                                                ║\n'
    texto += '║    VIGORRE DIAGNOSTICS™ 3.0 "QUANTUM"                                   ║\n'
    texto += '║                                                                           ║\n'
    texto += '╚═══════════════════════════════════════════════════════════════════════╝\n\n'
    
    texto += `📌 Diagnóstico: ${diagnostico?.titulo || 'Sem título'}\n`
    texto += `🏢 Empresa: ${diagnostico?.empresas?.nome || 'Não informada'}\n`
    texto += `📅 Data: ${new Date().toLocaleDateString('pt-BR')}\n\n`
    texto += '─'.repeat(80) + '\n\n'

    const totalModulos = modulos.length
    const concluidos = modulos.filter(m => m.status === 'CONCLUIDO' || m.status === 'VALIDADO').length
    const imv = totalModulos > 0 
      ? Math.round(modulos.reduce((acc, m) => acc + (m.pontuacao || 0), 0) / totalModulos)
      : 0
    
    texto += '📊 RESUMO EXECUTIVO\n'
    texto += '─'.repeat(40) + '\n\n'
    texto += `   IMV™ Total: ${imv}\n`
    texto += `   Módulos: ${concluidos}/${totalModulos} concluídos\n`
    texto += `   Nível: ${obterNivelMaturidade(imv)}\n\n`
    texto += '─'.repeat(80) + '\n\n'

    for (const modulo of modulos) {
      const analise = analises.find(a => a.modulo_id === modulo.id)
      const areaLabel = MODULOS_LABELS[modulo.area] || modulo.area
      
      texto += `┌─ ${areaLabel}\n`
      texto += `│  Status: ${modulo.status}\n`
      texto += `│  Pontuação: ${modulo.pontuacao || 0}%\n`
      
      if (analise) {
        texto += `│\n`
        texto += `│  ${analise.parecer.replace(/\n/g, '\n│  ')}\n`
        texto += `│\n`
        texto += `│  💡 ${analise.recomendacao.replace(/\n/g, '\n│  ')}\n`
      }
      texto += `└─\n\n`
    }

    texto += '═'.repeat(80) + '\n'
    texto += `📅 Relatório gerado em ${new Date().toLocaleString('pt-BR')}\n`
    texto += '═'.repeat(80) + '\n'

    return texto
  }

  const gerarRelatorioExecutivo = (diagnostico: any, modulos: any[], analises: any[]) => {
    const totalModulos = modulos.length
    const concluidos = modulos.filter(m => m.status === 'CONCLUIDO' || m.status === 'VALIDADO').length
    const imv = totalModulos > 0 
      ? Math.round(modulos.reduce((acc, m) => acc + (m.pontuacao || 0), 0) / totalModulos)
      : 0

    let texto = '╔═══════════════════════════════════════════════════════════════════════╗\n'
    texto += '║                                                                           ║\n'
    texto += '║    📋 RELATÓRIO EXECUTIVO                                               ║\n'
    texto += '║    VIGORRE DIAGNOSTICS™ 3.0 "QUANTUM"                                   ║\n'
    texto += '║                                                                           ║\n'
    texto += '╚═══════════════════════════════════════════════════════════════════════╝\n\n'
    
    texto += `📌 Diagnóstico: ${diagnostico?.titulo || 'Sem título'}\n`
    texto += `🏢 Empresa: ${diagnostico?.empresas?.nome || 'Não informada'}\n`
    texto += `📅 Data: ${new Date().toLocaleDateString('pt-BR')}\n\n`
    texto += '─'.repeat(80) + '\n\n'
    
    texto += `📊 IMV™ TOTAL: ${imv}\n`
    texto += `📌 Nível: ${obterNivelMaturidade(imv)}\n`
    texto += `📌 Módulos: ${concluidos}/${totalModulos} concluídos\n\n`
    
    const criticas = analises.filter(a => a.prioridade === 'CRITICA' || a.prioridade === 'ALTA')
    if (criticas.length > 0) {
      texto += '⚠️ PRIORIDADES CRÍTICAS:\n'
      texto += '─'.repeat(40) + '\n'
      for (const c of criticas) {
        const area = modulos.find(m => m.id === c.modulo_id)
        const areaLabel = area ? MODULOS_LABELS[area.area] || area.area : 'Módulo'
        texto += `   🔴 ${areaLabel}: ${c.recomendacao}\n`
      }
      texto += '\n'
    }

    texto += '═'.repeat(80) + '\n'
    texto += `📅 Relatório gerado em ${new Date().toLocaleString('pt-BR')}\n`
    texto += '═'.repeat(80) + '\n'

    return texto
  }

  const gerarPlanoAcao = (diagnostico: any, modulos: any[]) => {
    let texto = '╔═══════════════════════════════════════════════════════════════════════╗\n'
    texto += '║                                                                           ║\n'
    texto += '║    📋 PLANO DE AÇÃO                                                     ║\n'
    texto += '║    VIGORRE DIAGNOSTICS™ 3.0 "QUANTUM"                                   ║\n'
    texto += '║                                                                           ║\n'
    texto += '╚═══════════════════════════════════════════════════════════════════════╝\n\n'
    
    texto += `📌 Diagnóstico: ${diagnostico?.titulo || 'Sem título'}\n`
    texto += `🏢 Empresa: ${diagnostico?.empresas?.nome || 'Não informada'}\n`
    texto += `📅 Data: ${new Date().toLocaleDateString('pt-BR')}\n\n`
    texto += '─'.repeat(80) + '\n\n'

    const modulosOrdenados = [...modulos].sort((a, b) => (a.pontuacao || 0) - (b.pontuacao || 0))
    
    texto += '🎯 AÇÕES RECOMENDADAS\n'
    texto += '─'.repeat(40) + '\n\n'
    
    let prioridadeAtual = ''

    for (const modulo of modulosOrdenados) {
      const areaLabel = MODULOS_LABELS[modulo.area] || modulo.area
      const prioridade = (modulo.pontuacao || 0) < 40 ? '🔴 ALTA' : (modulo.pontuacao || 0) < 70 ? '🟡 MÉDIA' : '🟢 BAIXA'
      const status = (modulo.pontuacao || 0) < 40 ? 'urgente' : (modulo.pontuacao || 0) < 70 ? 'em andamento' : 'concluído'
      
      if (prioridade !== prioridadeAtual) {
        prioridadeAtual = prioridade
        texto += `\n${prioridade}\n`
        texto += '─'.repeat(20) + '\n'
      }
      
      texto += `   📌 ${areaLabel}\n`
      texto += `      Pontuação atual: ${modulo.pontuacao || 0}%\n`
      texto += `      Ação: ${gerarAcaoSugerida(modulo.area, modulo.pontuacao || 0)}\n`
      texto += `      Status: ${status}\n\n`
    }

    texto += '═'.repeat(80) + '\n'
    texto += `📅 Plano gerado em ${new Date().toLocaleString('pt-BR')}\n`
    texto += '═'.repeat(80) + '\n'

    return texto
  }

  const gerarRelatorioPredicao = (diagnostico: any, modulos: any[]) => {
    const imvAtual = modulos.length > 0 
      ? Math.round(modulos.reduce((acc, m) => acc + (m.pontuacao || 0), 0) / modulos.length)
      : 0

    const projecoes = [12, 24, 36]
    const estimativas = projecoes.map(mes => ({
      mes,
      otimista: Math.min(1000, Math.round(imvAtual * (1 + (mes / 100) * 1.6))),
      realista: Math.min(1000, Math.round(imvAtual * (1 + (mes / 100) * 1.2))),
      pessimista: Math.min(1000, Math.round(imvAtual * (1 + (mes / 100) * 0.8)))
    }))

    let texto = '╔═══════════════════════════════════════════════════════════════════════╗\n'
    texto += '║                                                                           ║\n'
    texto += '║    📋 RELATÓRIO DE PREDIÇÃO                                             ║\n'
    texto += '║    VIGORRE DIAGNOSTICS™ 3.0 "QUANTUM"                                   ║\n'
    texto += '║                                                                           ║\n'
    texto += '╚═══════════════════════════════════════════════════════════════════════╝\n\n'
    
    texto += `📌 Diagnóstico: ${diagnostico?.titulo || 'Sem título'}\n`
    texto += `🏢 Empresa: ${diagnostico?.empresas?.nome || 'Não informada'}\n`
    texto += `📅 Data: ${new Date().toLocaleDateString('pt-BR')}\n\n`
    texto += '─'.repeat(80) + '\n\n'
    
    texto += `📊 IMV™ ATUAL: ${imvAtual}\n`
    texto += `📌 Nível: ${obterNivelMaturidade(imvAtual)}\n\n`
    
    texto += '📈 PROJEÇÃO DE EVOLUÇÃO\n'
    texto += '─'.repeat(40) + '\n\n'
    texto += '   Meses   │  Otimista  │  Realista  │  Pessimista\n'
    texto += '   ' + '─'.repeat(48) + '\n'
    
    for (const p of estimativas) {
      const mesStr = String(p.mes).padStart(6)
      const otimistaStr = String(p.otimista).padStart(10)
      const realistaStr = String(p.realista).padStart(10)
      const pessimistaStr = String(p.pessimista).padStart(10)
      texto += `   ${mesStr}   │  ${otimistaStr}   │  ${realistaStr}   │  ${pessimistaStr}\n`
    }
    
    texto += '\n📋 RECOMENDAÇÕES\n'
    texto += '─'.repeat(40) + '\n\n'
    texto += '   • Manter o ritmo de melhoria contínua\n'
    texto += '   • Monitorar indicadores mensalmente\n'
    texto += '   • Ajustar o plano de ação conforme necessário\n'
    texto += '   • Consultar o Knowledge Hub™ para fundamentação\n'

    texto += '\n═'.repeat(80) + '\n'
    texto += `📅 Relatório gerado em ${new Date().toLocaleString('pt-BR')}\n`
    texto += '═'.repeat(80) + '\n'

    return texto
  }

  const obterNivelMaturidade = (imv: number) => {
    if (imv >= 901) return '🏆 Excelência'
    if (imv >= 801) return '✅ Estratégico'
    if (imv >= 601) return '📊 Gerenciado'
    if (imv >= 401) return '📋 Estruturado'
    if (imv >= 201) return '📝 Básico'
    return '🔴 Inicial'
  }

  const gerarAcaoSugerida = (area: string, pontuacao: number) => {
    const acoes: Record<string, string> = {
      'ESTRATEGIA': pontuacao < 30 ? 'Revisar planejamento estratégico e definir KPIs' : pontuacao < 60 ? 'Estruturar governança e processos de decisão' : 'Fortalecer cultura de inovação e antecipação',
      'RH': pontuacao < 30 ? 'Implementar onboarding e pesquisa de clima' : pontuacao < 60 ? 'Estruturar PDI e plano de carreira' : 'Fortalecer programa de diversidade e bem-estar',
      'DP': pontuacao < 30 ? 'Implementar controle de ponto e eSocial' : pontuacao < 60 ? 'Automatizar processos de DP' : 'Otimizar gestão de benefícios e compliance',
      'JURIDICO': pontuacao < 30 ? 'Implementar programa de compliance' : pontuacao < 60 ? 'Estruturar gestão de contratos' : 'Fortalecer LGPD e governança jurídica',
      'SST': pontuacao < 30 ? 'Implementar PCMSO e PPRA' : pontuacao < 60 ? 'Estruturar CIPA e treinamentos' : 'Fortalecer cultura de segurança e bem-estar',
      'NUTRICAO': pontuacao < 30 ? 'Contratar nutricionista e revisar cardápio' : pontuacao < 60 ? 'Implementar BPF e controle de qualidade' : 'Fortalecer educação alimentar',
      'FINANCEIRO': pontuacao < 30 ? 'Implementar fluxo de caixa e orçamento' : pontuacao < 60 ? 'Estruturar análise de custos e rentabilidade' : 'Fortalecer planejamento e investimentos',
      'COMERCIAL': pontuacao < 30 ? 'Estruturar processo de vendas e CRM' : pontuacao < 60 ? 'Fortalecer marketing e branding' : 'Otimizar funil de vendas e NPS',
      'QUALIDADE': pontuacao < 30 ? 'Implementar SGQ básico' : pontuacao < 60 ? 'Estruturar ISO 9001' : 'Fortalecer cultura da qualidade',
      'MELHORIA_CONTINUA': pontuacao < 30 ? 'Implementar PDCA' : pontuacao < 60 ? 'Estruturar Lean/Seis Sigma' : 'Fortalecer cultura de inovação',
      'OPERACOES': pontuacao < 30 ? 'Mapear e padronizar processos' : pontuacao < 60 ? 'Implementar OEE e lead time' : 'Otimizar supply chain',
      'COMPRAS': pontuacao < 30 ? 'Estruturar gestão de fornecedores' : pontuacao < 60 ? 'Implementar análise de spend' : 'Fortalecer negociação e sustentabilidade',
      'TI': pontuacao < 30 ? 'Estruturar governança de TI' : pontuacao < 60 ? 'Implementar segurança da informação' : 'Fortalecer transformação digital',
      'AGRO': pontuacao < 30 ? 'Estruturar gestão da propriedade' : pontuacao < 60 ? 'Implementar sustentabilidade' : 'Fortalecer inovação e tecnologia'
    }
    return acoes[area] || `Implementar melhorias em ${area}`
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este relatório?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('relatorios')
        .delete()
        .eq('id', id)

      if (error) {
        toast.error('Erro ao excluir relatório: ' + error.message)
        return
      }

      setRelatorios(relatorios.filter(r => r.id !== id))
      toast.success('Relatório excluído com sucesso!')
    } catch (error) {
      toast.error('Erro ao excluir relatório')
    }
  }

  const handleVisualizar = (relatorio: any) => {
    setVisualizando(relatorio)
  }

  const handleFecharVisualizacao = () => {
    setVisualizando(null)
  }

  const handleImprimir = () => {
    window.print()
  }

  const getTipoLabel = (tipo: string) => {
    return TIPOS_RELATORIO.find(t => t.id === tipo)?.label || tipo
  }

  const getTipoIcon = (tipo: string) => {
    const item = TIPOS_RELATORIO.find(t => t.id === tipo)
    return item?.icone || FileText
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
            <h1 className="text-2xl font-bold text-[#0A3D78]">Relatórios</h1>
            <p className="text-[#5E6C84] text-sm">
              {diagnostico?.titulo} - {diagnostico?.empresas?.nome || 'Empresa'}
            </p>
          </div>
        </div>
      </div>

      {/* Gerar Relatório */}
      <Card>
        <CardHeader>
          <CardTitle className="text-[#0A3D78] flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Gerar Novo Relatório
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {TIPOS_RELATORIO.map((tipo) => {
              const Icon = tipo.icone
              return (
                <button
                  key={tipo.id}
                  onClick={() => setSelectedTipo(tipo.id as TipoRelatorio)}
                  className={`
                    p-4 rounded-lg border-2 text-left transition-all hover:shadow-md
                    ${selectedTipo === tipo.id
                      ? 'border-[#0F5FA8] bg-[#EAF3FC]'
                      : 'border-[#D7DEE8] hover:border-[#4D90D9]'
                    }
                  `}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${
                      selectedTipo === tipo.id ? 'bg-[#0F5FA8] text-white' : 'bg-[#F7F8FA] text-[#5E6C84]'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-[#1C1F26] text-sm">{tipo.label}</p>
                      <p className="text-xs text-[#5E6C84]">{tipo.descricao}</p>
                      {tipo.id === 'CTI_COMPLETO' && (
                        <Badge className="mt-1 text-xs bg-indigo-100 text-indigo-700 border-indigo-200">
                          <BookOpen className="w-3 h-3 mr-1" />
                          Knowledge Hub™
                        </Badge>
                      )}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          <Button
            className="w-full mt-4 bg-[#0F5FA8] hover:bg-[#0A3D78]"
            onClick={handleGenerate}
            disabled={generating}
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Gerando relatório...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4 mr-2" />
                Gerar Relatório
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Lista de Relatórios */}
      <Card>
        <CardHeader>
          <CardTitle className="text-[#0A3D78] flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Relatórios Gerados ({relatorios.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {relatorios.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-[#D7DEE8] mx-auto mb-4" />
              <p className="text-[#5E6C84]">
                Nenhum relatório gerado ainda.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {relatorios.map((rel) => {
                const Icon = getTipoIcon(rel.tipo)
                return (
                  <div
                    key={rel.id}
                    className="flex items-center justify-between p-4 border border-[#D7DEE8] rounded-lg hover:border-[#0F5FA8] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-[#F7F8FA] rounded-lg">
                        <Icon className="w-4 h-4 text-[#0F5FA8]" />
                      </div>
                      <div>
                        <p className="font-medium text-[#1C1F26]">{rel.titulo}</p>
                        <p className="text-sm text-[#5E6C84]">
                          {new Date(rel.created_at).toLocaleString('pt-BR')}
                        </p>
                        {rel.tipo === 'CTI_COMPLETO' && (
                          <Badge className="mt-1 text-xs bg-indigo-100 text-indigo-700 border-indigo-200">
                            <BookOpen className="w-3 h-3 mr-1" />
                            Com Knowledge Hub™
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleVisualizar(rel)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDelete(rel.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Visualização */}
      {visualizando && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-[#D7DEE8]">
              <h3 className="font-bold text-[#0A3D78]">{visualizando.titulo}</h3>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleImprimir}>
                  <Printer className="w-4 h-4 mr-2" />
                  Imprimir
                </Button>
                <Button variant="ghost" size="sm" onClick={handleFecharVisualizacao}>
                  ✕
                </Button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-6 bg-[#F7F8FA]">
              <pre className="whitespace-pre-wrap font-mono text-sm bg-white p-6 rounded-lg border border-[#D7DEE8]">
                {visualizando.conteudo || 'Conteúdo do relatório...'}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
