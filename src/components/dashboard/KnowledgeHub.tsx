'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BookOpen, FileText, TrendingUp, Shield, Clock } from 'lucide-react'

export function KnowledgeHub() {
  const atualizacoes = [
    { 
      titulo: 'Nova convenção coletiva', 
      descricao: 'Metalúrgicos SP - 2026',
      icon: FileText,
      cor: 'text-[#0F5FA8]'
    },
    { 
      titulo: 'Atualização NR-18', 
      descricao: 'Construção Civil - 2026',
      icon: Shield,
      cor: 'text-[#4D90D9]'
    },
    { 
      titulo: 'Benchmark de Qualidade', 
      descricao: '2º Trimestre 2026',
      icon: TrendingUp,
      cor: 'text-[#0A3D78]'
    },
    { 
      titulo: 'Estudo de caso', 
      descricao: 'Diagnóstico Agropecuário - Fazenda XYZ',
      icon: BookOpen,
      cor: 'text-[#0F5FA8]'
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-[#0A3D78] flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          Knowledge Hub™
        </CardTitle>
        <p className="text-sm text-[#5E6C84]">
          Base de conhecimento viva e atualizada
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {atualizacoes.map((item, index) => (
            <div 
              key={index}
              className="flex items-start gap-3 p-3 rounded-lg bg-[#F7F8FA] hover:bg-[#EAF3FC] transition-colors"
            >
              <item.icon className={`w-5 h-5 ${item.cor} flex-shrink-0 mt-0.5`} />
              <div className="flex-1">
                <p className="text-sm font-medium text-[#1C1F26]">{item.titulo}</p>
                <p className="text-xs text-[#5E6C84]">{item.descricao}</p>
              </div>
              <Clock className="w-4 h-4 text-[#D7DEE8] flex-shrink-0" />
            </div>
          ))}
        </div>
        <button className="mt-4 text-sm text-[#0F5FA8] font-medium hover:underline">
          Acessar Knowledge Hub™ →
        </button>
      </CardContent>
    </Card>
  )
}
