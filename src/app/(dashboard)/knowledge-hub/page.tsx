import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BookOpen } from 'lucide-react'

export default function KnowledgeHubPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#0A3D78] flex items-center gap-2">
        <BookOpen className="w-6 h-6" />
        Knowledge Hub™
      </h1>
      <Card>
        <CardHeader>
          <CardTitle>Base de Conhecimento Viva</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-[#5E6C84]">Em breve: legislação, normas, convenções coletivas e benchmarks.</p>
        </CardContent>
      </Card>
    </div>
  )
}
