'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Loader2, Check } from 'lucide-react'
import { toast } from 'sonner'

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

const STATUS_LABELS: Record<string, string> = {
  'CADASTRO': 'Cadastro',
  'PLANEJAMENTO': 'Planejamento',
  'COLETA': 'Coleta de dados',
  'ANALISE': 'Análise',
  'REVISAO': 'Revisão',
  'PREDICAO': 'Predição',
  'ENTREGA': 'Entrega',
  'MONITORAMENTO': 'Monitoramento',
}

export default function EditarDiagnosticoPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [userData, setUserData] = useState<any>(null)
  const [formData, setFormData] = useState({
    titulo: '',
    status: '',
    modulos: [] as string[],
  })
  const [modulosExistentes, setModulosExistentes] = useState<any[]>([])

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
        }

        // Buscar diagnóstico
        const { data, error } = await supabase
          .from('projetos_diagnostico')
          .select('*')
          .eq('id', id)
          .single()

        if (error) {
          toast.error('Diagnóstico não encontrado')
          router.push('/diagnosticos')
          return
        }

        setFormData({
          titulo: data.titulo || '',
          status: data.status || 'PLANEJAMENTO',
          modulos: data.escopo || [],
        })

        // Buscar módulos existentes
        const { data: modulosData } = await supabase
          .from('modulos_diagnostico')
          .select('*')
          .eq('projeto_id', id)

        setModulosExistentes(modulosData || [])
      } catch (error) {
        toast.error('Erro ao carregar dados')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [params.id, supabase, router])

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
    setSaving(true)

    try {
      if (!formData.titulo) {
        toast.error('Título é obrigatório')
        setSaving(false)
        return
      }

      if (formData.modulos.length === 0) {
        toast.error('Selecione pelo menos um módulo')
        setSaving(false)
        return
      }

      // Atualizar diagnóstico
      const { error } = await supabase
        .from('projetos_diagnostico')
        .update({
          titulo: formData.titulo,
          status: formData.status,
          escopo: formData.modulos,
        })
        .eq('id', params.id)

      if (error) {
        toast.error('Erro ao atualizar diagnóstico: ' + error.message)
        return
      }

      // Atualizar módulos
      const modulosAtuais = modulosExistentes.map(m => m.area)
      const modulosParaRemover = modulosAtuais.filter(m => !formData.modulos.includes(m))
      const modulosParaAdicionar = formData.modulos.filter(m => !modulosAtuais.includes(m))

      // Remover módulos
      if (modulosParaRemover.length > 0) {
        const { error: deleteError } = await supabase
          .from('modulos_diagnostico')
          .delete()
          .eq('projeto_id', params.id)
          .in('area', modulosParaRemover)

        if (deleteError) {
          toast.error('Erro ao remover módulos')
          return
        }
      }

      // Adicionar módulos
      if (modulosParaAdicionar.length > 0) {
        const novosModulos = modulosParaAdicionar.map(moduloId => ({
          projeto_id: params.id,
          area: moduloId,
          status: 'PENDENTE',
          peso: MODULOS.find(m => m.id === moduloId)?.peso || 0,
          pontuacao: 0,
        }))

        const { error: insertError } = await supabase
          .from('modulos_diagnostico')
          .insert(novosModulos)

        if (insertError) {
          toast.error('Erro ao adicionar módulos')
          return
        }
      }

      toast.success('Diagnóstico atualizado com sucesso!')
      router.push(`/diagnosticos/${params.id}`)
    } catch (error) {
      toast.error('Erro ao atualizar diagnóstico')
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
        <h1 className="text-2xl font-bold text-[#0A3D78]">Editar Diagnóstico</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-[#0A3D78]">Editar Diagnóstico</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Título */}
            <div className="space-y-2">
              <Label htmlFor="titulo" className="text-[#1C1F26]">
                Título *
              </Label>
              <Input
                id="titulo"
                value={formData.titulo}
                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                required
              />
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="status" className="text-[#1C1F26]">
                Status
              </Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleSelectChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Módulos */}
            <div className="space-y-2">
              <Label className="text-[#1C1F26]">
                Módulos do Diagnóstico *
              </Label>
              <p className="text-sm text-[#5E6C84]">
                Selecione os módulos que serão diagnosticados.
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
