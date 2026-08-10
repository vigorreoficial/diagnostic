'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

const CATEGORIAS = [
  { value: 'LEGISLACAO', label: '📜 Legislação' },
  { value: 'NORMA', label: '📋 Norma' },
  { value: 'BENCHMARK', label: '📊 Benchmark' },
  { value: 'ARTIGO', label: '📄 Artigo' },
  { value: 'GUIA', label: '📖 Guia' }
]

const MODULOS = [
  { value: 'ESTRATEGIA', label: 'Estratégia' },
  { value: 'RH', label: 'RH' },
  { value: 'DP', label: 'DP' },
  { value: 'JURIDICO', label: 'Jurídico' },
  { value: 'SST', label: 'SST' },
  { value: 'NUTRICAO', label: 'Nutrição' },
  { value: 'FINANCEIRO', label: 'Financeiro' },
  { value: 'COMERCIAL', label: 'Comercial' },
  { value: 'QUALIDADE', label: 'Qualidade' },
  { value: 'MELHORIA_CONTINUA', label: 'Melhoria Contínua' },
  { value: 'OPERACOES', label: 'Operações' },
  { value: 'COMPRAS', label: 'Compras' },
  { value: 'TI', label: 'TI' },
  { value: 'AGRO', label: 'Agronegócio' }
]

export default function EditarKnowledgePage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  const id = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [userData, setUserData] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState(false)

  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    conteudo: '',
    categoria: '',
    modulo_area: '',
    tags: '',
    fonte: '',
    versao: '1.0',
    url: '',
    data_publicacao: '',
    ativo: true
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
            .eq('auth_user_id', user.id)
            .single()
          setUserData(data)
          setIsAdmin(data?.perfil === 'ADMIN')

          if (data?.perfil !== 'ADMIN') {
            toast.error('Acesso negado.')
            router.push('/knowledge-hub')
            return
          }
        }

        const { data, error } = await supabase
          .from('knowledge_base')
          .select('*')
          .eq('id', id)
          .single()

        if (error) {
          toast.error('Conteúdo não encontrado')
          router.push('/knowledge-hub')
          return
        }

        setFormData({
          titulo: data.titulo || '',
          descricao: data.descricao || '',
          conteudo: data.conteudo || '',
          categoria: data.categoria || '',
          modulo_area: data.modulo_area || '',
          tags: data.tags ? data.tags.join(', ') : '',
          fonte: data.fonte || '',
          versao: data.versao || '1.0',
          url: data.url || '',
          data_publicacao: data.data_publicacao || '',
          ativo: data.ativo !== false
        })
      } catch (error) {
        toast.error('Erro ao carregar dados')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [supabase, id, router])

  const handleChange = (field: string, value: string | boolean) => {
    setFormData({ ...formData, [field]: value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      if (!formData.titulo || !formData.descricao || !formData.conteudo || !formData.categoria) {
        toast.error('Preencha todos os campos obrigatórios')
        setSaving(false)
        return
      }

      const tagsArray = formData.tags
        ? formData.tags.split(',').map(t => t.trim()).filter(t => t)
        : []

      const { error } = await supabase
        .from('knowledge_base')
        .update({
          titulo: formData.titulo,
          descricao: formData.descricao,
          conteudo: formData.conteudo,
          categoria: formData.categoria,
          modulo_area: formData.modulo_area || null,
          tags: tagsArray,
          fonte: formData.fonte || 'Vigorre',
          versao: formData.versao || '1.0',
          url: formData.url || null,
          data_publicacao: formData.data_publicacao || new Date().toISOString().split('T')[0],
          ativo: formData.ativo,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) {
        toast.error('Erro ao atualizar conteúdo: ' + error.message)
        return
      }

      toast.success('Conteúdo atualizado com sucesso!')
      router.push(`/knowledge-hub/${id}`)
    } catch (error) {
      toast.error('Erro ao atualizar conteúdo')
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

  if (!isAdmin) {
    return null
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
        <h1 className="text-2xl font-bold text-[#0A3D78]">Editar Conteúdo</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-[#0A3D78]">Editar no Knowledge Hub™</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="titulo">Título *</Label>
                <Input
                  id="titulo"
                  value={formData.titulo}
                  onChange={(e) => handleChange('titulo', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="categoria">Categoria *</Label>
                <Select
                  value={formData.categoria}
                  onValueChange={(v) => handleChange('categoria', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIAS.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="modulo_area">Módulo Relacionado</Label>
                <Select
                  value={formData.modulo_area}
                  onValueChange={(v) => handleChange('modulo_area', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o módulo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Nenhum (geral)</SelectItem>
                    {MODULOS.map((mod) => (
                      <SelectItem key={mod.value} value={mod.value}>
                        {mod.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="versao">Versão</Label>
                <Input
                  id="versao"
                  value={formData.versao}
                  onChange={(e) => handleChange('versao', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fonte">Fonte</Label>
                <Input
                  id="fonte"
                  value={formData.fonte}
                  onChange={(e) => handleChange('fonte', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="data_publicacao">Data de Publicação</Label>
                <Input
                  id="data_publicacao"
                  type="date"
                  value={formData.data_publicacao}
                  onChange={(e) => handleChange('data_publicacao', e.target.value)}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="descricao">Descrição *</Label>
                <Textarea
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => handleChange('descricao', e.target.value)}
                  className="min-h-[80px]"
                  required
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="conteudo">Conteúdo *</Label>
                <Textarea
                  id="conteudo"
                  value={formData.conteudo}
                  onChange={(e) => handleChange('conteudo', e.target.value)}
                  className="min-h-[200px]"
                  required
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
                <Input
                  id="tags"
                  value={formData.tags}
                  onChange={(e) => handleChange('tags', e.target.value)}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="url">URL da Fonte</Label>
                <Input
                  id="url"
                  value={formData.url}
                  onChange={(e) => handleChange('url', e.target.value)}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="ativo">Status</Label>
                <Select
                  value={formData.ativo ? 'true' : 'false'}
                  onValueChange={(v) => handleChange('ativo', v === 'true')}
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
                className="flex-1"
                onClick={() => router.back()}
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
