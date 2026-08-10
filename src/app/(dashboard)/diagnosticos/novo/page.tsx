'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Loader2, Check, Building2 } from 'lucide-react'
import { toast } from 'sonner'

// Lista de módulos disponíveis
const MODULOS = [
  { id: 'ESTRATEGIA', label: 'Estratégia e Governança', peso: 10 },
  { id: 'RH', label: 'Recursos Humanos', peso: 10 },
  { id: 'DP', label: 'Departamento Pessoal', peso: 8 },
  { id: 'JURIDICO', label: 'Jurídico e Compliance', peso: 8 },
  { id: 'SST', label: 'Saúde e Segurança do Trabalho', peso: 8 },
  { id: 'NUTRICAO', label: 'Nutrição Organizacional', peso: 6 },
  { id: 'FINANCEIRO', label: 'Financeiro', peso: 8 },
  { id: 'COMERCIAL', label: 'Comercial e Marketing', peso: 6 },
  { id: 'QUALIDADE', label: 'Qualidade', peso: 8 },
  { id: 'MELHORIA_CONTINUA', label: 'Melhoria Contínua', peso: 7 },
  { id: 'OPERACOES', label: 'Operações e Logística', peso: 6 },
  { id: 'COMPRAS', label: 'Compras e Suprimentos', peso: 5 },
  { id: 'TI', label: 'Tecnologia da Informação', peso: 5 },
  { id: 'AGRO', label: 'Agronegócio', peso: 5 },
]

export default function NovoDiagnosticoPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const empresaIdParam = searchParams.get('empresa')

  const [loading, setLoading] = useState(false)
  const [loadingEmpresas, setLoadingEmpresas] = useState(true)
  const [empresas, setEmpresas] = useState<any[]>([])
  const [userData, setUserData] = useState<any>(null)

  const [formData, setFormData] = useState({
    titulo: '',
    empresa_id: empresaIdParam || '',
    status: 'PLANEJAMENTO',
    modulos: [] as string[],
  })

  useEffect(() => {
    const fetchData = async () => {
      setLoadingEmpresas(true)

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

        // Buscar empresas (as políticas RLS já filtram)
        const { data, error } = await supabase
          .from('empresas')
          .select('id, nome, cnpj')
          .order('nome', { ascending: true })

        if (error) {
          toast.error('Erro ao carregar empresas: ' + error.message)
          return
        }

        setEmpresas(data || [])
      } catch (error) {
        toast.error('Erro ao carregar dados')
      } finally {
        setLoadingEmpresas(false)
      }
    }

    fetchData()
  }, [supabase])

  const handleSelectChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value })
  }

  const toggleModulo = (moduloId: string) => {
    setFormData((prev) => {
      const current = prev.modulos
      const updated = current.includes(moduloId)
        ? current.filter(id => id !== moduloId)
        : [...current, moduloId]
      return { ...prev, modulos: updated }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validar campos obrigatórios
      if (!formData.titulo) {
        toast.error('Título é obrigatório')
        setLoading(false)
        return
      }

      if (!formData.empresa_id) {
        toast.error('Selecione uma empresa')
        setLoading(false)
        return
      }

      if (formData.modulos.length === 0) {
        toast.error('Selecione pelo menos um módulo')
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('projetos_diagnostico')
        .insert({
          titulo: formData.titulo,
          empresa_id: formData.empresa_id,
          responsavel_id: userData?.id || null,
          status: formData.status,
          escopo: formData.modulos,
        })
        .select()
        .single()

      if (error) {
        toast.error('Erro ao criar diagnóstico: ' + error.message)
        return
      }

      // Criar módulos do diagnóstico
      const modulosInsert = formData.modulos.map(moduloId => ({
        projeto_id: data.id,
        area: moduloId,
        status: 'PENDENTE',
        peso: MODULOS.find(m => m.id === moduloId)?.peso || 0,
        pontuacao: 0,
      }))

      const { error: modulosError } = await supabase
        .from('modulos_diagnostico')
        .insert(modulosInsert)

      if (modulosError) {
        toast.error('Erro ao criar módulos: ' + modulosError.message)
        return
      }

      toast.success('Diagnóstico criado com sucesso!')
      router.push(`/diagnosticos/${data.id}`)
    } catch (error) {
      toast.error('Erro ao criar diagnóstico')
    } finally {
      setLoading(false)
    }
  }

  if (loadingEmpresas) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#0F5FA8]" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
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
        <h1 className="text-2xl font-bold text-[#0A3D78]">Novo Diagnóstico</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-[#0A3D78]">Configurar Diagnóstico</CardTitle>
          <p className="text-sm text-[#5E6C84]">
            Selecione a empresa e os módulos que serão diagnosticados.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Título */}
            <div className="space-y-2">
              <Label htmlFor="titulo" className="text-[#1C1F26]">
                Título do Diagnóstico *
              </Label>
              <Input
                id="titulo"
                placeholder="Ex: Diagnóstico Completo - ABC Indústrias"
                value={formData.titulo}
                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                required
              />
            </div>

            {/* Empresa */}
            <div className="space-y-2">
              <Label htmlFor="empresa_id" className="text-[#1C1F26]">
                Empresa *
              </Label>
              <Select
                value={formData.empresa_id}
                onValueChange={(value) => handleSelectChange('empresa_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a empresa" />
                </SelectTrigger>
                <SelectContent>
                  {empresas.map((empresa) => (
                    <SelectItem key={empresa.id} value={empresa.id}>
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        <span>{empresa.nome}</span>
                        {empresa.cnpj && (
                          <span className="text-xs text-[#5E6C84]">({empresa.cnpj})</span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {empresas.length === 0 && (
                <p className="text-sm text-yellow-600">
                  ⚠️ Nenhuma empresa cadastrada. <a href="/clientes/novo" className="text-[#0F5FA8] hover:underline">Cadastre uma empresa primeiro</a>
                </p>
              )}
            </div>

            {/* Módulos */}
            <div className="space-y-2">
              <Label className="text-[#1C1F26]">
                Módulos do Diagnóstico *
              </Label>
              <p className="text-sm text-[#5E6C84]">
                Selecione os módulos que serão diagnosticados. A soma dos pesos = 100%.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                {MODULOS.map((modulo) => {
                  const isSelected = formData.modulos.includes(modulo.id)
                  return (
                    <button
                      key={modulo.id}
                      type="button"
                      onClick={() => toggleModulo(modulo.id)}
                      className={`
                        flex items-center justify-between p-3 rounded-lg border-2 transition-all text-left
                        ${isSelected
                          ? 'border-[#0F5FA8] bg-[#EAF3FC]'
                          : 'border-[#D7DEE8] hover:border-[#4D90D9]'
                        }
                      `}
                    >
                      <div>
                        <span className="text-sm font-medium text-[#1C1F26]">
                          {modulo.label}
                        </span>
                        <span className="ml-2 text-xs text-[#5E6C84]">
                          peso {modulo.peso}%
                        </span>
                      </div>
                      {isSelected && (
                        <Check className="w-5 h-5 text-[#0F5FA8]" />
                      )}
                    </button>
                  )
                })}
              </div>
              <div className="mt-2 text-sm">
                <span className="text-[#5E6C84]">
                  {formData.modulos.length} módulos selecionados
                </span>
                <span className="ml-4 text-[#5E6C84]">
                  Peso total: {formData.modulos.reduce((sum, id) => {
                    const modulo = MODULOS.find(m => m.id === id)
                    return sum + (modulo?.peso || 0)
                  }, 0)}%
                </span>
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
                disabled={loading || empresas.length === 0}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Criando...
                  </>
                ) : (
                  'Criar Diagnóstico'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
