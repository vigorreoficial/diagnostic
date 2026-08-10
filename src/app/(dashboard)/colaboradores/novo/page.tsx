'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function NovoColaboradorPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    perfil: '',
    especializacao: '',
    competencias: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value })
  }

  const handleSelectChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validar campos obrigatórios
      if (!formData.nome || !formData.email || !formData.perfil) {
        toast.error('Nome, Email e Perfil são obrigatórios')
        setLoading(false)
        return
      }

      // Verificar se email já existe
      const { data: existing } = await supabase
        .from('usuarios')
        .select('id')
        .eq('email', formData.email)
        .single()

      if (existing) {
        toast.error('Já existe um colaborador com este email')
        setLoading(false)
        return
      }

      // Converter competências para array
      const competenciasArray = formData.competencias
        ? formData.competencias.split(',').map(c => c.trim()).filter(c => c)
        : []

      // Criar usuário no Auth primeiro
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: 'Vigorre@2026', // Senha padrão
        options: {
          data: {
            nome: formData.nome,
          }
        }
      })

      if (authError) {
        toast.error('Erro ao criar usuário: ' + authError.message)
        setLoading(false)
        return
      }

      if (!authData.user) {
        toast.error('Erro ao criar usuário')
        setLoading(false)
        return
      }

      // Inserir na tabela usuarios
      const { data, error } = await supabase
        .from('usuarios')
        .insert({
          auth_user_id: authData.user.id,
          nome: formData.nome,
          email: formData.email,
          perfil: formData.perfil,
          especializacao: formData.especializacao || null,
          competencias: competenciasArray.length > 0 ? competenciasArray : null,
          ativo: true,
        })
        .select()
        .single()

      if (error) {
        toast.error('Erro ao criar colaborador: ' + error.message)
        setLoading(false)
        return
      }

      toast.success('Colaborador criado com sucesso!')
      router.push(`/colaboradores/${data.id}`)
    } catch (error) {
      toast.error('Erro ao criar colaborador')
    } finally {
      setLoading(false)
    }
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
        <h1 className="text-2xl font-bold text-[#0A3D78]">Novo Colaborador</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-[#0A3D78]">Dados do Colaborador</CardTitle>
          <p className="text-sm text-[#5E6C84]">
            Preencha as informações do colaborador para criar seu acesso.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Nome */}
              <div className="space-y-2">
                <Label htmlFor="nome" className="text-[#1C1F26]">
                  Nome Completo *
                </Label>
                <Input
                  id="nome"
                  placeholder="Nome do colaborador"
                  value={formData.nome}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[#1C1F26]">
                  Email *
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@vigorre.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
                <p className="text-xs text-[#5E6C84]">
                  A senha inicial será: <strong>Vigorre@2026</strong>
                </p>
              </div>

              {/* Perfil */}
              <div className="space-y-2">
                <Label htmlFor="perfil" className="text-[#1C1F26]">
                  Perfil *
                </Label>
                <Select onValueChange={(value) => handleSelectChange('perfil', value)}>
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

              {/* Especialização */}
              <div className="space-y-2">
                <Label htmlFor="especializacao" className="text-[#1C1F26]">
                  Especialização
                </Label>
                <Input
                  id="especializacao"
                  placeholder="Ex: Gestão Estratégica"
                  value={formData.especializacao}
                  onChange={handleChange}
                />
              </div>

              {/* Competências */}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="competencias" className="text-[#1C1F26]">
                  Competências
                </Label>
                <Input
                  id="competencias"
                  placeholder="Separadas por vírgula (Ex: Gestão, Liderança, Estratégia)"
                  value={formData.competencias}
                  onChange={handleChange}
                />
                <p className="text-xs text-[#5E6C84]">
                  Digite as competências separadas por vírgula
                </p>
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
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Criando...
                  </>
                ) : (
                  'Criar Colaborador'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
