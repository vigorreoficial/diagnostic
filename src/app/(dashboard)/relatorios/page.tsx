'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  FileText,
  Search,
  Download,
  Eye,
  Trash2,
  Loader2,
  Building2,
  Calendar,
  ChevronRight
} from 'lucide-react'
import { toast } from 'sonner'

// Mapeamento de cores por tipo
const TIPO_CORES: Record<string, string> = {
  'EXECUTIVO': 'bg-[#0F5FA8]',
  'COMPLETO': 'bg-[#4D90D9]',
  'PLANO_ACAO': 'bg-green-500',
  'PREDICAO': 'bg-purple-500',
  'CTI_COMPLETO': 'bg-indigo-500',
}

const TIPO_LABELS: Record<string, string> = {
  'EXECUTIVO': 'Executivo',
  'COMPLETO': 'Completo',
  'PLANO_ACAO': 'Plano de Ação',
  'PREDICAO': 'Predição',
  'CTI_COMPLETO': 'CTI™ + Knowledge Hub™',
}

export default function RelatoriosPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [relatorios, setRelatorios] = useState<any[]>([])
  const [filteredRelatorios, setFilteredRelatorios] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
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
          .from('relatorios')
          .select(`
            *,
            projetos_diagnostico (
              id,
              titulo,
              empresas (id, nome)
            )
          `)
          .order('created_at', { ascending: false })

        if (error) {
          toast.error('Erro ao carregar relatórios: ' + error.message)
          return
        }

        setRelatorios(data || [])
        setFilteredRelatorios(data || [])
      } catch (error) {
        toast.error('Erro ao carregar dados')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [supabase])

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredRelatorios(relatorios)
    } else {
      const term = searchTerm.toLowerCase()
      const filtered = relatorios.filter(r =>
        r.titulo?.toLowerCase().includes(term) ||
        r.projetos_diagnostico?.titulo?.toLowerCase().includes(term) ||
        r.projetos_diagnostico?.empresas?.nome?.toLowerCase().includes(term) ||
        r.tipo?.toLowerCase().includes(term)
      )
      setFilteredRelatorios(filtered)
    }
  }, [searchTerm, relatorios])

  const getTipoLabel = (tipo: string) => {
    return TIPO_LABELS[tipo] || tipo
  }

  const getTipoColor = (tipo: string) => {
    return TIPO_CORES[tipo] || 'bg-gray-500'
  }

  const handleDelete = async (id: string, titulo: string) => {
    if (!confirm(`Tem certeza que deseja excluir o relatório "${titulo}"?`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('relatorios')
        .delete()
        .eq('id', id)

      if (error) {
        toast.error('Erro ao excluir relatório: ' + error.message)
        return
      }

      setRelatorios(relatorios.filter(r => r.id !== id))
      toast.success('Relatório excluído com sucesso!')
    } catch (error) {
      toast.error('Erro ao excluir relatório')
    }
  }

  const handleVisualizar = (relatorio: any) => {
    // Exibir conteúdo do relatório em uma nova janela
    const win = window.open('', '_blank')
    if (win) {
      win.document.write('<html><head><title>Relatório</title></head><body><pre style="white-space: pre-wrap; font-family: monospace; padding: 20px;">')
      win.document.write(relatorio.conteudo || 'Conteúdo do relatório...')
      win.document.write('</pre></body></html>')
      win.document.close()
    }
    toast.success('Visualizando relatório!')
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
      <div>
        <h1 className="text-2xl font-bold text-[#0A3D78]">Relatórios</h1>
        <p className="text-[#5E6C84] text-sm">
          Todos os relatórios gerados pela plataforma
        </p>
      </div>

      {/* Busca */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5E6C84]" />
        <Input
          placeholder="Buscar relatórios..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Lista de Relatórios */}
      {filteredRelatorios.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="w-12 h-12 text-[#D7DEE8] mx-auto mb-4" />
            <p className="text-[#5E6C84]">
              {relatorios.length === 0
                ? 'Nenhum relatório gerado ainda.'
                : 'Nenhum relatório encontrado com esse filtro.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRelatorios.map((rel) => (
            <Card key={rel.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <span className={`text-xs px-2 py-0.5 rounded-full text-white ${getTipoColor(rel.tipo)}`}>
                      {getTipoLabel(rel.tipo)}
                    </span>
                    {rel.tipo === 'CTI_COMPLETO' && (
                      <span className="ml-1 text-xs text-indigo-500">🧠 Knowledge Hub™</span>
                    )}
                    <CardTitle className="text-[#0A3D78] text-base mt-2">
                      {rel.titulo}
                    </CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-[#5E6C84]">
                  <Building2 className="w-4 h-4" />
                  <span>{rel.projetos_diagnostico?.empresas?.nome || '—'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-[#5E6C84]">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(rel.created_at).toLocaleDateString('pt-BR')}</span>
                </div>
                <div className="flex gap-2 pt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleVisualizar(rel)}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Visualizar
                  </Button>
                  {isAdmin && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleDelete(rel.id, rel.titulo)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                <Link
                  href={`/diagnosticos/${rel.projeto_id}`}
                  className="block text-center text-xs text-[#0F5FA8] hover:underline"
                >
                  Ver diagnóstico completo →
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
