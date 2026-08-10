'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Upload,
  FileText,
  Save,
  Send,
  Brain,
  BookOpen
} from 'lucide-react'
import { toast } from 'sonner'
import { Progress } from '@/components/ui/progress'

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

// Tipos de pergunta
type TipoPergunta = 'SIM_NAO' | 'ESCALA_1_5' | 'TEXTO' | 'MULTIPLA_ESCOLHA'

interface Pergunta {
  id: string
  pergunta: string
  tipo: TipoPergunta
  peso: number
  opcoes: string[] | null
  ordem: number
}

interface Resposta {
  pergunta_id: string
  resposta: any
  observacao: string
}

export default function ResponderModuloPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  const diagnosticoId = params.id as string
  const moduloId = params.moduloId as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [analisando, setAnalisando] = useState(false)
  const [modulo, setModulo] = useState<any>(null)
  const [diagnostico, setDiagnostico] = useState<any>(null)
  const [perguntas, setPerguntas] = useState<Pergunta[]>([])
  const [respostas, setRespostas] = useState<Record<string, Resposta>>({})
  const [userData, setUserData] = useState<any>(null)
  const [progresso, setProgresso] = useState(0)
  const [analiseCTI, setAnaliseCTI] = useState<any>(null)
  const [knowledgeUsed, setKnowledgeUsed] = useState<any[]>([])

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)

      try {
        // Buscar usuário
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data } = await supabase
            .from('usuarios')
            .select('*')
            .eq('auth_user_id', user.id)
            .single()
          setUserData(data)
        }

        // Buscar módulo
        const { data: moduloData } = await supabase
          .from('modulos_diagnostico')
          .select('*')
          .eq('id', moduloId)
          .single()
        setModulo(moduloData)

        // Buscar diagnóstico
        const { data: diagData } = await supabase
          .from('projetos_diagnostico')
          .select('*, empresas(nome)')
          .eq('id', diagnosticoId)
          .single()
        setDiagnostico(diagData)

        // Buscar perguntas do módulo
        const { data: perguntasData } = await supabase
          .from('perguntas')
          .select('*')
          .eq('modulo_area', moduloData?.area)
          .eq('ativo', true)
          .order('ordem', { ascending: true })

        setPerguntas(perguntasData || [])

        // Buscar respostas já salvas
        const { data: respostasData } = await supabase
          .from('perguntas_respondidas')
          .select('*')
          .eq('modulo_id', moduloId)

        if (respostasData) {
          const respostasMap: Record<string, Resposta> = {}
          respostasData.forEach((r: any) => {
            respostasMap[r.pergunta_id] = {
              pergunta_id: r.pergunta_id,
              resposta: r.resposta,
              observacao: r.observacao || ''
            }
          })
          setRespostas(respostasMap)

          // Calcular progresso
          const respondidas = Object.keys(respostasMap).length
          const total = perguntasData?.length || 0
          setProgresso(total > 0 ? Math.round((respondidas / total) * 100) : 0)
        }
      } catch (error) {
        toast.error('Erro ao carregar dados')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [supabase, diagnosticoId, moduloId])

  const handleRespostaChange = (perguntaId: string, value: any) => {
    setRespostas(prev => ({
      ...prev,
      [perguntaId]: {
        ...prev[perguntaId],
        pergunta_id: perguntaId,
        resposta: value
      }
    }))

    // Atualizar progresso
    const respondidas = Object.keys({ ...respostas, [perguntaId]: { pergunta_id: perguntaId, resposta: value } }).length
    setProgresso(Math.round((respondidas / perguntas.length) * 100))
  }

  const handleObservacaoChange = (perguntaId: string, value: string) => {
    setRespostas(prev => ({
      ...prev,
      [perguntaId]: {
        ...prev[perguntaId],
        pergunta_id: perguntaId,
        observacao: value
      }
    }))
  }

  const handleSave = async () => {
    setSaving(true)

    try {
      const respostasArray = Object.values(respostas).map(r => ({
        modulo_id: moduloId,
        pergunta_id: r.pergunta_id,
        resposta: r.resposta,
        observacao: r.observacao || null
      }))

      // Salvar respostas (upsert)
      for (const item of respostasArray) {
        const { error } = await supabase
          .from('perguntas_respondidas')
          .upsert(item, { onConflict: 'modulo_id, pergunta_id' })

        if (error) {
          toast.error('Erro ao salvar resposta: ' + error.message)
          return
        }
      }

      // Atualizar status do módulo
      const totalPerguntas = perguntas.length
      const respondidas = Object.keys(respostas).length

      let novoStatus = 'EM_ANDAMENTO'
      if (respondidas === 0) {
        novoStatus = 'PENDENTE'
      } else if (respondidas === totalPerguntas) {
        novoStatus = 'CONCLUIDO'
      }

      await supabase
        .from('modulos_diagnostico')
        .update({ status: novoStatus })
        .eq('id', moduloId)

      toast.success('Respostas salvas com sucesso!')
      router.refresh()
    } catch (error) {
      toast.error('Erro ao salvar respostas')
    } finally {
      setSaving(false)
    }
  }

  const handleAnalisarComCTI = async () => {
    // Verificar se todas as perguntas foram respondidas
    const totalPerguntas = perguntas.length
    const respondidas = Object.keys(respostas).length

    if (respondidas < totalPerguntas) {
      toast.error(`Responda todas as perguntas antes de analisar (${respondidas}/${totalPerguntas})`)
      return
    }

    setAnalisando(true)

    try {
      // Preparar respostas para envio
      const respostasArray = Object.values(respostas).map(r => ({
        pergunta_id: r.pergunta_id,
        resposta: r.resposta,
        observacao: r.observacao
      }))

      // Chamar API de análise
      const response = await fetch('/api/cti/analisar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moduloId,
          respostas: respostasArray
        })
      })

      const result = await response.json()

      if (!result.success) {
        toast.error('Erro na análise: ' + result.error)
        return
      }

      setAnaliseCTI(result.data)
      setKnowledgeUsed(result.data.fontes_utilizadas || [])
      toast.success('Análise CTI™ concluída com sucesso!')

    } catch (error) {
      toast.error('Erro ao analisar com CTI™')
    } finally {
      setAnalisando(false)
    }
  }

  const handleSubmit = async () => {
    // Verificar se todas as perguntas foram respondidas
    const totalPerguntas = perguntas.length
    const respondidas = Object.keys(respostas).length

    if (respondidas < totalPerguntas) {
      toast.error(`Responda todas as perguntas (${respondidas}/${totalPerguntas})`)
      return
    }

    setSaving(true)

    try {
      // Salvar respostas
      const respostasArray = Object.values(respostas).map(r => ({
        modulo_id: moduloId,
        pergunta_id: r.pergunta_id,
        resposta: r.resposta,
        observacao: r.observacao || null
      }))

      for (const item of respostasArray) {
        const { error } = await supabase
          .from('perguntas_respondidas')
          .upsert(item, { onConflict: 'modulo_id, pergunta_id' })

        if (error) {
          toast.error('Erro ao salvar resposta: ' + error.message)
          return
        }
      }

      // Atualizar status do módulo para CONCLUIDO
      await supabase
        .from('modulos_diagnostico')
        .update({ 
          status: 'CONCLUIDO',
          pontuacao: calcularPontuacao()
        })
        .eq('id', moduloId)

      toast.success('Módulo concluído com sucesso!')
      router.push(`/diagnosticos/${diagnosticoId}`)
    } catch (error) {
      toast.error('Erro ao finalizar módulo')
    } finally {
      setSaving(false)
    }
  }

  const calcularPontuacao = () => {
    let totalPontos = 0
    let totalPeso = 0

    perguntas.forEach(p => {
      const resposta = respostas[p.id]
      if (resposta) {
        const valor = resposta.resposta
        totalPeso += p.peso

        if (p.tipo === 'SIM_NAO') {
          totalPontos += valor === true ? p.peso : 0
        } else if (p.tipo === 'ESCALA_1_5') {
          totalPontos += (valor / 5) * p.peso
        } else if (p.tipo === 'MULTIPLA_ESCOLHA' && p.opcoes) {
          totalPontos += valor === p.opcoes[0] ? p.peso : 0
        }
      }
    })

    return totalPeso > 0 ? Math.round((totalPontos / totalPeso) * 100) : 0
  }

  const renderPergunta = (pergunta: Pergunta) => {
    const resposta = respostas[pergunta.id]
    const valor = resposta?.resposta

    switch (pergunta.tipo) {
      case 'SIM_NAO':
        return (
          <RadioGroup
            value={valor?.toString()}
            onValueChange={(v) => handleRespostaChange(pergunta.id, v === 'true')}
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="true" id={`${pergunta.id}-sim`} />
              <Label htmlFor={`${pergunta.id}-sim`}>Sim</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="false" id={`${pergunta.id}-nao`} />
              <Label htmlFor={`${pergunta.id}-nao`}>Não</Label>
            </div>
          </RadioGroup>
        )

      case 'ESCALA_1_5':
        return (
          <Select
            value={valor?.toString()}
            onValueChange={(v) => handleRespostaChange(pergunta.id, parseInt(v))}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4, 5].map((n) => (
                <SelectItem key={n} value={n.toString()}>
                  {n} - {n === 1 ? 'Muito Ruim' : n === 2 ? 'Ruim' : n === 3 ? 'Regular' : n === 4 ? 'Bom' : 'Excelente'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )

      case 'TEXTO':
        return (
          <Textarea
            value={valor || ''}
            onChange={(e) => handleRespostaChange(pergunta.id, e.target.value)}
            placeholder="Digite sua resposta..."
            className="min-h-[100px]"
          />
        )

      case 'MULTIPLA_ESCOLHA':
        if (!pergunta.opcoes) return null
        return (
          <RadioGroup
            value={valor}
            onValueChange={(v) => handleRespostaChange(pergunta.id, v)}
            className="space-y-2"
          >
            {pergunta.opcoes.map((opcao) => (
              <div key={opcao} className="flex items-center space-x-2">
                <RadioGroupItem value={opcao} id={`${pergunta.id}-${opcao}`} />
                <Label htmlFor={`${pergunta.id}-${opcao}`}>{opcao}</Label>
              </div>
            ))}
          </RadioGroup>
        )

      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#0F5FA8]" />
      </div>
    )
  }

  if (!modulo || !diagnostico) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <p className="text-[#5E6C84]">Módulo não encontrado</p>
        <Button className="mt-4" onClick={() => router.back()}>
          Voltar
        </Button>
      </div>
    )
  }

  const totalPerguntas = perguntas.length
  const respondidas = Object.keys(respostas).length
  const isCompleto = respondidas === totalPerguntas && totalPerguntas > 0

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
            <h1 className="text-2xl font-bold text-[#0A3D78]">
              {MODULOS_LABELS[modulo.area] || modulo.area}
            </h1>
            <p className="text-[#5E6C84] text-sm">
              {diagnostico.titulo} - {diagnostico.empresas?.nome || 'Empresa'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            modulo.status === 'CONCLUIDO' ? 'bg-green-100 text-green-700' :
            modulo.status === 'EM_ANDAMENTO' ? 'bg-yellow-100 text-yellow-700' :
            'bg-gray-100 text-gray-600'
          }`}>
            {modulo.status === 'CONCLUIDO' ? '✅ Concluído' :
             modulo.status === 'EM_ANDAMENTO' ? '⏳ Em andamento' :
             '📝 Pendente'}
          </span>
          {modulo.pontuacao > 0 && (
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-[#EAF3FC] text-[#0F5FA8]">
              Nota: {modulo.pontuacao}%
            </span>
          )}
        </div>
      </div>

      {/* Progresso */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-[#5E6C84]">
              Progresso: {respondidas} de {totalPerguntas} perguntas
            </span>
            <span className="text-sm font-medium text-[#0F5FA8]">
              {progresso}%
            </span>
          </div>
          <Progress value={progresso} className="h-2" />
        </CardContent>
      </Card>

      {/* Perguntas */}
      <div className="space-y-4">
        {perguntas.map((pergunta, index) => (
          <Card key={pergunta.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-[#5E6C84]">
                      #{index + 1}
                    </span>
                    <CardTitle className="text-[#1C1F26] text-base">
                      {pergunta.pergunta}
                    </CardTitle>
                  </div>
                  <p className="text-xs text-[#5E6C84] mt-1">
                    Peso: {pergunta.peso} pontos
                  </p>
                </div>
                {respostas[pergunta.id] && (
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                )}
              </div>
            </CardHeader>
            <CardContent>
              {renderPergunta(pergunta)}

              <div className="mt-4">
                <Label className="text-xs text-[#5E6C84]">
                  Observação (opcional)
                </Label>
                <Input
                  placeholder="Adicione uma observação..."
                  value={respostas[pergunta.id]?.observacao || ''}
                  onChange={(e) => handleObservacaoChange(pergunta.id, e.target.value)}
                  className="mt-1 text-sm"
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Painel CTI™ com Knowledge Hub */}
      <Card className="bg-[#EAF3FC] border-[#0F5FA8]">
        <CardHeader>
          <CardTitle className="text-[#0A3D78] flex items-center gap-2">
            <Brain className="w-5 h-5" />
            CTI™ - Análise Inteligente
            <Badge variant="outline" className="ml-2">
              <BookOpen className="w-3 h-3 mr-1" />
              Knowledge Hub™
            </Badge>
          </CardTitle>
          <p className="text-sm text-[#5E6C84]">
            O CTI™ consulta o Knowledge Hub™ para gerar uma análise precisa baseada nas respostas
          </p>
        </CardHeader>
        <CardContent>
          {analiseCTI ? (
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="mt-1">
                  {analiseCTI.prioridade === 'CRITICA' && <AlertCircle className="w-5 h-5 text-red-500" />}
                  {analiseCTI.prioridade === 'ALTA' && <AlertCircle className="w-5 h-5 text-orange-500" />}
                  {analiseCTI.prioridade === 'MEDIA' && <AlertCircle className="w-5 h-5 text-yellow-500" />}
                  {analiseCTI.prioridade === 'BAIXA' && <CheckCircle className="w-5 h-5 text-green-500" />}
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className={`
                      ${analiseCTI.prioridade === 'CRITICA' ? 'bg-red-100 text-red-700' : ''}
                      ${analiseCTI.prioridade === 'ALTA' ? 'bg-orange-100 text-orange-700' : ''}
                      ${analiseCTI.prioridade === 'MEDIA' ? 'bg-yellow-100 text-yellow-700' : ''}
                      ${analiseCTI.prioridade === 'BAIXA' ? 'bg-green-100 text-green-700' : ''}
                    `}>
                      {analiseCTI.prioridade}
                    </Badge>
                    <Badge variant="outline">
                      Confiança: {Math.round(analiseCTI.confianca * 100)}%
                    </Badge>
                  </div>
                  <p className="text-sm text-[#1C1F26] mt-2">{analiseCTI.parecer}</p>
                  <div className="mt-3 p-3 bg-white rounded-lg">
                    <p className="text-sm font-medium text-[#0F5FA8]">💡 Recomendação</p>
                    <p className="text-sm text-[#1C1F26] mt-1">{analiseCTI.recomendacao}</p>
                  </div>
                  {knowledgeUsed.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs font-medium text-[#5E6C84] flex items-center gap-1">
                        <BookOpen className="w-3 h-3" />
                        Fontes consultadas no Knowledge Hub™:
                      </p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {knowledgeUsed.map((fonte) => (
                          <span key={fonte.id} className="px-2 py-0.5 bg-white rounded-full text-xs text-[#0F5FA8] border border-[#D7DEE8]">
                            {fonte.titulo} (v{fonte.versao})
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <Button
              onClick={handleAnalisarComCTI}
              disabled={analisando || !isCompleto}
              className="w-full bg-[#0F5FA8] hover:bg-[#0A3D78]"
            >
              {analisando ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analisando com CTI™ e Knowledge Hub™...
                </>
              ) : (
                <>
                  <Brain className="w-4 h-4 mr-2" />
                  Analisar com CTI™
                </>
              )}
            </Button>
          )}
          {!isCompleto && !analiseCTI && (
            <p className="text-xs text-yellow-600 mt-2 text-center">
              ⚠️ Responda todas as perguntas para ativar a análise do CTI™
            </p>
          )}
        </CardContent>
      </Card>

      {/* Ações */}
      <div className="flex gap-4 pt-4 border-t border-[#D7DEE8]">
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => router.back()}
        >
          Cancelar
        </Button>
        <Button
          variant="outline"
          className="flex-1 bg-[#0F5FA8] text-white hover:bg-[#0A3D78]"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Salvar Respostas
            </>
          )}
        </Button>
        <Button
          className="flex-1 bg-green-600 hover:bg-green-700 text-white"
          onClick={handleSubmit}
          disabled={saving || !isCompleto}
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Finalizar Módulo
            </>
          )}
        </Button>
      </div>

      {!isCompleto && totalPerguntas > 0 && (
        <p className="text-center text-sm text-yellow-600">
          ⚠️ Responda todas as perguntas para finalizar o módulo
        </p>
      )}
    </div>
  )
}
