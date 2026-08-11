'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Loader2, Plus, Pencil, Trash2, CheckCircle, Clock, AlertCircle, TrendingUp, Zap } from 'lucide-react'
import { toast } from 'sonner'

type Prioridade = 'ALTA' | 'MEDIA' | 'BAIXA'
type StatusAcao = 'PENDENTE' | 'EM_ANDAMENTO' | 'CONCLUIDO' | 'CANCELADO'

interface Acao {
  id: string
  titulo: string
  descricao: string
  area: string
  prioridade: Prioridade
  prazo: string
  responsavel: string
  status: StatusAcao
  recursos: string
  indicador_sucesso: string
  impacto_imv: number
  created_at: string
}

const AREAS_LABELS: Record<string, string> = {
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
  'AGRO': 'Agronegócio'
}

const STATUS_LABELS: Record<StatusAcao, string> = {
  'PENDENTE': 'Pendente',
  'EM_ANDAMENTO': 'Em andamento',
  'CONCLUIDO': 'Concluído',
  'CANCELADO': 'Cancelado'
}

const STATUS_COLORS: Record<StatusAcao, string> = {
  'PENDENTE': 'bg-gray-100 text-gray-600',
  'EM_ANDAMENTO': 'bg-yellow-100 text-yellow-700',
  'CONCLUIDO': 'bg-green-100 text-green-700',
  'CANCELADO': 'bg-red-100 text-red-700'
}

const PRIORIDADE_LABELS: Record<Prioridade, string> = {
  'ALTA': '🔴 Alta',
  'MEDIA': '🟡 Média',
  'BAIXA': '🟢 Baixa'
}

export default function PlanoAcaoPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  const diagnosticoId = params.id as string

  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [diagnostico, setDiagnostico] = useState<any>(null)
  const [acoes, setAcoes] = useState<Acao[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [filterPrioridade, setFilterPrioridade] = useState<string>('TODAS')
  const [filterStatus, setFilterStatus] = useState<string>('TODOS')

  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    area: '',
    prioridade: 'MEDIA' as Prioridade,
    prazo: '',
    responsavel: '',
    recursos: '',
    indicador_sucesso: '',
    impacto_imv: 5
  })

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
        }

        const { data: diagData } = await supabase
          .from('projetos_diagnostico')
          .select('*, empresas(nome)')
          .eq('id', diagnosticoId)
          .single()
        setDiagnostico(diagData)

        const mockAcoes: Acao[] = [
          {
            id: '1',
            titulo: 'Implementar Programa de Onboarding',
            descricao: 'Criar programa estruturado de integração para novos colaboradores',
            area: 'RH',
            prioridade: 'ALTA',
            prazo: '2026-09-15',
            responsavel: 'Gerente de RH',
            status: 'PENDENTE',
            recursos: 'R$ 5.000',
            indicador_sucesso: 'Taxa de retenção > 90%',
            impacto_imv: 15,
            created_at: new Date().toISOString()
          },
          {
            id: '2',
            titulo: 'Implementar SGQ - ISO 9001',
            descricao: 'Estruturar Sistema de Gestão da Qualidade',
            area: 'QUALIDADE',
            prioridade: 'ALTA',
            prazo: '2026-12-30',
            responsavel: 'Gestor de Qualidade',
            status: 'EM_ANDAMENTO',
            recursos: 'R$ 30.000',
            indicador_sucesso: 'Certificação ISO 9001',
            impacto_imv: 20,
            created_at: new Date().toISOString()
          }
        ]
        setAcoes(mockAcoes)
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
      await new Promise(resolve => setTimeout(resolve, 2000))
      const novasAcoes: Acao[] = [
        {
          id: Date.now().toString(),
          titulo: 'Pesquisa de Clima Organizacional',
          descricao: 'Realizar pesquisa de clima e criar plano de ação',
          area: 'RH',
          prioridade: 'ALTA',
          prazo: '2026-09-30',
          responsavel: 'Gerente de RH',
          status: 'PENDENTE',
          recursos: 'R$ 3.000',
          indicador_sucesso: 'eNPS > 50',
          impacto_imv: 12,
          created_at: new Date().toISOString()
        }
      ]
      setAcoes([...acoes, ...novasAcoes])
      toast.success('Plano de ação gerado com sucesso!')
    } catch (error) {
      toast.error('Erro ao gerar plano de ação')
    } finally {
      setGenerating(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (!formData.titulo || !formData.descricao || !formData.area) {
        toast.error('Preencha todos os campos obrigatórios')
        setSaving(false)
        return
      }

      const novaAcao: Acao = {
        id: Date.now().toString(),
        titulo: formData.titulo,
        descricao: formData.descricao,
        area: formData.area,
        prioridade: formData.prioridade,
        prazo: formData.prazo || new Date().toISOString().split('T')[0],
        responsavel: formData.responsavel || 'Não definido',
        status: 'PENDENTE',
        recursos: formData.recursos || 'Não definido',
        indicador_sucesso: formData.indicador_sucesso || 'Não definido',
        impacto_imv: formData.impacto_imv || 5,
        created_at: new Date().toISOString()
      }

      if (editingId) {
        setAcoes(acoes.map(a => a.id === editingId ? { ...novaAcao, id: editingId } : a))
        toast.success('Ação atualizada!')
      } else {
        setAcoes([novaAcao, ...acoes])
        toast.success('Ação adicionada!')
      }

      setShowForm(false)
      setEditingId(null)
      setFormData({
        titulo: '',
        descricao: '',
        area: '',
        prioridade: 'MEDIA',
        prazo: '',
        responsavel: '',
        recursos: '',
        indicador_sucesso: '',
        impacto_imv: 5
      })
    } catch (error) {
      toast.error('Erro ao salvar ação')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (acao: Acao) => {
    setEditingId(acao.id)
    setFormData({
      titulo: acao.titulo,
      descricao: acao.descricao,
      area: acao.area,
      prioridade: acao.prioridade,
      prazo: acao.prazo,
      responsavel: acao.responsavel,
      recursos: acao.recursos,
      indicador_sucesso: acao.indicador_sucesso,
      impacto_imv: acao.impacto_imv
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta ação?')) return
    setAcoes(acoes.filter(a => a.id !== id))
    toast.success('Ação excluída!')
  }

  const handleStatusChange = async (id: string, novoStatus: StatusAcao) => {
    setAcoes(acoes.map(a => a.id === id ? { ...a, status: novoStatus } : a))
    toast.success(`Status atualizado para ${STATUS_LABELS[novoStatus]}`)
  }

  const filteredAcoes = acoes.filter(acao => {
    if (filterPrioridade !== 'TODAS' && acao.prioridade !== filterPrioridade) return false
    if (filterStatus !== 'TODOS' && acao.status !== filterStatus) return false
    return true
  })

  const totalImpacto = acoes.reduce((sum, a) => sum + a.impacto_imv, 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#0F5FA8]" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()} className="text-[#5E6C84] hover:text-[#0F5FA8]">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-[#0A3D78]">Plano de Ação</h1>
            <p className="text-[#5E6C84] text-sm">
              {diagnostico?.titulo} - {diagnostico?.empresas?.nome || 'Empresa'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleGenerate} disabled={generating}>
            {generating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Zap className="w-4 h-4 mr-2" />}
            {generating ? 'Gerando...' : 'Gerar com IA'}
          </Button>
          <Button className="bg-[#0F5FA8] hover:bg-[#0A3D78]" onClick={() => {
            setShowForm(!showForm)
            if (!showForm) {
              setEditingId(null)
              setFormData({
                titulo: '',
                descricao: '',
                area: '',
                prioridade: 'MEDIA',
                prazo: '',
                responsavel: '',
                recursos: '',
                indicador_sucesso: '',
                impacto_imv: 5
              })
            }
          }}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Ação
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><p className="text-xs text-[#5E6C84]">Total de Ações</p><p className="text-2xl font-bold text-[#0A3D78]">{acoes.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-[#5E6C84]">Prioridade Alta</p><p className="text-2xl font-bold text-red-500">{acoes.filter(a => a.prioridade === 'ALTA').length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-[#5E6C84]">Impacto IMV™ Total</p><p className="text-2xl font-bold text-green-500">+{totalImpacto}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-[#5E6C84]">Concluídas</p><p className="text-2xl font-bold text-[#0F5FA8]">{acoes.filter(a => a.status === 'CONCLUIDO').length}</p></CardContent></Card>
      </div>

      <div className="flex flex-wrap gap-4">
        <Select value={filterPrioridade} onValueChange={setFilterPrioridade}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Filtrar por prioridade" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="TODAS">Todas prioridades</SelectItem>
            <SelectItem value="ALTA">🔴 Alta</SelectItem>
            <SelectItem value="MEDIA">🟡 Média</SelectItem>
            <SelectItem value="BAIXA">🟢 Baixa</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Filtrar por status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="TODOS">Todos status</SelectItem>
            <SelectItem value="PENDENTE">Pendente</SelectItem>
            <SelectItem value="EM_ANDAMENTO">Em andamento</SelectItem>
            <SelectItem value="CONCLUIDO">Concluído</SelectItem>
            <SelectItem value="CANCELADO">Cancelado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle className="text-[#0A3D78]">{editingId ? 'Editar Ação' : 'Nova Ação'}</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="titulo">Título *</Label>
                  <Input id="titulo" value={formData.titulo} onChange={(e) => setFormData({ ...formData, titulo: e.target.value })} placeholder="Ex: Implementar programa" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="area">Área *</Label>
                  <Select value={formData.area} onValueChange={(v) => setFormData({ ...formData, area: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(AREAS_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="descricao">Descrição *</Label>
                  <Textarea id="descricao" value={formData.descricao} onChange={(e) => setFormData({ ...formData, descricao: e.target.value })} placeholder="Descreva a ação..." className="min-h-[80px]" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prioridade">Prioridade</Label>
                  <Select value={formData.prioridade} onValueChange={(v) => setFormData({ ...formData, prioridade: v as Prioridade })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALTA">🔴 Alta</SelectItem>
                      <SelectItem value="MEDIA">🟡 Média</SelectItem>
                      <SelectItem value="BAIXA">🟢 Baixa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prazo">Prazo</Label>
                  <Input id="prazo" type="date" value={formData.prazo} onChange={(e) => setFormData({ ...formData, prazo: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="responsavel">Responsável</Label>
                  <Input id="responsavel" value={formData.responsavel} onChange={(e) => setFormData({ ...formData, responsavel: e.target.value })} placeholder="Nome do responsável" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="impacto_imv">Impacto no IMV™</Label>
                  <Input id="impacto_imv" type="number" value={formData.impacto_imv} onChange={(e) => setFormData({ ...formData, impacto_imv: parseInt(e.target.value) || 0 })} min={0} max={100} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="recursos">Recursos</Label>
                  <Input id="recursos" value={formData.recursos} onChange={(e) => setFormData({ ...formData, recursos: e.target.value })} placeholder="Ex: R$ 5.000, 2 pessoas" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="indicador_sucesso">Indicador de Sucesso</Label>
                  <Input id="indicador_sucesso" value={formData.indicador_sucesso} onChange={(e) => setFormData({ ...formData, indicador_sucesso: e.target.value })} placeholder="Ex: Redução de turnover em 20%" />
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <Button type="button" variant="outline" className="flex-1" onClick={() => { setShowForm(false); setEditingId(null) }}>Cancelar</Button>
                <Button type="submit" className="flex-1 bg-[#0F5FA8] hover:bg-[#0A3D78]" disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  {saving ? 'Salvando...' : editingId ? 'Atualizar' : 'Criar'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {filteredAcoes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="w-12 h-12 text-[#D7DEE8] mx-auto mb-4" />
            <p className="text-[#5E6C84]">Nenhuma ação encontrada.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredAcoes.map((acao) => (
            <Card key={acao.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        {acao.prioridade === 'ALTA' && <AlertCircle className="w-5 h-5 text-red-500" />}
                        {acao.prioridade === 'MEDIA' && <Clock className="w-5 h-5 text-yellow-500" />}
                        {acao.prioridade === 'BAIXA' && <CheckCircle className="w-5 h-5 text-green-500" />}
                      </div>
                      <div>
                        <h3 className="font-semibold text-[#0A3D78]">{acao.titulo}</h3>
                        <p className="text-sm text-[#5E6C84] mt-1">{acao.descricao}</p>
                        <div className="flex flex-wrap items-center gap-3 mt-2 text-xs">
                          <span className="px-2 py-0.5 rounded-full bg-[#EAF3FC] text-[#0F5FA8]">{AREAS_LABELS[acao.area] || acao.area}</span>
                          <span className={`px-2 py-0.5 rounded-full ${STATUS_COLORS[acao.status]}`}>{STATUS_LABELS[acao.status]}</span>
                          <span className="text-[#5E6C84]">{PRIORIDADE_LABELS[acao.prioridade]}</span>
                          <span className="text-[#5E6C84]">📅 {new Date(acao.prazo).toLocaleDateString('pt-BR')}</span>
                          <span className="text-[#5E6C84]">👤 {acao.responsavel}</span>
                          <span className="text-green-600 font-medium">+{acao.impacto_imv} IMV</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Select value={acao.status} onValueChange={(v) => handleStatusChange(acao.id, v as StatusAcao)}>
                      <SelectTrigger className="w-[140px] h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PENDENTE">Pendente</SelectItem>
                        <SelectItem value="EM_ANDAMENTO">Em andamento</SelectItem>
                        <SelectItem value="CONCLUIDO">Concluído</SelectItem>
                        <SelectItem value="CANCELADO">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(acao)}><Pencil className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700" onClick={() => handleDelete(acao.id)}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
