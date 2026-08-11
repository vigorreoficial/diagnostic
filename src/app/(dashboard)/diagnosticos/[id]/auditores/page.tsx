'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Loader2, User, X, UserCheck, Users } from 'lucide-react'
import { toast } from 'sonner'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

export default function GerenciarAuditoresPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [diagnostico, setDiagnostico] = useState<any>(null)
  const [auditoresDisponiveis, setAuditoresDisponiveis] = useState<any[]>([])
  const [auditoresVinculados, setAuditoresVinculados] = useState<any[]>([])
  const [selectedAuditor, setSelectedAuditor] = useState('')
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
            toast.error('Acesso negado. Apenas administradores podem gerenciar auditores.')
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

        // Buscar auditores vinculados
        const { data: vinculados } = await supabase
          .from('modulo_auditor')
          .select(`
            id,
            projeto_id,
            auditor_id,
            usuarios:auditor_id (id, nome, email, perfil)
          `)
          .eq('projeto_id', id)

        setAuditoresVinculados(vinculados || [])

        // Buscar auditores disponíveis (usuários com perfil AUDITOR que não estão vinculados)
        const { data: todosAuditores } = await supabase
          .from('usuarios')
          .select('id, nome, email, perfil')
          .eq('perfil', 'AUDITOR')
          .eq('ativo', true)

        const vinculadosIds = vinculados?.map(v => v.auditor_id) || []
        const disponiveis = todosAuditores?.filter(a => !vinculadosIds.includes(a.id)) || []
        setAuditoresDisponiveis(disponiveis)
      } catch (error) {
        toast.error('Erro ao carregar dados')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [params.id, supabase, router])

  const handleAddAuditor = async () => {
    if (!selectedAuditor) {
      toast.error('Selecione um auditor')
      return
    }

    setSaving(true)

    try {
      const { error } = await supabase
        .from('modulo_auditor')
        .insert({
          projeto_id: params.id,
          auditor_id: selectedAuditor,
        })

      if (error) {
        toast.error('Erro ao vincular auditor: ' + error.message)
        return
      }

      toast.success('Auditor vinculado com sucesso!')
      
      // Atualizar listas
      const auditorAdicionado = auditoresDisponiveis.find(a => a.id === selectedAuditor)
      if (auditorAdicionado) {
        setAuditoresVinculados([
          ...auditoresVinculados,
          { 
            id: 'temp', 
            projeto_id: params.id, 
            auditor_id: auditorAdicionado.id,
            usuarios: auditorAdicionado
          }
        ])
        setAuditoresDisponiveis(auditoresDisponiveis.filter(a => a.id !== selectedAuditor))
      }
      setSelectedAuditor('')
    } catch (error) {
      toast.error('Erro ao vincular auditor')
    } finally {
      setSaving(false)
    }
  }

  const handleRemoveAuditor = async (auditorId: string, nome: string) => {
    if (!confirm(`Tem certeza que deseja remover o auditor "${nome}" deste projeto?`)) {
      return
    }

    setSaving(true)

    try {
      const { error } = await supabase
        .from('modulo_auditor')
        .delete()
        .eq('projeto_id', params.id)
        .eq('auditor_id', auditorId)

      if (error) {
        toast.error('Erro ao remover auditor: ' + error.message)
        return
      }

      toast.success('Auditor removido com sucesso!')
      
      const auditorRemovido = auditoresVinculados.find(v => v.auditor_id === auditorId)
      if (auditorRemovido?.usuarios) {
        setAuditoresDisponiveis([...auditoresDisponiveis, auditorRemovido.usuarios])
      }
      setAuditoresVinculados(auditoresVinculados.filter(v => v.auditor_id !== auditorId))
    } catch (error) {
      toast.error('Erro ao remover auditor')
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
              Apenas administradores podem gerenciar auditores.
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
            Gerenciar Auditores
          </h1>
          <p className="text-[#5E6C84] text-sm">
            {diagnostico?.titulo || 'Diagnóstico'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Auditores Vinculados */}
        <Card>
          <CardHeader>
            <CardTitle className="text-[#0A3D78] flex items-center gap-2">
              <Users className="w-5 h-5" />
              Auditores Vinculados ({auditoresVinculados.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {auditoresVinculados.length === 0 ? (
              <p className="text-[#5E6C84] text-center py-8">
                Nenhum auditor vinculado a este projeto.
              </p>
            ) : (
              <div className="space-y-3">
                {auditoresVinculados.map((vinculo) => (
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
                          {vinculo.usuarios?.email || ''}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleRemoveAuditor(vinculo.auditor_id, vinculo.usuarios?.nome)}
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

        {/* Adicionar Auditor */}
        <Card>
          <CardHeader>
            <CardTitle className="text-[#0A3D78] flex items-center gap-2">
              <User className="w-5 h-5" />
              Adicionar Auditor
            </CardTitle>
          </CardHeader>
          <CardContent>
            {auditoresDisponiveis.length === 0 ? (
              <div className="text-center py-8">
                <UserCheck className="w-12 h-12 text-[#D7DEE8] mx-auto mb-4" />
                <p className="text-[#5E6C84]">
                  {auditoresVinculados.length > 0 
                    ? 'Todos os auditores estão vinculados a este projeto.'
                    : 'Nenhum auditor disponível. Crie um colaborador com perfil AUDITOR primeiro.'}
                </p>
                {auditoresVinculados.length === 0 && (
                  <Button
                    className="mt-4 bg-[#0F5FA8] hover:bg-[#0A3D78]"
                    onClick={() => window.location.href = '/colaboradores/novo'}
                  >
                    <User className="w-4 h-4 mr-2" />
                    Criar Auditor
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm text-[#1C1F26] font-medium">
                    Selecione um auditor
                  </label>
                  <Select
                    value={selectedAuditor}
                    onValueChange={setSelectedAuditor}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Escolha um auditor..." />
                    </SelectTrigger>
                    <SelectContent>
                      {auditoresDisponiveis.map((auditor) => (
                        <SelectItem key={auditor.id} value={auditor.id}>
                          <div className="flex items-center gap-2">
                            <span>{auditor.nome}</span>
                            <span className="text-xs text-[#5E6C84]">
                              ({auditor.email})
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  className="w-full bg-[#0F5FA8] hover:bg-[#0A3D78]"
                  onClick={handleAddAuditor}
                  disabled={saving || !selectedAuditor}
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Vinculando...
                    </>
                  ) : (
                    <>
                      <UserCheck className="w-4 h-4 mr-2" />
                      Vincular Auditor
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
