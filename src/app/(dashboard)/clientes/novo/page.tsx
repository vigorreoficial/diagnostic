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

export default function NovoClientePage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    nome: '',
    nome_fantasia: '',
    cnpj: '',
    cnae: '',
    porte: '',
    segmento: '',
    numero_funcionarios: '',
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
      if (!formData.nome || !formData.cnpj) {
        toast.error('Nome e CNPJ são obrigatórios')
        setLoading(false)
        return
      }

      // Verificar se CNPJ já existe
      const { data: existing } = await supabase
        .from('empresas')
        .select('id')
        .eq('cnpj', formData.cnpj)
        .single()

      if (existing) {
        toast.error('Já existe um cliente com este CNPJ')
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('empresas')
        .insert({
          nome: formData.nome,
          nome_fantasia: formData.nome_fantasia || null,
          cnpj: formData.cnpj,
          cnae: formData.cnae || null,
          porte: formData.porte || null,
          segmento: formData.segmento || null,
          numero_funcionarios: formData.numero_funcionarios ? parseInt(formData.numero_funcionarios) : null,
        })
        .select()
        .single()

      if (error) {
        toast.error('Erro ao criar cliente: ' + error.message)
        return
      }

      toast.success('Cliente criado com sucesso!')
      router.push(`/clientes/${data.id}`)
    } catch (error) {
      toast.error('Erro ao criar cliente')
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
        <h1 className="text-2xl font-bold text-[#0A3D78]">Novo Cliente</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-[#0A3D78]">Dados da Empresa</CardTitle>
          <p className="text-sm text-[#5E6C84]">
            Preencha as informações do cliente para iniciar o cadastro.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Nome */}
              <div className="space-y-2">
                <Label htmlFor="nome" className="text-[#1C1F26]">
                  Razão Social *
                </Label>
                <Input
                  id="nome"
                  placeholder="Nome oficial da empresa"
                  value={formData.nome}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Nome Fantasia */}
              <div className="space-y-2">
                <Label htmlFor="nome_fantasia" className="text-[#1C1F26]">
                  Nome Fantasia
                </Label>
                <Input
                  id="nome_fantasia"
                  placeholder="Nome comercial"
                  value={formData.nome_fantasia}
                  onChange={handleChange}
                />
              </div>

              {/* CNPJ */}
              <div className="space-y-2">
                <Label htmlFor="cnpj" className="text-[#1C1F26]">
                  CNPJ *
                </Label>
                <Input
                  id="cnpj"
                  placeholder="Apenas números"
                  value={formData.cnpj}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* CNAE */}
              <div className="space-y-2">
                <Label htmlFor="cnae" className="text-[#1C1F26]">
                  CNAE
                </Label>
                <Input
                  id="cnae"
                  placeholder="Código CNAE"
                  value={formData.cnae}
                  onChange={handleChange}
                />
              </div>

              {/* Porte */}
              <div className="space-y-2">
                <Label htmlFor="porte" className="text-[#1C1F26]">
                  Porte
                </Label>
                <Select onValueChange={(value) => handleSelectChange('porte', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o porte" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MICRO">Microempresa</SelectItem>
                    <SelectItem value="PEQUENA">Pequena</SelectItem>
                    <SelectItem value="MEDIA">Média</SelectItem>
                    <SelectItem value="GRANDE">Grande</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Segmento */}
              <div className="space-y-2">
                <Label htmlFor="segmento" className="text-[#1C1F26]">
                  Segmento
                </Label>
                <Select onValueChange={(value) => handleSelectChange('segmento', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o segmento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INDUSTRIA">Indústria</SelectItem>
                    <SelectItem value="COMERCIO">Comércio</SelectItem>
                    <SelectItem value="SERVICOS">Serviços</SelectItem>
                    <SelectItem value="AGRO">Agronegócio</SelectItem>
                    <SelectItem value="OUTROS">Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Número de Funcionários */}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="numero_funcionarios" className="text-[#1C1F26]">
                  Número de Funcionários
                </Label>
                <Input
                  id="numero_funcionarios"
                  type="number"
                  placeholder="Total de colaboradores"
                  value={formData.numero_funcionarios}
                  onChange={handleChange}
                />
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
                    Salvando...
                  </>
                ) : (
                  'Salvar Cliente'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
