import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3 } from 'lucide-react'

export default function AnalisesPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#0A3D78] flex items-center gap-2">
        <BarChart3 className="w-6 h-6" />
        Análises e Indicadores
      </h1>
      <Card>
        <CardHeader>
          <CardTitle>Métricas e Indicadores</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-[#5E6C84]">Em breve: gráficos, métricas e indicadores de desempenho.</p>
        </CardContent>
      </Card>
    </div>
  )
}
