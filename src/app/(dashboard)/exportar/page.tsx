'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Download, FileSpreadsheet, Shield, CheckCircle, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import * as XLSX from 'xlsx'

export default function ExportarPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [userData, setUserData] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [diagnosticos, setDiagnosticos] = useState<any[]>([])
  const [selectedDiagnostico, setSelectedDiagnostico] = useState<string>('todos')
  const [formato, setFormato] = useState<'excel' | 'csv'>('excel')

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
        }

        const { data: diagData } = await supabase
          .from('projetos_diagnostico')
          .select('*, empresas(nome)')
          .order('created_at', { ascending: false })

        setDiagnosticos(diagData || [])
      } catch (error) {
        toast.error('Erro ao carregar dados')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [supabase])

  const handleExport = async () => {
    setExporting(true)

    try {
      let dados: any[] = []

      if (selectedDiagnostico === 'todos') {
        // Buscar todos os diagnósticos com dados completos
        const { data: diagData } = await supabase
          .from('projetos_diagnostico')
          .select(`
            *,
            empresas (id, nome, cnpj, porte, segmento),
            usuarios (id, nome, perfil)
          `)
          .order('created_at', { ascending: false })

        // Buscar módulos para cada diagnóstico
        for (const diag of diagData || []) {
          const { data: modulosData } = await supabase
            .from('modulos_diagnostico')
            .select('*')
            .eq('projeto_id', diag.id)

          // Buscar respostas
          const { data: respostasData } = await supabase
            .from('perguntas_respondidas')
            .select('*')
            .in('modulo_id', modulosData?.map(m => m.id) || [])

          dados.push({
            'ID': diag.id,
            'Título': diag.titulo,
            'Empresa': diag.empresas?.nome || '',
            'CNPJ': diag.empresas?.cnpj || '',
            'Status': diag.status,
            'Responsável': diag.usuarios?.nome || '',
            'Data Criação': new Date(diag.created_at).toLocaleDateString('pt-BR'),
            'Módulos': modulosData?.length || 0,
            'Respostas': respostasData?.length || 0,
          })
        }
      } else {
        // Buscar diagnóstico específico
        const { data: diagData } = await supabase
          .from('projetos_diagnostico')
          .select(`
            *,
            empresas (id, nome, cnpj, porte, segmento),
            usuarios (id, nome, perfil)
          `)
          .eq('id', selectedDiagnostico)
          .single()

        if (diagData) {
          const { data: modulosData } = await supabase
            .from('modulos_diagnostico')
            .select('*')
            .eq('projeto_id', diagData.id)

          // Buscar respostas com perguntas
          const moduloIds = modulosData?.map(m => m.id) || []
          let respostasData: any[] = []
          if (moduloIds.length > 0) {
            const { data } = await supabase
              .from('perguntas_respondidas')
              .select(`
                *,
                perguntas (pergunta, modulo_area, tipo, peso)
              `)
              .in('modulo_id', moduloIds)
            respostasData = data || []
          }

          // Dados principais
          dados.push({
            'ID': diagData.id,
            'Título': diagData.titulo,
            'Empresa': diagData.empresas?.nome || '',
            'CNPJ': diagData.empresas?.cnpj || '',
            'Porte': diagData.empresas?.porte || '',
            'Segmento': diagData.empresas?.segmento || '',
            'Status': diagData.status,
            'Responsável': diagData.usuarios?.nome || '',
            'Data Criação': new Date(diagData.created_at).toLocaleDateString('pt-BR'),
            'Total Módulos': modulosData?.length || 0,
            'Total Respostas': respostasData.length,
          })

          // Adicionar detalhes das respostas
          respostasData.forEach((r, index) => {
            const perguntaKey = 'Pergunta ' + (index + 1)
            dados.push({
              [perguntaKey]: r.perguntas?.pergunta || '',
              'Modulo': r.perguntas?.modulo_area || '',
              'Tipo': r.perguntas?.tipo || '',
              'Resposta': typeof r.resposta === 'object' ? JSON.stringify(r.resposta) : r.resposta,
              'Observacao': r.observacao || '',
            })
          })
        }
      }

      if (dados.length === 0) {
        toast.error('Nenhum dado encontrado para exportar')
        setExporting(false)
        return
      }

      // Criar worksheet
      const ws = XLSX.utils.json_to_sheet(dados)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Dados')

      // Gerar arquivo
      if (formato === 'excel') {
        const fileName = 'diagnosticos_' + new Date().toISOString().slice(0, 10) + '.xlsx'
        XLSX.writeFile(wb, fileName)
        toast.success('Arquivo ' + fileName + ' baixado com sucesso!')
      } else {
        const fileName = 'diagnosticos_' + new Date().toISOString().slice(0, 10) + '.csv'
        const csv = XLSX.utils.sheet_to_csv(ws)
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = fileName
        link.click()
        toast.success('Arquivo ' + fileName + ' baixado com sucesso!')
      }
    } catch (error) {
      toast.error('Erro ao exportar dados')
      console.error(error)
    } finally {
      setExporting(false)
    }
  }

  if (!isAdmin && !loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Card className="max-w-md">
          <CardContent className="py-12 text-center">
            <Shield className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <p className="text-[#1C1F26] font-medium">Acesso Negado</p>
            <p className="text-[#5E6C84] text-sm">
              Apenas administradores podem exportar dados.
            </p>
          </CardContent>
        </Card>
      </div>
    )
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
      <div>
        <h1 className="text-2xl font-bold text-[#0A3D78] flex items-center gap-2">
          <FileSpreadsheet className="w-6 h-6" />
          Exportar Dados
        </h1>
        <p className="text-[#5E6C84] text-sm">
          Exporte dados de diagnósticos para análise externa
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-[#0A3D78]">Configurações de Exportação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Diagnóstico</Label>
              <Select value={selectedDiagnostico} onValueChange={setSelectedDiagnostico}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um diagnóstico" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os diagnósticos</SelectItem>
                  {diagnosticos.map((diag) => (
                    <SelectItem key={diag.id} value={diag.id}>
                      {diag.titulo} - {diag.empresas?.nome || ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Formato</Label>
              <Select value={formato} onValueChange={(v) => setFormato(v as 'excel' | 'csv')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="excel">Excel (.xlsx)</SelectItem>
                  <SelectItem value="csv">CSV (.csv)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <Button
              className="flex-1 bg-[#0F5FA8] hover:bg-[#0A3D78]"
              onClick={handleExport}
              disabled={exporting || diagnosticos.length === 0}
            >
              {exporting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Exportando...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Exportar Dados
                </>
              )}
            </Button>
          </div>

          {diagnosticos.length === 0 && (
            <div className="flex items-center gap-2 p-3 bg-yellow-50 rounded-lg">
              <AlertCircle className="w-5 h-5 text-yellow-500" />
              <span className="text-sm text-yellow-700">
                Nenhum diagnóstico disponível para exportar.
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-[#0A3D78]">Informações</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span>Dados exportados em formato estruturado</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span>Compatível com Excel, Google Sheets e outras planilhas</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span>Inclui dados de diagnósticos, módulos e respostas</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
