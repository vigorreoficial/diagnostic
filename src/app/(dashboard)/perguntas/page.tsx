'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  CheckCircle,
  XCircle,
  Search,
  Shield
} from 'lucide-react'
import { toast } from 'sonner'

const MODULOS = [
  { id: 'ESTRATEGIA', label: 'Estratégia e Governança' },
  { id: 'RH', label: 'Recursos Humanos' },
  { id: 'DP', label: 'Departamento Pessoal' },
  { id: 'JURIDICO', label: 'Jurídico e Compliance' },
  { id: 'SST', label: 'Saúde e Segurança do Trabalho' },
  { id: 'NUTRICAO', label: 'Nutrição Organizacional' },
  { id: 'FINANCEIRO', label: 'Financeiro' },
  { id: 'COMERCIAL', label: 'Comercial e Marketing' },
  { id: 'QUALIDADE', label: 'Qualidade' },
  { id: 'MELHORIA_CONTINUA', label: 'Melhoria Contínua' },
  { id: 'OPERACOES', label: 'Operações e Logística' },
  { id: 'COMPRAS', label: 'Compras e Suprimentos' },
  { id: 'TI', label: 'Tecnologia da Informação' },
  { id: 'AGRO', label: 'Agronegócio' },
]

export default function GerenciarPerguntasPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [perguntas, setPerguntas] = useState<any[]>([])
  const [filteredPerguntas, setFilteredPerguntas] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    modulo_area: '',
    pergunta: '',
    tipo: 'SIM_NAO',
    peso: 1,
    opcoes: '',
    ordem: 0
  })

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)

      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: userInfo } = await supabase
            .from('usuarios')
            .select('*')
            .eq('auth_user_id', user.id)
            .single()
          setIsAdmin(userInfo?.perfil === 'ADMIN')

          if (userInfo?.perfil !== 'ADMIN') {
            setLoading(false)
            return
          }
        }

        const { data, error } = await supabase
          .from('perguntas')
          .select('*')
          .order('modulo_area', { ascending: true })
          .order('ordem', { ascending: true })

        if (error) {
          toast.error('Erro ao carregar perguntas: ' + error.message)
          return
        }

        setPerguntas(data || [])
        setFilteredPerguntas(data || [])
      } catch (error) {
        toast.error('Erro ao carregar dados')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [supabase])

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredPerguntas(perguntas)
    } else {
      const term = searchTerm.toLowerCase()
      const filtered = perguntas.filter(p =>
        p.pergunta?.toLowerCase().includes(term) ||
        p.modulo_area?.toLowerCase().includes(term)
      )
      setFilteredPerguntas(filtered)
    }
  }, [searchTerm, perguntas])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.modulo_area || !formData.pergunta) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }

    try {
      const data = {
        modulo_area: formData.modulo_area,
        pergunta: formData.pergunta,
        tipo: formData.tipo,
        peso: formData.peso,
        opcoes: formData.tipo === 'MULTIPLA_ESCOLHA' ? formData.opcoes.split(',').map(o => o.trim()) : null,
        ordem: formData.ordem || 0,
        ativo: true
      }

      if (editingId) {
        const { error } = await supabase
          .from('perguntas')
          .update(data)
          .eq('id', editingId)

        if (error) {
          toast.error('Erro ao atualizar pergunta: ' + error.message)
          return
        }

        toast.success('Pergunta atualizada com sucesso!')
      } else {
        const { error } = await supabase
          .from('perguntas')
          .insert(data)

        if (error) {
          toast.error('Erro ao criar pergunta: ' + error.message)
          return
        }

        toast.success('Pergunta criada com sucesso!')
      }

      // Resetar formulário
      setFormData({
        modulo_area: '',
        pergunta: '',
        tipo: 'SIM_NAO',
        peso: 1,
        opcoes: '',
        ordem: 0
      })
      setShowForm(false)
      setEditingId(null)

      // Recarregar perguntas
      const { data: refreshed } = await supabase
        .from('perguntas')
        .select('*')
        .order('modulo_area', { ascending: true })
        .order('ordem', { ascending: true })

      setPerguntas(refreshed || [])
      setFilteredPerguntas(refreshed || [])
    } catch (error) {
      toast.error('Erro ao salvar pergunta')
    }
  }

  const handleEdit = (pergunta: any) => {
    setEditingId(pergunta.id)
    setFormData({
      modulo_area: pergunta.modulo_area,
      pergunta: pergunta.pergunta,
      tipo: pergunta.tipo,
      peso: pergunta.peso,
      opcoes: pergunta.opcoes?.join(', ') || '',
      ordem: pergunta.ordem || 0
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta pergunta?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('perguntas')
        .delete()
        .eq('id', id)

      if (error) {
        toast.error('Erro ao excluir pergunta: ' + error.message)
        return
      }

      toast.success('Pergunta excluída com sucesso!')
      setPerguntas(perguntas.filter(p => p.id !== id))
      setFilteredPerguntas(filteredPerguntas.filter(p => p.id !== id))
    } catch (error) {
      toast.error('Erro ao excluir pergunta')
    }
  }

  const handleToggleAtivo = async (id: string, ativo: boolean) => {
    try {
      const { error } = await supabase
        .from('perguntas')
        .update({ ativo: !ativo })
        .eq('id', id)

      if (error) {
        toast.error('Erro ao alterar status')
        return
      }

      const updated = perguntas.map(p =>
        p.id === id ? { ...p, ativo: !ativo } : p
      )
      setPerguntas(updated)
      setFilteredPerguntas(updated)
      toast.success(`Pergunta ${ativo ? 'desativada' : 'ativada'} com sucesso!`)
    } catch (error) {
      toast.error('Erro ao alterar status')
    }
  }

  if (!isAdmin && !loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Card className="max-w-md">
          <CardContent className="py-12 text-center">
            <Shield className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <p className="text-[#1C1F26] font-medium">Acesso Negado</p>
            <p className="text-[#5E6C84] text-sm">
              Apenas administradores podem gerenciar perguntas.
            </p>
          </CardContent>
        </Card>
      </div>
    )
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
          <h1 className="text-2xl font-bold text-[#0A3D78]">Gerenciar Perguntas</h1>
          <p className="text-[#5E6C84] text-sm">
            Crie e edite perguntas dos módulos de diagnóstico
          </p>
        </div>
        <Button
          className="bg-[#0F5FA8] hover:bg-[#0A3D78]"
          onClick={() => {
            setShowForm(!showForm)
            if (!showForm) {
              setEditingId(null)
              setFormData({
                modulo_area: '',
                pergunta: '',
                tipo: 'SIM_NAO',
                peso: 1,
                opcoes: '',
                ordem: 0
              })
            }
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Pergunta
        </Button>
      </div>

      {/* Formulário */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-[#0A3D78]">
              {editingId ? 'Editar Pergunta' : 'Nova Pergunta'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="modulo_area">Módulo *</Label>
                  <Select
                    value={formData.modulo_area}
                    onValueChange={(v) => setFormData({ ...formData, modulo_area: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o módulo" />
                    </SelectTrigger>
                    <SelectContent>
                      {MODULOS.map((modulo) => (
                        <SelectItem key={modulo.id} value={modulo.id}>
                          {modulo.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tipo">Tipo de Pergunta *</Label>
                  <Select
                    value={formData.tipo}
                    onValueChange={(v) => setFormData({ ...formData, tipo: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SIM_NAO">Sim / Não</SelectItem>
                      <SelectItem value="ESCALA_1_5">Escala 1-5</SelectItem>
                      <SelectItem value="TEXTO">Texto</SelectItem>
                      <SelectItem value="MULTIPLA_ESCOLHA">Múltipla Escolha</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="pergunta">Pergunta *</Label>
                  <Textarea
                    id="pergunta"
                    value={formData.pergunta}
                    onChange={(e) => setFormData({ ...formData, pergunta: e.target.value })}
                    placeholder="Digite a pergunta..."
                    className="min-h-[80px]"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="peso">Peso</Label>
                  <Input
                    id="peso"
                    type="number"
                    value={formData.peso}
                    onChange={(e) => setFormData({ ...formData, peso: parseInt(e.target.value) || 1 })}
                    min={1}
                    max={10}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ordem">Ordem</Label>
                  <Input
                    id="ordem"
                    type="number"
                    value={formData.ordem}
                    onChange={(e) => setFormData({ ...formData, ordem: parseInt(e.target.value) || 0 })}
                    min={0}
                  />
                </div>

                {formData.tipo === 'MULTIPLA_ESCOLHA' && (
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="opcoes">Opções (separadas por vírgula)</Label>
                    <Input
                      id="opcoes"
                      value={formData.opcoes}
                      onChange={(e) => setFormData({ ...formData, opcoes: e.target.value })}
                      placeholder="Ex: Muito Ruim, Ruim, Regular, Bom, Excelente"
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-4 pt-4">
                <Button                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowForm(false)
                    setEditingId(null)
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-[#0F5FA8] hover:bg-[#0A3D78]"
                >
                  {editingId ? 'Atualizar' : 'Criar'} Pergunta
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Busca */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5E6C84]" />
        <Input
          placeholder="Buscar perguntas..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Lista de Perguntas */}
      <Card>
        <CardContent className="p-0">
          {filteredPerguntas.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-[#5E6C84]">
                {perguntas.length === 0
                  ? 'Nenhuma pergunta cadastrada.'
                  : 'Nenhuma pergunta encontrada.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#D7DEE8]">
              {filteredPerguntas.map((pergunta) => (
                <div key={pergunta.id} className="p-4 hover:bg-[#F7F8FA] transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-[#5E6C84]">
                          [{MODULOS.find(m => m.id === pergunta.modulo_area)?.label || pergunta.modulo_area}]
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          pergunta.ativo 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-gray-100 text-gray-500'
                        }`}>
                          {pergunta.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>
                      <p className="text-[#1C1F26] mt-1">{pergunta.pergunta}</p>
                      <div className="flex items-center gap-4 mt-1 text-xs text-[#5E6C84]">
                        <span>Tipo: {pergunta.tipo}</span>
                        <span>Peso: {pergunta.peso}</span>
                        <span>Ordem: {pergunta.ordem || 0}</span>
                        {pergunta.opcoes && (
                          <span>Opções: {pergunta.opcoes.join(', ')}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0 ml-4">
                      <button
                        onClick={() => handleToggleAtivo(pergunta.id, pergunta.ativo)}
                        className={`p-2 rounded-lg transition-colors ${
                          pergunta.ativo 
                            ? 'text-green-600 hover:bg-green-50' 
                            : 'text-gray-400 hover:bg-gray-50'
                        }`}
                        title={pergunta.ativo ? 'Desativar' : 'Ativar'}
                      >
                        {pergunta.ativo ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <XCircle className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => handleEdit(pergunta)}
                        className="p-2 text-[#5E6C84] hover:text-[#0F5FA8] hover:bg-[#EAF3FC] rounded-lg transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(pergunta.id)}
                        className="p-2 text-[#5E6C84] hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
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
