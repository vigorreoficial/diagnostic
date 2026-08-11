'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  ArrowLeft, 
  Building2, 
  Users, 
  Calendar, 
  Pencil,
  FileText,
  Loader2
} from 'lucide-react'
import { toast } from 'sonner'

export default function DetalhesClientePage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [cliente, setCliente] = useState<any>(null)
  const [diagnosticos, setDiagnosticos] = useState<any[]>([])
  const [userData, setUserData] = useState<any>(null)

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

        // Buscar cliente
        const { data: clienteData, error: clienteError } = await supabase
          .from('empresas')
          .select('*')
          .eq('id', id)
          .single()

        if (clienteError) {
          toast.error('Cliente não encontrado')
          router.push('/clientes')
          return
        }

        setCliente(clienteData)

        // Buscar diagnósticos do cliente
        const { data: diagData } = await supabase
          .from('projetos_diagnostico')
          .select('*')
          .eq('empresa_id', id)
          .order('created_at', { ascending: false })

        setDiagnosticos(diagData || [])
      } catch (error) {
        toast.error('Erro ao carregar dados')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [params.id, supabase, router])

  const isAdmin = userData?.perfil === 'ADMIN'
  const isConsultor = userData?.perfil === 'CONSULTOR'

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'CADASTRO': 'Cadastro',
      'PLANEJAMENTO': 'Planejamento',
      'COLETA': 'Coleta de dados',
      'ANALISE': 'Análise',
      'REVISAO': 'Revisão',
      'PREDICAO': 'Predição',
      'ENTREGA': 'Entrega',
      'MONITORAMENTO': 'Monitoramento',
    }
    return labels[status] || status
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#0F5FA8]" />
      </div>
    )
  }

  if (!cliente) {
    return (
      <div className="text-center py-12">
        <p className="text-[#5E6C84]">Cliente não encontrado</p>
        <Button className="mt-4" onClick={() => router.push('/clientes')}>
          Voltar para clientes
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
            <h1 className="text-2xl font-bold text-[#0A3D78]">
              {cliente.nome}
            </h1>
            {cliente.nome_fantasia && (
              <p className="text-[#5E6C84]">{cliente.nome_fantasia}</p>
            )}
          </div>
        </div>
        {isAdmin && (
          <Link href={`/clientes/${cliente.id}/editar`}>
            <Button variant="outline">
              <Pencil className="w-4 h-4 mr-2" />
              Editar
            </Button>
          </Link>
        )}
      </div>

      {/* Informações do Cliente */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-[#0A3D78]">Dados da Empresa</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Building2 className="w-4 h-4 text-[#5E6C84]" />
              <span className="text-[#5E6C84]">CNPJ:</span>
              <span className="text-[#1C1F26] font-medium">{cliente.cnpj || '—'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Users className="w-4 h-4 text-[#5E6C84]" />
              <span className="text-[#5E6C84]">Porte:</span>
              <span className="text-[#1C1F26] font-medium">{cliente.porte || '—'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Building2 className="w-4 h-4 text-[#5E6C84]" />
              <span className="text-[#5E6C84]">Segmento:</span>
              <span className="text-[#1C1F26] font-medium">{cliente.segmento || '—'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Users className="w-4 h-4 text-[#5E6C84]" />
              <span className="text-[#5E6C84]">Funcionários:</span>
              <span className="text-[#1C1F26] font-medium">{cliente.numero_funcionarios || '—'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-[#5E6C84]" />
              <span className="text-[#5E6C84]">Cadastro:</span>
              <span className="text-[#1C1F26] font-medium">
                {cliente.created_at ? new Date(cliente.created_at).toLocaleDateString('pt-BR') : '—'}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Diagnósticos */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-[#0A3D78]">Diagnósticos</CardTitle>
            {isAdmin && (
              <Link href={`/diagnosticos/novo?empresa=${cliente.id}`}>
                <Button size="sm" className="bg-[#0F5FA8] hover:bg-[#0A3D78]">
                  <FileText className="w-4 h-4 mr-1" />
                  Novo
                </Button>
              </Link>
            )}
          </CardHeader>
          <CardContent>
            {diagnosticos.length === 0 ? (
              <p className="text-[#5E6C84] text-center py-6">
                Nenhum diagnóstico encontrado.
              </p>
            ) : (
              <div className="space-y-3">
                {diagnosticos.slice(0, 5).map((diag) => (
                  <Link
                    key={diag.id}
                    href={`/diagnosticos/${diag.id}`}
                    className="block p-3 border border-[#D7DEE8] rounded-lg hover:border-[#0F5FA8] transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-[#1C1F26] text-sm">
                          {diag.titulo || 'Diagnóstico sem título'}
                        </p>
                        <p className="text-xs text-[#5E6C84]">
                          {getStatusLabel(diag.status)}
                        </p>
                      </div>
                      <span className="text-xs text-[#5E6C84]">
                        {diag.created_at ? new Date(diag.created_at).toLocaleDateString('pt-BR') : ''}
                      </span>
                    </div>
                  </Link>
                ))}
                {diagnosticos.length > 5 && (
                  <p className="text-xs text-[#5E6C84] text-center">
                    + {diagnosticos.length - 5} diagnósticos
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
