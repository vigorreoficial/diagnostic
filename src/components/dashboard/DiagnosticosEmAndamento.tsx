'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChevronRight, Calendar, User } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function DiagnosticosEmAndamento() {
  const supabase = createClient()
  const [diagnosticos, setDiagnosticos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDiagnosticos = async () => {
      const { data } = await supabase
        .from('projetos_diagnostico')
        .select(`
          *,
          empresas (nome),
          usuarios (nome)
        `)
        .order('created_at', { ascending: false })
        .limit(3)

      setDiagnosticos(data || [])
      setLoading(false)
    }

    fetchDiagnosticos()
  }, [supabase])

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'CADASTRO': 'bg-gray-400',
      'PLANEJAMENTO': 'bg-blue-400',
      'COLETA': 'bg-yellow-400',
      'ANALISE': 'bg-purple-400',
      'REVISAO': 'bg-orange-400',
      'PREDICAO': 'bg-indigo-400',
      'ENTREGA': 'bg-green-400',
      'MONITORAMENTO': 'bg-teal-400',
    }
    return colors[status] || 'bg-gray-400'
  }

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

  const getStatusProgress = (status: string) => {
    const progress: Record<string, number> = {
      'CADASTRO': 0,
      'PLANEJAMENTO': 15,
      'COLETA': 40,
      'ANALISE': 60,
      'REVISAO': 75,
      'PREDICAO': 85,
      'ENTREGA': 95,
      'MONITORAMENTO': 100,
    }
    return progress[status] || 0
  }

  return (
    <section className="mb-6">
      <h2 className="text-lg font-semibold text-[#0A3D78] mb-4">
        Diagnósticos em andamento
      </h2>
      
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0F5FA8]"></div>
        </div>
      ) : diagnosticos.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-[#5E6C84]">
              Nenhum diagnóstico em andamento.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {diagnosticos.map((diag) => (
            <Card key={diag.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start gap-3">
                      <div className={`mt-1 w-2 h-2 rounded-full ${getStatusColor(diag.status)}`} />
                      <div>
                        <h3 className="font-semibold text-[#0A3D78]">
                          {diag.titulo || 'Diagnóstico sem título'}
                        </h3>
                        <p className="text-sm text-[#5E6C84]">
                          {diag.empresas?.nome || 'Empresa não identificada'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-[#5E6C84]">
                      <span className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {diag.usuarios?.nome || 'Não atribuído'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {diag.created_at ? new Date(diag.created_at).toLocaleDateString('pt-BR') : '—'}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium text-white bg-[#5E6C84]">
                        {getStatusLabel(diag.status)}
                      </span>
                    </div>

                    <div className="mt-3">
                      <div className="w-full bg-[#F7F8FA] rounded-full h-2">
                        <div
                          className="bg-[#0F5FA8] h-2 rounded-full transition-all"
                          style={{ width: `${getStatusProgress(diag.status)}%` }}
                        />
                      </div>
                      <p className="text-xs text-[#5E6C84] mt-1">
                        {getStatusProgress(diag.status)}% concluído
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      Continuar
                    </Button>
                    <Button size="sm" className="bg-[#0F5FA8] hover:bg-[#0A3D78]">
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  )
}
