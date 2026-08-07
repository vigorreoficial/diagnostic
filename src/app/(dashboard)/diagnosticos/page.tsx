'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, ClipboardList, Calendar, User, ChevronRight } from 'lucide-react'

export default function DiagnosticosPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [diagnosticos, setDiagnosticos] = useState<any[]>([])

  useEffect(() => {
    const fetchDiagnosticos = async () => {
      const { data } = await supabase
        .from('projetos_diagnostico')
        .select(`
          *,
          empresas (nome, cnpj),
          usuarios (nome)
        `)
        .order('created_at', { ascending: false })
      
      setDiagnosticos(data || [])
      setLoading(false)
    }

    fetchDiagnosticos()
  }, [supabase])

  const getStatusColor = (status: string) => {
    const colors = {
      'CADASTRO': 'bg-gray-400',
      'PLANEJAMENTO': 'bg-blue-400',
      'COLETA': 'bg-yellow-400',
      'ANALISE': 'bg-purple-400',
      'REVISAO': 'bg-orange-400',
      'PREDICAO': 'bg-indigo-400',
      'ENTREGA': 'bg-green-400',
      'MONITORAMENTO': 'bg-teal-400',
    }
    return colors[status as keyof typeof colors] || 'bg-gray-400'
  }

  const getStatusLabel = (status: string) => {
    const labels = {
      'CADASTRO': 'Cadastro',
      'PLANEJAMENTO': 'Planejamento',
      'COLETA': 'Coleta de dados',
      'ANALISE': 'Análise',
      'REVISAO': 'Revisão',
      'PREDICAO': 'Predição',
      'ENTREGA': 'Entrega',
      'MONITORAMENTO': 'Monitoramento',
    }
    return labels[status as keyof typeof labels] || status
  }

  const getStatusProgress = (status: string) => {
    const progress = {
      'CADASTRO': 0,
      'PLANEJAMENTO': 15,
      'COLETA': 40,
      'ANALISE': 60,
      'REVISAO': 75,
      'PREDICAO': 85,
      'ENTREGA': 95,
      'MONITORAMENTO': 100,
    }
    return progress[status as keyof typeof progress] || 0
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-vigorre-secondary">
            Diagnósticos
          </h1>
          <p className="text-vigorre-gray-dark">
            Acompanhe todos os diagnósticos em andamento e concluídos
          </p>
        </div>
        <Button className="bg-vigorre-primary hover:bg-vigorre-secondary">
          <Plus className="w-4 h-4 mr-2" />
          Novo Diagnóstico
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-vigorre-primary"></div>
        </div>
      ) : diagnosticos.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ClipboardList className="w-12 h-12 text-vigorre-gray-medium mx-auto mb-4" />
            <p className="text-vigorre-gray-dark">
              Nenhum diagnóstico iniciado ainda.
            </p>
            <Button className="mt-4 bg-vigorre-primary hover:bg-vigorre-secondary">
              <Plus className="w-4 h-4 mr-2" />
              Iniciar primeiro diagnóstico
            </Button>
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
                        <h3 className="font-semibold text-vigorre-secondary">
                          {diag.titulo}
                        </h3>
                        <p className="text-sm text-vigorre-gray-dark">
                          {diag.empresas?.nome || 'Empresa não identificada'}
                          {diag.empresas?.cnpj && ` • CNPJ: ${diag.empresas.cnpj}`}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-vigorre-gray-dark">
                      <span className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {diag.usuarios?.nome || 'Não atribuído'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(diag.created_at).toLocaleDateString('pt-BR')}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium text-white bg-vigorre-gray-dark">
                        {getStatusLabel(diag.status)}
                      </span>
                    </div>

                    {/* Barra de progresso */}
                    <div className="mt-4">
                      <div className="w-full bg-vigorre-gray-light rounded-full h-2">
                        <div
                          className="bg-vigorre-primary h-2 rounded-full transition-all"
                          style={{ width: `${getStatusProgress(diag.status)}%` }}
                        />
                      </div>
                      <p className="text-xs text-vigorre-gray-dark mt-1">
                        {getStatusProgress(diag.status)}% concluído
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      Continuar
                    </Button>
                    <Button size="sm" className="bg-vigorre-primary hover:bg-vigorre-secondary">
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
