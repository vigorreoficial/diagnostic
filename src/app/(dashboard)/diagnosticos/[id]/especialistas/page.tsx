'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Loader2, User, X, UserCheck, Users, Award } from 'lucide-react'
import { toast } from 'sonner'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

// Lista de módulos para exibição
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

export default function GerenciarEspecialistasPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [diagnostico, setDiagnostico] = useState<any>(null)
  const [modulos, setModulos] = useState<any[]>([])
  const [especialistasDisponiveis, setEspecialistasDisponiveis] = useState<any[]>([])
  const [vinculos, setVinculos] = useState<any[]>([])
  const [selectedModulo, setSelectedModulo] = useState('')
  const [selectedEspecialista, setSelectedEspecialista] = useState('')
  const [userData, setUserData] = useState<any>(null)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)

      try {
        const id = params.id as string

        // Buscar usuário
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data } = await supabase
            .from('usuarios')
            .select('*')
            .eq('user_id', user.id)
            .single()
          setUserData(data)

          if (data?.perfil !== 'ADMIN') {
            toast.error('Acesso negado. Apenas administradores podem gerenciar especialistas.')
            router.push(`/diagnosticos/${id}`)
            return
          }
        }

        // Buscar diagnóstico
        const { data: diagData } = await supabase
          .from('projetos_diagnostico')
          .select('*')
          .eq('id', id)
          .single()
        setDiagnostico(diagData)

        // Buscar módulos do diagnóstico
        const { data: modulosData } = await supabase
          .from('modulos_diagnostico')
          .select('*')
          .eq('projeto_id', id)
        setModulos(modulosData || [])

        // Buscar vinculos existentes
        const { data: vinculosData } = await supabase
          .from('modulo_especialista')
          .select(`
            id,
            modulo_id,
            especialista_id,
            usuarios:especialista_id (id, nome, email, perfil)
          `)
          .in('modulo_id', modulosData?.map(m => m.id) || [])

        setVinculos(vinculosData || [])

        // Buscar especialistas disponíveis (usuários com perfil ESPECIALISTA)
        const { data: todosEspecialistas } = await supabase
          .from('usuarios')
          .select('id, nome, email, perfil')
          .eq('perfil', 'ESPECIALISTA')
          .eq('ativo', true)

        const vinculadosIds = vinculosData?.map(v => v.especialista_id) || []
        const disponiveis = todosEspecialistas?.filter(a => !vinculadosIds.includes(a.id)) || []
        setEspecialistasDisponiveis(disponiveis)
      } catch (error) {
        toast.error('Erro ao carregar dados')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [params.id, supabase, router])

  const handleAddEspecialista = async () => {
    if (!selectedModulo) {
      toast.error('Selecione um módulo')
      return
    }

    if (!selectedEspecialista) {
      toast.error('Selecione um especialista')
      return
    }

    setSaving(true)

    try {
      const { error } = await supabase
        .from('modulo_especialista')
        .insert({
          modulo_id: selectedModulo,
          especialista_id: selectedEspecialista,
        })

      if (error) {
        toast.error('Erro ao vincular especialista: ' + error.message)
        return
      }

      toast.success('Especialista vinculado com sucesso!')
      
      // Atualizar listas
      const especialistaAdicionado = especialistasDisponiveis.find(a => a.id === selectedEspecialista)
      if (especialistaAdicionado) {
        setVinculos([
          ...vinculos,
          { 
            id: 'temp', 
            modulo_id: selectedModulo, 
            especialista_id: especialistaAdicionado.id,
            usuarios: especialistaAdicionado
          }
        ])
        setEspecialistasDisponiveis(especialistasDisponiveis.filter(a => a.id !== selectedEspecialista))
      }
      setSelectedModulo('')
      setSelectedEspecialista('')
    } catch (error) {
      toast.error('Erro ao vincular especialista')
    } finally {
      setSaving(false)
    }
  }

  const handleRemoveEspecialista = async (vinculoId: string, nome: string) => {
    if (!confirm(`Tem certeza que deseja remover o especialista "${nome}" deste módulo?`)) {
      return
    }

    setSaving(true)

    try {
      const { error } = await supabase
        .from('modulo_especialista')
        .delete()
        .eq('id', vinculoId)

      if (error) {
        toast.error('Erro ao remover especialista: ' + error.message)
        return
      }

      toast.success('Especialista removido com sucesso!')
      
      const vinculoRemovido = vinculos.find(v => v.id === vinculoId)
      if (vinculoRemovido?.usuarios) {
        setEspecialistasDisponiveis([...especialistasDisponiveis, vinculoRemovido.usuarios])
      }
      setVinculos(vinculos.filter(v => v.id !== vinculoId))
    } catch (error) {
      toast.error('Erro ao remover especialista')
    } finally {
      setSaving(false)
    }
  }

  const getInitials = (nome: string) => {
    if (!nome) return '??'
    return nome
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getModuloLabel = (moduloId: string) => {
    const modulo = modulos.find(m => m.id === moduloId)
    if (!modulo) return moduloId
    return MODULOS_LABELS[modulo.area] || modulo.area
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#0F5FA8]" />
      </div>
    )
  }

  if (userData?.perfil !== 'ADMIN') {
    return (
      <div className="flex items-center justify-center h-64">
        <Card className="max-w-md">
          <CardContent className="py-12 text-center">
            <UserCheck className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <p className="text-[#1C1F26] font-medium">Acesso Negado</p>
            <p className="text-[#5E6C84] text-sm">
              Apenas administradores podem gerenciar especialistas.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

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
          <h1 className="text-2xl font-bold text-[#0A3D78]">
            Gerenciar Especialistas
          </h1>
          <p className="text-[#5E6C84] text-sm">
            {diagnostico?.titulo || 'Diagnóstico'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Especialistas Vinculados */}
        <Card>
          <CardHeader>
            <CardTitle className="text-[#0A3D78] flex items-center gap-2">
              <Award className="w-5 h-5" />
              Especialistas Vinculados ({vinculos.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {vinculos.length === 0 ? (
              <p className="text-[#5E6C84] text-center py-8">
                Nenhum especialista vinculado a este diagnóstico.
              </p>
            ) : (
              <div className="space-y-3">
                {vinculos.map((vinculo) => (
                  <div
                    key={vinculo.id}
                    className="flex items-center justify-between p-3 bg-[#F7F8FA] rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8 bg-[#0F5FA8] text-white">
                        <AvatarFallback className="text-xs">
                          {getInitials(vinculo.usuarios?.nome)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium text-[#1C1F26]">
                          {vinculo.usuarios?.nome || '—'}
                        </p>
                        <p className="text-xs text-[#5E6C84]">
                          {getModuloLabel(vinculo.modulo_id)}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleRemoveEspecialista(vinculo.id, vinculo.usuarios?.nome)}
                      disabled={saving}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Adicionar Especialista */}
        <Card>
          <CardHeader>
            <CardTitle className="text-[#0A3D78] flex items-center gap-2">
              <User className="w-5 h-5" />
              Adicionar Especialista
            </CardTitle>
          </CardHeader>
          <CardContent>
            {modulos.length === 0 || especialistasDisponiveis.length === 0 ? (
              <div className="text-center py-8">
                <UserCheck className="w-12 h-12 text-[#D7DEE8] mx-auto mb-4" />
                <p className="text-[#5E6C84]">
                  {modulos.length === 0 
                    ? 'Nenhum módulo disponível neste diagnóstico.'
                    : 'Nenhum especialista disponível. Crie um colaborador com perfil ESPECIALISTA primeiro.'}
                </p>
                {especialistasDisponiveis.length === 0 && (
                  <Button
                    className="mt-4 bg-[#0F5FA8] hover:bg-[#0A3D78]"
                    onClick={() => window.location.href = '/colaboradores/novo'}
                  >
                    <User className="w-4 h-4 mr-2" />
                    Criar Especialista
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm text-[#1C1F26] font-medium">
                    Selecione o Módulo
                  </label>
                  <Select
                    value={selectedModulo}
                    onValueChange={setSelectedModulo}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Escolha um módulo..." />
                    </SelectTrigger>
                    <SelectContent>
                      {modulos.map((modulo) => (
                        <SelectItem key={modulo.id} value={modulo.id}>
                          {MODULOS_LABELS[modulo.area] || modulo.area}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-[#1C1F26] font-medium">
                    Selecione o Especialista
                  </label>
                  <Select
                    value={selectedEspecialista}
                    onValueChange={setSelectedEspecialista}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Escolha um especialista..." />
                    </SelectTrigger>
                    <SelectContent>
                      {especialistasDisponiveis.map((esp) => (
                        <SelectItem key={esp.id} value={esp.id}>
                          <div className="flex items-center gap-2">
                            <span>{esp.nome}</span>
                            <span className="text-xs text-[#5E6C84]">
                              ({esp.email})
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  className="w-full bg-[#0F5FA8] hover:bg-[#0A3D78]"
                  onClick={handleAddEspecialista}
                  disabled={saving || !selectedModulo || !selectedEspecialista}
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Vinculando...
                    </>
                  ) : (
                    <>
                      <UserCheck className="w-4 h-4 mr-2" />
                      Vincular Especialista
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
