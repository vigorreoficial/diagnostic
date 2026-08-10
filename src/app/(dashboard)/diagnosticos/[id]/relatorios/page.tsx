'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  Clock
} from 'lucide-react'
import { toast } from 'sonner'

type TipoRelatorio = 'EXECUTIVO' | 'COMPLETO' | 'PLANO_ACAO' | 'PREDICAO'

const TIPOS_RELATORIO = [
  { id: 'EXECUTIVO', label: 'Relatório Executivo', descricao: 'Resumo de 4-6 páginas com principais indicadores' },
  { id: 'COMPLETO', label: 'Relatório Completo', descricao: 'Relatório detalhado com todas as áreas' },
  { id: 'PLANO_ACAO', label: 'Plano de Ação', descricao: 'Tarefas priorizadas com prazos' },
  { id: 'PREDICAO', label: 'Relatório de Predição', descricao: 'Projeção de evolução do IMV™' },
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

      const { data, error } = await supabase
        .from('relatorios')
        .insert({
          projeto_id: diagnosticoId,
          tipo: selectedTipo,
          titulo: `${diagnostico?.titulo || 'Diagnóstico'} - ${TIPOS_RELATORIO.find(t => t.id === selectedTipo)?.label}`,
          url: `/relatorios/${diagnosticoId}/${selectedTipo.toLowerCase()}.pdf`,
          data_geracao: new Date().toISOString(),
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
      default:
        return <FileText className="w-4 h-4" />
    }
  }

  const handleDownload = (url: string) => {
    // Simular download
    toast.success('Download iniciado! (simulação)')
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
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(rel.url)}
                    >
                      <Download className="w-4 h-4" />
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
