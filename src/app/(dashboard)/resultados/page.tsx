// src/app/(dashboard)/resultados/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { geradorRelatorioPremium } from '@/lib/diagnostico/relatorio-premium'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, TrendingUp, TrendingDown, Shield, Award, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import { toast } from 'sonner'

export default function ResultadosPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [projetos, setProjetos] = useState<any[]>([])
  const [projetoSelecionado, setProjetoSelecionado] = useState<string>('')
  const [resultados, setResultados] = useState<any>(null)
  const [userData, setUserData] = useState<any>(null)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)

      try {
        // 1. Buscar usuário logado
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          // ✅ CORREÇÃO: usar 'user_id' (nome real da coluna)
          const { data } = await supabase
            .from('usuarios')
            .select('*')
            .eq('user_id', user.id) // ✅ Nome correto: user_id (não auth_user_id)
            .single()
          setUserData(data)
        }

        // 2. Buscar projetos concluídos do usuário
        // ✅ Filtra por responsavel_id (nome real da coluna em projetos_diagnostico)
        const { data: projetosData } = await supabase
          .from('projetos_diagnostico')
          .select(`
            *,
            empresas (nome)
          `)
          .eq('responsavel_id', userData?.id) // ✅ Filtra pelos projetos do usuário
          .eq('status', 'ENTREGA')
          .order('created_at', { ascending: false })

        setProjetos(projetosData || [])

        if (projetosData && projetosData.length > 0) {
          setProjetoSelecionado(projetosData[0].id)
          await carregarResultados(projetosData[0].id)
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error)
        toast.error('Erro ao carregar dados')
      } finally {
        setLoading(false)
      }
    }

    // Só executa se userData estiver disponível (após login)
    if (userData || !loading) {
      fetchData()
    }
  }, [supabase, userData, loading])

  const carregarResultados = async (projetoId: string) => {
    setLoading(true)
    try {
      const relatorio = await geradorRelatorioPremium.gerarRelatorio(projetoId)
      setResultados(relatorio)
    } catch (error) {
      console.error('Erro ao gerar relatório:', error)
      toast.error('Erro ao carregar resultados')
    } finally {
      setLoading(false)
    }
  }

  const getNivelCor = (valor: number) => {
    if (valor >= 80) return 'text-green-500'
    if (valor >= 60) return 'text-blue-500'
    if (valor >= 40) return 'text-yellow-500'
    return 'text-red-500'
  }

  const getNivelBg = (valor: number) => {
    if (valor >= 80) return 'bg-green-500'
    if (valor >= 60) return 'bg-blue-500'
    if (valor >= 40) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#0F5FA8]" />
      </div>
    )
  }

  if (!resultados) {
    return (
      <div className="text-center py-12">
        <p className="text-[#5E6C84]">Nenhum resultado disponível.</p>
        <Button className="mt-4" onClick={() => router.push('/diagnosticos')}>
          Ir para diagnósticos
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0A3D78]">Resultados do Diagnóstico</h1>
          <p className="text-[#5E6C84] text-sm">
            {resultados.empresa} - {new Date(resultados.data).toLocaleDateString('pt-BR')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.print()}>
            Imprimir
          </Button>
          <Button className="bg-[#0F5FA8] hover:bg-[#0A3D78]">
            Baixar PDF
          </Button>
        </div>
      </div>

      {/* Cards de Índices */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-[#5E6C84] font-medium">IMV™ Total</p>
            <p className="text-3xl font-bold text-[#0F5FA8]">{resultados.imv}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-[#5E6C84] font-medium">Maturidade</p>
            <p className={`text-3xl font-bold ${getNivelCor(resultados.maturidade)}`}>
              {resultados.maturidade}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-[#5E6C84] font-medium">Conformidade</p>
            <p className={`text-3xl font-bold ${getNivelCor(resultados.conformidade)}`}>
              {resultados.conformidade}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-[#5E6C84] font-medium">Risco</p>
            <p className={`text-3xl font-bold ${getNivelCor(100 - resultados.risco)}`}>
              {resultados.risco}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-[#5E6C84] font-medium">Confiabilidade</p>
            <p className="text-3xl font-bold text-[#0A3D78]">
              {Math.round(resultados.confianca * 100)}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Resumo Executivo */}
      <Card>
        <CardHeader>
          <CardTitle className="text-[#0A3D78]">📋 Resumo Executivo</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-[#1C1F26]">{resultados.resumo}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <p className="font-medium text-green-600 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Pontos Fortes
              </p>
              <ul className="mt-2 space-y-1">
                {resultados.pontos_fortes?.slice(0, 5).map((pf: string, i: number) => (
                  <li key={i} className="text-sm text-[#5E6C84]">{pf}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-medium text-red-600 flex items-center gap-2">
                <XCircle className="w-4 h-4" />
                Pontos de Atenção
              </p>
              <ul className="mt-2 space-y-1">
                {resultados.lacunas?.slice(0, 5).map((l: string, i: number) => (
                  <li key={i} className="text-sm text-[#5E6C84]">{l}</li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Prioridades */}
      {resultados.prioridades && resultados.prioridades.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-[#0A3D78] flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Prioridades Críticas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {resultados.prioridades.map((p: any, i: number) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-[#F7F8FA] rounded-lg">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${
                    p.impacto === 'CRITICO' ? 'bg-red-500' :
                    p.impacto === 'ALTO' ? 'bg-orange-500' :
                    p.impacto === 'MEDIO' ? 'bg-yellow-500' : 'bg-blue-500'
                  }`}>
                    {p.impacto}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-[#1C1F26]">{p.modulo}</p>
                    <p className="text-sm text-[#5E6C84]">{p.recomendacao}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
