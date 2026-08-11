'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  Loader2,
  FileText,
  Shield,
  TrendingUp,
  BookMarked,
  BookOpen,
  Calendar,
  Tag,
  Pencil,
  Trash2,
  ExternalLink,
  Clock,
  CheckCircle,
  AlertCircle,
  Copy
} from 'lucide-react'
import { toast } from 'sonner'

type Categoria = 'LEGISLACAO' | 'NORMA' | 'BENCHMARK' | 'ARTIGO' | 'GUIA'

const CATEGORIA_LABELS: Record<Categoria, string> = {
  LEGISLACAO: '📜 Legislação',
  NORMA: '📋 Norma',
  BENCHMARK: '📊 Benchmark',
  ARTIGO: '📄 Artigo',
  GUIA: '📖 Guia'
}

const CATEGORIA_CORES: Record<Categoria, string> = {
  LEGISLACAO: 'bg-blue-100 text-blue-700 border-blue-200',
  NORMA: 'bg-purple-100 text-purple-700 border-purple-200',
  BENCHMARK: 'bg-green-100 text-green-700 border-green-200',
  ARTIGO: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  GUIA: 'bg-indigo-100 text-indigo-700 border-indigo-200'
}

const MODULOS: Record<string, string> = {
  ESTRATEGIA: 'Estratégia',
  RH: 'RH',
  DP: 'DP',
  JURIDICO: 'Jurídico',
  SST: 'SST',
  NUTRICAO: 'Nutrição',
  FINANCEIRO: 'Financeiro',
  COMERCIAL: 'Comercial',
  QUALIDADE: 'Qualidade',
  MELHORIA_CONTINUA: 'Melhoria Contínua',
  OPERACOES: 'Operações',
  COMPRAS: 'Compras',
  TI: 'TI',
  AGRO: 'Agronegócio'
}

export default function KnowledgeDetailPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  const id = params.id as string

  const [loading, setLoading] = useState(true)
  const [item, setItem] = useState<any>(null)
  const [userData, setUserData] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)

      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data } = await supabase
            .from('usuarios')
            .select('*')
            .eq('user_id', user.id)
            .single()
          setUserData(data)
          setIsAdmin(data?.perfil === 'ADMIN')
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

        setItem(data)
      } catch (error) {
        toast.error('Erro ao carregar conteúdo')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [supabase, id, router])

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir este conteúdo?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('knowledge_base')
        .delete()
        .eq('id', id)

      if (error) {
        toast.error('Erro ao excluir conteúdo: ' + error.message)
        return
      }

      toast.success('Conteúdo excluído com sucesso!')
      router.push('/knowledge-hub')
    } catch (error) {
      toast.error('Erro ao excluir conteúdo')
    }
  }

  const handleCopy = () => {
    if (item?.conteudo) {
      navigator.clipboard.writeText(item.conteudo)
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
      toast.success('Conteúdo copiado para a área de transferência!')
    }
  }

  const getCategoriaIcon = (categoria: Categoria) => {
    const icons = {
      LEGISLACAO: <FileText className="w-5 h-5" />,
      NORMA: <Shield className="w-5 h-5" />,
      BENCHMARK: <TrendingUp className="w-5 h-5" />,
      ARTIGO: <BookMarked className="w-5 h-5" />,
      GUIA: <BookOpen className="w-5 h-5" />
    }
    return icons[categoria] || <FileText className="w-5 h-5" />
  }

  const formatarData = (data: string) => {
    if (!data) return '—'
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const getModuloBadge = (moduloArea: string | null) => {
    if (!moduloArea) return null
    const label = MODULOS[moduloArea] || moduloArea
    return (
      <Badge variant="outline" className="text-xs bg-[#EAF3FC] text-[#0F5FA8] border-[#0F5FA8]">
        {label}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#0F5FA8]" />
      </div>
    )
  }

  if (!item) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <p className="text-[#5E6C84]">Conteúdo não encontrado</p>
        <Button className="mt-4" onClick={() => router.push('/knowledge-hub')}>
          Voltar para Knowledge Hub™
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
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
            <div className="flex items-center gap-2 flex-wrap">
              {getCategoriaIcon(item.categoria)}
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${CATEGORIA_CORES[item.categoria as Categoria]}`}>
                {CATEGORIA_LABELS[item.categoria as Categoria]}
              </span>
              {getModuloBadge(item.modulo_area)}
              {item.ativo ? (
                <Badge className="bg-green-100 text-green-700">Ativo</Badge>
              ) : (
                <Badge className="bg-gray-100 text-gray-500">Inativo</Badge>
              )}
            </div>
            <h1 className="text-2xl font-bold text-[#0A3D78] mt-2">
              {item.titulo}
            </h1>
          </div>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <Link href={`/knowledge-hub/${item.id}/editar`}>
              <Button variant="outline">
                <Pencil className="w-4 h-4 mr-2" />
                Editar
              </Button>
            </Link>
            <Button
              variant="outline"
              className="text-red-500 hover:text-red-700 hover:bg-red-50"
              onClick={handleDelete}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Excluir
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conteúdo Principal */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-[#0A3D78]">Descrição</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[#1C1F26]">{item.descricao}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-[#0A3D78]">Conteúdo</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                className="text-[#5E6C84] hover:text-[#0F5FA8]"
              >
                {copied ? (
                  <CheckCircle className="w-4 h-4 mr-1 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4 mr-1" />
                )}
                {copied ? 'Copiado!' : 'Copiar'}
              </Button>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <div className="text-[#1C1F26] whitespace-pre-wrap bg-[#F7F8FA] p-4 rounded-lg border border-[#D7DEE8] font-mono text-sm">
                  {item.conteudo}
                </div>
              </div>
            </CardContent>
          </Card>

          {item.tags && item.tags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-[#0A3D78] flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  Tags
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {item.tags.map((tag: string) => (
                    <span key={tag} className="px-3 py-1 bg-[#EAF3FC] text-[#0F5FA8] rounded-full text-sm">
                      #{tag}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-[#0A3D78] text-sm">Informações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-[#5E6C84]" />
                <span className="text-[#5E6C84]">Publicação:</span>
                <span className="text-[#1C1F26] font-medium">
                  {formatarData(item.data_publicacao)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-[#5E6C84]" />
                <span className="text-[#5E6C84]">Versão:</span>
                <span className="text-[#1C1F26] font-medium">v{item.versao}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <FileText className="w-4 h-4 text-[#5E6C84]" />
                <span className="text-[#5E6C84]">Fonte:</span>
                <span className="text-[#1C1F26] font-medium">{item.fonte || 'Vigorre'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <BookOpen className="w-4 h-4 text-[#5E6C84]" />
                <span className="text-[#5E6C84]">Atualizado:</span>
                <span className="text-[#1C1F26] font-medium">
                  {formatarData(item.updated_at)}
                </span>
              </div>
              {item.url && (
                <div className="flex items-center gap-2 text-sm">
                  <ExternalLink className="w-4 h-4 text-[#5E6C84]" />
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#0F5FA8] hover:underline"
                  >
                    Acessar fonte original
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-[#0A3D78] text-sm">🔗 Relacionado ao Módulo</CardTitle>
            </CardHeader>
            <CardContent>
              {item.modulo_area ? (
                <div className="p-3 bg-[#EAF3FC] rounded-lg">
                  <p className="text-sm font-medium text-[#0A3D78]">
                    {MODULOS[item.modulo_area] || item.modulo_area}
                  </p>
                  <p className="text-xs text-[#5E6C84] mt-1">
                    Este conteúdo é utilizado no diagnóstico deste módulo
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-[#5E6C84]">
                    📚 Conteúdo geral, aplicável a todos os módulos
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-[#0A3D78] text-sm">📊 Uso no CTI™</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-[#5E6C84]">Disponível para consulta</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-[#5E6C84]">Utilizado em análises automáticas</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-[#5E6C84]">Referência para recomendações</span>
                </div>
                <div className="mt-2 p-2 bg-[#EAF3FC] rounded-lg">
                  <p className="text-xs text-[#5E6C84]">
                    💡 O CTI™ consulta este conteúdo durante a análise do módulo relacionado
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
