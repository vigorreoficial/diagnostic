'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function EditarColaboradorPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    perfil: '',
    especializacao: '',
    competencias: '',
    ativo: true,
  })
  const [userData, setUserData] = useState<any>(null)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)

      try {
        // Verificar se é ADMIN
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data } = await supabase
            .from('usuarios')
            .select('*')
            .eq('user_id', user.id)
            .single()
          setUserData(data)

          if (data?.perfil !== 'ADMIN') {
            toast.error('Acesso negado')
            router.push('/')
            return
          }
        }

        // Buscar colaborador
        const { data, error } = await supabase
          .from('usuarios')
          .select('*')
          .eq('id', params.id)
          .single()

        if (error) {
          toast.error('Colaborador não encontrado')
          router.push('/colaboradores')
          return
        }

        setFormData({
          nome: data.nome || '',
          email: data.email || '',
          perfil: data.perfil || '',
          especializacao: data.especializacao || '',
          competencias: data.competencias ? data.competencias.join(', ') : '',
          ativo: data.ativo !== false,
        })
      } catch (error) {
        toast.error('Erro ao carregar dados')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [params.id, supabase, router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value })
  }

  const handleSelectChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value })
  }

  const handleStatusChange = (value: string) => {
    setFormData({ ...formData, ativo: value === 'true' })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      // Converter competências para array
      const competenciasArray = formData.competencias
        ? formData.competencias.split(',').map(c => c.trim()).filter(c => c)
        : []

      const { error } = await supabase
        .from('usuarios')
        .update({
          nome: formData.nome,
          perfil: formData.perfil,
          especializacao: formData.especializacao || null,
          competencias: competenciasArray.length > 0 ? competenciasArray : null,
          ativo: formData.ativo,
        })
        .eq('id', params.id)

      if (error) {
        toast.error('Erro ao atualizar colaborador: ' + error.message)
        return
      }

      toast.success('Colaborador atualizado com sucesso!')
      router.push(`/colaboradores/${params.id}`)
    } catch (error) {
      toast.error('Erro ao atualizar colaborador')
    } finally {
      setSaving(false)
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
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="text-[#5E6C84] hover:text-[#0F5FA8]"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <h1 className="text-2xl font-bold text-[#0A3D78]">Editar Colaborador</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-[#0A3D78]">Dados do Colaborador</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome" className="text-[#1C1F26]">
                  Nome Completo *
                </Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-[#1C1F26]">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  disabled
                  className="bg-gray-50"
                />
                <p className="text-xs text-[#5E6C84]">O email não pode ser alterado</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="perfil" className="text-[#1C1F26]">
                  Perfil *
                </Label>
                <Select
                  value={formData.perfil}
                  onValueChange={(value) => handleSelectChange('perfil', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o perfil" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADMIN">Administrador</SelectItem>
                    <SelectItem value="DIRETOR">Diretor</SelectItem>
                    <SelectItem value="GESTOR">Gestor de Projetos</SelectItem>
                    <SelectItem value="CONSULTOR">Consultor</SelectItem>
                    <SelectItem value="AUDITOR">Auditor</SelectItem>
                    <SelectItem value="ESPECIALISTA">Especialista</SelectItem>
                    <SelectItem value="CLIENTE">Cliente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="especializacao" className="text-[#1C1F26]">
                  Especialização
                </Label>
                <Input
                  id="especializacao"
                  value={formData.especializacao}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="competencias" className="text-[#1C1F26]">
                  Competências
                </Label>
                <Input
                  id="competencias"
                  placeholder="Separadas por vírgula"
                  value={formData.competencias}
                  onChange={handleChange}
                />
                <p className="text-xs text-[#5E6C84]">
                  Digite as competências separadas por vírgula
                </p>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="ativo" className="text-[#1C1F26]">
                  Status
                </Label>
                <Select
                  value={formData.ativo ? 'true' : 'false'}
                  onValueChange={handleStatusChange}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">✅ Ativo</SelectItem>
                    <SelectItem value="false">❌ Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-[#0F5FA8] hover:bg-[#0A3D78]"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Salvar Alterações'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
