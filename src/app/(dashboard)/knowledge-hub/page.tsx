'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  BookOpen,
  Search,
  Plus,
  Loader2,
  FileText,
  Shield,
  TrendingUp,
  BookMarked,
  Filter,
  ChevronRight,
  Calendar,
  Tag
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
  LEGISLACAO: 'bg-blue-100 text-blue-700',
  NORMA: 'bg-purple-100 text-purple-700',
  BENCHMARK: 'bg-green-100 text-green-700',
  ARTIGO: 'bg-yellow-100 text-yellow-700',
  GUIA: 'bg-indigo-100 text-indigo-700'
}

const MODULOS = {
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

interface KnowledgeItem {
  id: string
  titulo: string
  descricao: string
  conteudo: string
  categoria: Categoria
  modulo_area: string | null
  tags: string[]
  fonte: string
  versao: string
  data_publicacao: string
  ativo: boolean
  created_at: string
}

export default function KnowledgeHubPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<KnowledgeItem[]>([])
  const [filteredItems, setFilteredItems] = useState<KnowledgeItem[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategoria, setSelectedCategoria] = useState<string>('TODAS')
  const [selectedModulo, setSelectedModulo] = useState<string>('TODOS')
  const [userData, setUserData] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState(false)

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
          .eq('ativo', true)
          .order('created_at', { ascending: false })

        if (error) {
          toast.error('Erro ao carregar Knowledge Hub: ' + error.message)
          return
        }

        setItems(data || [])
        setFilteredItems(data || [])
      } catch (error) {
        toast.error('Erro ao carregar dados')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [supabase])

  useEffect(() => {
    let filtered = [...items]

    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(item =>
        item.titulo.toLowerCase().includes(term) ||
        item.descricao.toLowerCase().includes(term) ||
        item.conteudo.toLowerCase().includes(term) ||
        item.tags.some(tag => tag.toLowerCase().includes(term))
      )
    }

    if (selectedCategoria !== 'TODAS') {
      filtered = filtered.filter(item => item.categoria === selectedCategoria)
    }

    if (selectedModulo !== 'TODOS') {
      filtered = filtered.filter(item => item.modulo_area === selectedModulo)
    }

    setFilteredItems(filtered)
  }, [searchTerm, selectedCategoria, selectedModulo, items])

  const getCategoriaIcon = (categoria: Categoria) => {
    const icons = {
      LEGISLACAO: <FileText className="w-4 h-4" />,
      NORMA: <Shield className="w-4 h-4" />,
      BENCHMARK: <TrendingUp className="w-4 h-4" />,
      ARTIGO: <BookMarked className="w-4 h-4" />,
      GUIA: <BookOpen className="w-4 h-4" />
    }
    return icons[categoria] || <FileText className="w-4 h-4" />
  }

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#0F5FA8]" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0A3D78] flex items-center gap-2">
            <BookOpen className="w-6 h-6" />
            Knowledge Hub™
          </h1>
          <p className="text-[#5E6C84] text-sm">
            Base de conhecimento viva para diagnósticos precisos
          </p>
        </div>
        {isAdmin && (
          <Link href="/knowledge-hub/novo">
            <Button className="bg-[#0F5FA8] hover:bg-[#0A3D78]">
              <Plus className="w-4 h-4 mr-2" />
              Novo Conteúdo
            </Button>
          </Link>
        )}
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-[#5E6C84] font-medium">Total de Itens</p>
            <p className="text-2xl font-bold text-[#0A3D78]">{items.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-[#5E6C84] font-medium">Legislação</p>
            <p className="text-2xl font-bold text-blue-500">
              {items.filter(i => i.categoria === 'LEGISLACAO').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-[#5E6C84] font-medium">Normas</p>
            <p className="text-2xl font-bold text-purple-500">
              {items.filter(i => i.categoria === 'NORMA').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-[#5E6C84] font-medium">Benchmarks</p>
            <p className="text-2xl font-bold text-green-500">
              {items.filter(i => i.categoria === 'BENCHMARK').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-[#5E6C84] font-medium">Atualizações</p>
            <p className="text-2xl font-bold text-[#0F5FA8]">
              {items.filter(i => new Date(i.created_at) > new Date(Date.now() - 30*24*60*60*1000)).length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Busca e Filtros */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5E6C84]" />
          <Input
            placeholder="Buscar por título, descrição ou tags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        <select
          className="px-4 py-2 border border-[#D7DEE8] rounded-lg bg-white text-[#1C1F26] text-sm focus:outline-none focus:ring-2 focus:ring-[#0F5FA8]"
          value={selectedCategoria}
          onChange={(e) => setSelectedCategoria(e.target.value)}
        >
          <option value="TODAS">Todas categorias</option>
          <option value="LEGISLACAO">📜 Legislação</option>
          <option value="NORMA">📋 Norma</option>
          <option value="BENCHMARK">📊 Benchmark</option>
          <option value="ARTIGO">📄 Artigo</option>
          <option value="GUIA">📖 Guia</option>
        </select>

        <select
          className="px-4 py-2 border border-[#D7DEE8] rounded-lg bg-white text-[#1C1F26] text-sm focus:outline-none focus:ring-2 focus:ring-[#0F5FA8]"
          value={selectedModulo}
          onChange={(e) => setSelectedModulo(e.target.value)}
        >
          <option value="TODOS">Todos os módulos</option>
          {Object.entries(MODULOS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      {/* Resultados */}
      {filteredItems.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="w-12 h-12 text-[#D7DEE8] mx-auto mb-4" />
            <p className="text-[#5E6C84]">
              {items.length === 0
                ? 'Nenhum conteúdo cadastrado no Knowledge Hub™ ainda.'
                : 'Nenhum conteúdo encontrado com esses filtros.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <Link key={item.id} href={`/knowledge-hub/${item.id}`}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer hover:border-[#0F5FA8] h-full">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {getCategoriaIcon(item.categoria)}
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${CATEGORIA_CORES[item.categoria]}`}>
                        {CATEGORIA_LABELS[item.categoria]}
                      </span>
                    </div>
                    {item.modulo_area && (
                      <Badge variant="outline" className="text-xs">
                        {MODULOS[item.modulo_area as keyof typeof MODULOS] || item.modulo_area}
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-[#0A3D78] text-base mt-2">
                    {item.titulo}
                  </CardTitle>
                  <p className="text-sm text-[#5E6C84]">{item.descricao}</p>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {item.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="px-2 py-0.5 bg-[#EAF3FC] text-[#0F5FA8] rounded-full text-xs">
                        #{tag}
                      </span>
                    ))}
                    {item.tags.length > 3 && (
                      <span className="text-xs text-[#5E6C84]">+{item.tags.length - 3}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-3 text-xs text-[#5E6C84]">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatarData(item.data_publicacao)}
                    </span>
                    <span>v{item.versao}</span>
                    <span>{item.fonte}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
