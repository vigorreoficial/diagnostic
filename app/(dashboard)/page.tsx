'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Hero } from '@/components/dashboard/Hero'
import { QuickActions } from '@/components/dashboard/QuickActions'
import { DiagnosticosEmAndamento } from '@/components/dashboard/DiagnosticosEmAndamento'
import { MetricCards } from '@/components/dashboard/MetricCards'

export default function DashboardPage() {
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)
  const [diagnosticos, setDiagnosticos] = useState([])
  const [metrics, setMetrics] = useState({
    emAndamento: 0,
    relatoriosGerados: 0,
    imvMedio: 0,
  })

  useEffect(() => {
    const fetchData = async () => {
      // Buscar usuário
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      // Buscar diagnósticos em andamento
      const { data: diagnosticosData } = await supabase
        .from('projetos_diagnostico')
        .select('*')
        .eq('status', 'COLETA')
        .limit(5)

      setDiagnosticos(diagnosticosData || [])

      // Buscar métricas
      // (Implementar com consultas reais depois)
      setMetrics({
        emAndamento: diagnosticosData?.length || 0,
        relatoriosGerados: 12,
        imvMedio: 87,
      })
    }

    fetchData()
  }, [supabase])

  return (
    <div className="space-y-8">
      <Hero user={user} metrics={metrics} />
      <QuickActions />
      <DiagnosticosEmAndamento diagnosticos={diagnosticos} />
    </div>
  )
}
