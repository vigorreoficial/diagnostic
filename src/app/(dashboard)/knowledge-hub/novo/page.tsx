'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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

export default function NovoKnowledgePage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
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
    data_publicacao: ''
  })

  useEffect(() => {
    const checkAdmin = async () => {
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
          toast.error('Acesso negado. Apenas administradores podem criar conteúdo.')
          router.push('/knowledge-hub')
        }
      }
    }
    checkAdmin()
  }, [supabase, router])

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (!formData.titulo || !formData.descricao || !formData.conteudo || !formData.categoria) {
        toast.error('Preencha todos os campos obrigatórios')
        setLoading(false)
        return
      }

      const tagsArray = formData.tags
        ? formData.tags.split(',').map(t => t.trim()).filter(t => t)
        : []

      const { error } = await supabase
        .from('knowledge_base')
        .insert({
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
          ativo: true,
          created_by: userData?.id || null
        })

      if (error) {
        toast.error('Erro ao criar conteúdo: ' + error.message)
        return
      }

      toast.success('Conteúdo criado com sucesso!')
      router.push('/knowledge-hub')
    } catch (error) {
      toast.error('Erro ao criar conteúdo')
    } finally {
      setLoading(false)
    }
  }

  if (!isAdmin && !loading) {
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
        <h1 className="text-2xl font-bold text-[#0A3D78]">Novo Conteúdo</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-[#0A3D78]">Adicionar ao Knowledge Hub™</CardTitle>
          <p className="text-sm text-[#5E6C84]">
            Preencha as informações do conteúdo para adicionar à base de conhecimento.
          </p>
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
                  placeholder="Ex: NR-7 - PCMSO"
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
                  placeholder="1.0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fonte">Fonte</Label>
                <Input
                  id="fonte"
                  value={formData.fonte}
                  onChange={(e) => handleChange('fonte', e.target.value)}
                  placeholder="Ex: MTE, ISO, Planalto"
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
                  placeholder="Breve descrição do conteúdo..."
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
                  placeholder="Texto completo do conteúdo..."
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
                  placeholder="Ex: NR-7, PCMSO, SST, Saúde Ocupacional"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="url">URL da Fonte</Label>
                <Input
                  id="url"
                  value={formData.url}
                  onChange={(e) => handleChange('url', e.target.value)}
                  placeholder="https://www.gov.br/..."
                />
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
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Criando...
                  </>
                ) : (
                  'Criar Conteúdo'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
