import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText } from 'lucide-react'

export default function RelatoriosPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#0A3D78] flex items-center gap-2">
        <FileText className="w-6 h-6" />
        Relatórios
      </h1>
      <Card>
        <CardHeader>
          <CardTitle>Relatórios Gerados</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-[#5E6C84]">Os relatórios dos diagnósticos aparecerão aqui.</p>
        </CardContent>
      </Card>
    </div>
  )
}
