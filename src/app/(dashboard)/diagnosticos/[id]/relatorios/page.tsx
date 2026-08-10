'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  Brain
} from 'lucide-react'
import { toast } from 'sonner'

type TipoRelatorio = 'EXECUTIVO' | 'COMPLETO' | 'PLANO_ACAO' | 'PREDICAO' | 'CTI_COMPLETO'

const TIPOS_RELATORIO = [
  { id: 'EXECUTIVO', label: 'Relatório Executivo', descricao: 'Resumo de 4-6 páginas com principais indicadores' },
  { id: 'COMPLETO', label: 'Relatório Completo', descricao: 'Relatório detalhado com todas as áreas' },
  { id: 'PLANO_ACAO', label: 'Plano de Ação', descricao: 'Tarefas priorizadas com prazos' },
  { id: 'PREDICAO', label: 'Relatório de Predição', descricao: 'Projeção de evolução do IMV™' },
  { id: 'CTI_COMPLETO', label: 'CTI™ + Knowledge Hub™', descricao: 'Análise completa com fontes do Knowledge Hub™' },
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
          .select('knowledge_id, knowledge_base(*)')
          .eq('modulo_area', 'SST') // Simplificado
          .limit(10)
        setKnowledgeUsed(knowledgeData || [])

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
      // Simular geração de PDF
      await new Promise(resolve => setTimeout(resolve, 2000))

      const titulo = `${diagnostico?.titulo || 'Diagnóstico'} - ${TIPOS_RELATORIO.find(t => t.id === selectedTipo)?.label}`

      // Gerar conteúdo do relatório baseado no tipo
      let conteudo = ''
      let fontes = []

      if (selectedTipo === 'CTI_COMPLETO') {
        // Relatório CTI™ + Knowledge Hub™
        conteudo = gerarRelatorioCTICompleto(diagnostico, modulos, analisesCTI, knowledgeUsed)
        fontes = knowledgeUsed.map(k => k.knowledge_base)
      } else if (selectedTipo === 'COMPLETO') {
        conteudo = gerarRelatorioCompleto(diagnostico, modulos, analisesCTI)
      } else if (selectedTipo === 'EXECUTIVO') {
        conteudo = gerarRelatorioExecutivo(diagnostico, modulos, analisesCTI)
      } else if (selectedTipo === 'PLANO_ACAO') {
        conteudo = gerarPlanoAcao(diagnostico, modulos)
      } else if (selectedTipo === 'PREDICAO') {
        conteudo = gerarRelatorioPredicao(diagnostico, modulos)
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
          fontes: fontes
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

  const gerarRelatorioCTICompleto = (diagnostico: any, modulos: any[], analises: any[], knowledge: any[]) => {
    let texto = '========================================\n'
    texto += '📋 RELATÓRIO CTI™ + KNOWLEDGE HUB™\n'
    texto += '========================================\n\n'
    texto += `Diagnóstico: ${diagnostico?.titulo}\n`
    texto += `Empresa: ${diagnostico?.empresas?.nome}\n`
    texto += `Data: ${new Date().toLocaleDateString('pt-BR')}\n\n`
    texto += '---\n\n'

    // Análises por módulo
    for (const modulo of modulos) {
      const analise = analises.find(a => a.modulo_id === modulo.id)
      texto += `📌 MÓDULO: ${modulo.area}\n`
      texto += `Status: ${modulo.status}\n`
      texto += `Pontuação: ${modulo.pontuacao || 0}%\n\n`
      
      if (analise) {
        texto += `🔍 ANÁLISE DO CTI™:\n${analise.parecer}\n\n`
        texto += `💡 RECOMENDAÇÃO:\n${analise.recomendacao}\n\n`
        texto += `📊 CONFIANÇA: ${Math.round(analise.confianca * 100)}%\n`
        texto += `🔴 PRIORIDADE: ${analise.prioridade}\n\n`
      }

      // Fontes do Knowledge Hub™ utilizadas
      const fontesModulo = knowledge.filter(k => k.modulo_area === modulo.area)
      if (fontesModulo.length > 0) {
        texto += `📚 FONTES CONSULTADAS NO KNOWLEDGE HUB™:\n`
        for (const fonte of fontesModulo) {
          texto += `  • ${fonte.knowledge_base?.titulo} (v${fonte.knowledge_base?.versao})\n`
          texto += `    Fonte: ${fonte.knowledge_base?.fonte}\n`
        }
        texto += '\n'
      }
      texto += '---\n\n'
    }

    // Resumo do Knowledge Hub™
    texto += '========================================\n'
    texto += '📚 RESUMO DO KNOWLEDGE HUB™ UTILIZADO\n'
    texto += '========================================\n\n'
    
    const knowledgeUnicos = knowledge.filter((v, i, a) => 
      a.findIndex(t => t.knowledge_id === v.knowledge_id) === i
    )
    
    for (const item of knowledgeUnicos) {
      const kb = item.knowledge_base
      if (kb) {
        texto += `📖 ${kb.titulo}\n`
        texto += `   Categoria: ${kb.categoria}\n`
        texto += `   Fonte: ${kb.fonte}\n`
        texto += `   Versão: v${kb.versao}\n`
        texto += `   Tags: ${kb.tags?.join(', ')}\n\n`
      }
    }

    return texto
  }

  const gerarRelatorioCompleto = (diagnostico: any, modulos: any[], analises: any[]) => {
    let texto = '========================================\n'
    texto += '📋 RELATÓRIO COMPLETO\n'
    texto += '========================================\n\n'
    texto += `Diagnóstico: ${diagnostico?.titulo}\n`
    texto += `Empresa: ${diagnostico?.empresas?.nome}\n`
    texto += `Data: ${new Date().toLocaleDateString('pt-BR')}\n\n`
    texto += '---\n\n'

    for (const modulo of modulos) {
      const analise = analises.find(a => a.modulo_id === modulo.id)
      texto += `📌 MÓDULO: ${modulo.area}\n`
      texto += `Status: ${modulo.status}\n`
      texto += `Pontuação: ${modulo.pontuacao || 0}%\n\n`
      
      if (analise) {
        texto += `${analise.parecer}\n\n`
        texto += `💡 ${analise.recomendacao}\n\n`
      }
      texto += '---\n\n'
    }

    return texto
  }

  const gerarRelatorioExecutivo = (diagnostico: any, modulos: any[], analises: any[]) => {
    const totalModulos = modulos.length
    const concluidos = modulos.filter(m => m.status === 'CONCLUIDO' || m.status === 'VALIDADO').length
    const imv = totalModulos > 0 
      ? Math.round(modulos.reduce((acc, m) => acc + (m.pontuacao || 0), 0) / totalModulos)
      : 0

    let texto = '========================================\n'
    texto += '📋 RELATÓRIO EXECUTIVO\n'
    texto += '========================================\n\n'
    texto += `Diagnóstico: ${diagnostico?.titulo}\n`
    texto += `Empresa: ${diagnostico?.empresas?.nome}\n`
    texto += `Data: ${new Date().toLocaleDateString('pt-BR')}\n\n`
    texto += '---\n\n'
    texto += `📊 IMV™ TOTAL: ${imv}\n`
    texto += `📌 Módulos: ${concluidos}/${totalModulos} concluídos\n\n`
    
    const criticas = analises.filter(a => a.prioridade === 'CRITICA' || a.prioridade === 'ALTA')
    if (criticas.length > 0) {
      texto += '⚠️ PRIORIDADES CRÍTICAS:\n'
      for (const c of criticas) {
        texto += `  • ${c.prioridade}: ${c.recomendacao}\n`
      }
      texto += '\n'
    }

    return texto
  }

  const gerarPlanoAcao = (diagnostico: any, modulos: any[]) => {
    let texto = '========================================\n'
    texto += '📋 PLANO DE AÇÃO\n'
    texto += '========================================\n\n'
    texto += `Diagnóstico: ${diagnostico?.titulo}\n`
    texto += `Empresa: ${diagnostico?.empresas?.nome}\n`
    texto += `Data: ${new Date().toLocaleDateString('pt-BR')}\n\n`
    texto += '---\n\n'

    const modulosOrdenados = [...modulos].sort((a, b) => (a.pontuacao || 0) - (b.pontuacao || 0))
    
    texto += '🎯 AÇÕES RECOMENDADAS (POR PRIORIDADE):\n\n'
    
    for (const modulo of modulosOrdenados.slice(0, 5)) {
      const prioridade = (modulo.pontuacao || 0) < 40 ? 'ALTA' : (modulo.pontuacao || 0) < 70 ? 'MEDIA' : 'BAIXA'
      texto += `📌 ${modulo.area}\n`
      texto += `   Prioridade: ${prioridade}\n`
      texto += `   Pontuação atual: ${modulo.pontuacao || 0}%\n`
      texto += `   Ação: ${gerarAcaoSugerida(modulo.area, modulo.pontuacao || 0)}\n\n`
    }

    return texto
  }

  const gerarAcaoSugerida = (area: string, pontuacao: number) => {
    if (pontuacao < 30) {
      return `Implementar programa de gestão de ${area} do zero, com foco em processos básicos`
    } else if (pontuacao < 60) {
      return `Estruturar e padronizar processos de ${area}, com foco em documentação`
    } else if (pontuacao < 80) {
      return `Fortalecer e otimizar processos de ${area} com melhoria contínua`
    } else {
      return `Buscar excelência em ${area} com inovação e certificações`
    }
  }

  const gerarRelatorioPredicao = (diagnostico: any, modulos: any[]) => {
    const imvAtual = modulos.length > 0 
      ? Math.round(modulos.reduce((acc, m) => acc + (m.pontuacao || 0), 0) / modulos.length)
      : 0

    let texto = '========================================\n'
    texto += '📋 RELATÓRIO DE PREDIÇÃO\n'
    texto += '========================================\n\n'
    texto += `Diagnóstico: ${diagnostico?.titulo}\n`
    texto += `Empresa: ${diagnostico?.empresas?.nome}\n`
    texto += `Data: ${new Date().toLocaleDateString('pt-BR')}\n\n`
    texto += '---\n\n'
    texto += `📊 IMV™ ATUAL: ${imvAtual}\n\n`
    
    texto += '📈 PROJEÇÃO DE EVOLUÇÃO:\n\n'
    const projetados = [12, 24, 36]
    for (const mes of projetados) {
      const evolucao = Math.min(1000, Math.round(imvAtual * (1 + (mes / 100) * 1.2)))
      texto += `  • ${mes} meses: ${evolucao} pontos\n`
    }
    texto += '\n'
    texto += '📋 RECOMENDAÇÕES PARA ALCANÇAR A PROJEÇÃO:\n'
    texto += '  • Manter o ritmo de melhoria contínua\n'
    texto += '  • Monitorar indicadores mensalmente\n'
    texto += '  • Ajustar o plano de ação conforme necessário\n'

    return texto
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

  const handleDownload = (relatorio: any) => {
    // Exibir conteúdo do relatório em uma nova janela
    const win = window.open('', '_blank')
    if (win) {
      win.document.write('<html><head><title>Relatório</title></head><body><pre style="white-space: pre-wrap; font-family: monospace; padding: 20px;">')
      win.document.write(relatorio.conteudo || 'Conteúdo do relatório...')
      win.document.write('</pre></body></html>')
      win.document.close()
    }
    toast.success('Visualizando relatório!')
  }

  const getTipoLabel = (tipo: string) => {
    return TIPOS_RELATORIO.find(t => t.id === tipo)?.label || tipo
  }

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'EXECUTIVO':
        return <FileText className="w-4 h-4 text-[#0F5FA8]" />
      case 'COMPLETO':
        return <FileText className="w-4 h-4 text-[#4D90D9]" />
      case 'PLANO_ACAO':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'PREDICAO':
        return <Clock className="w-4 h-4 text-purple-500" />
      case 'CTI_COMPLETO':
        return <Brain className="w-4 h-4 text-indigo-500" />
      default:
        return <FileText className="w-4 h-4" />
    }
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {TIPOS_RELATORIO.map((tipo) => (
              <button
                key={tipo.id}
                onClick={() => setSelectedTipo(tipo.id as TipoRelatorio)}
                className={`
                  p-4 rounded-lg border-2 text-left transition-all
                  ${selectedTipo === tipo.id
                    ? 'border-[#0F5FA8] bg-[#EAF3FC]'
                    : 'border-[#D7DEE8] hover:border-[#4D90D9]'
                  }
                `}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    {getTipoIcon(tipo.id)}
                  </div>
                  <div>
                    <p className="font-medium text-[#1C1F26]">{tipo.label}</p>
                    <p className="text-sm text-[#5E6C84]">{tipo.descricao}</p>
                    {tipo.id === 'CTI_COMPLETO' && (
                      <Badge className="mt-1 bg-indigo-100 text-indigo-700 border-indigo-200">
                        <BookOpen className="w-3 h-3 mr-1" />
                        Knowledge Hub™
                      </Badge>
                    )}
                  </div>
                </div>
              </button>
            ))}
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
              {relatorios.map((rel) => (
                <div
                  key={rel.id}
                  className="flex items-center justify-between p-4 border border-[#D7DEE8] rounded-lg hover:border-[#0F5FA8] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {getTipoIcon(rel.tipo)}
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
                      onClick={() => handleDownload(rel)}
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
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
