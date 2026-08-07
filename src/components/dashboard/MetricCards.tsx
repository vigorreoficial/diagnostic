'use client'

import { FileText, ClipboardList, TrendingUp } from 'lucide-react'

interface MetricCardsProps {
  metrics: {
    emAndamento: number
    relatoriosGerados: number
    imvMedio: number
  }
}

export default function MetricCards({ metrics }: MetricCardsProps) {
  const items = [
    {
      label: 'Diagnósticos em andamento',
      value: metrics.emAndamento,
      icon: ClipboardList,
      color: 'text-[#0F5FA8]',
      bg: 'bg-[#EAF3FC]'
    },
    {
      label: 'Relatórios gerados',
      value: metrics.relatoriosGerados,
      icon: FileText,
      color: 'text-[#4D90D9]',
      bg: 'bg-blue-50'
    },
    {
      label: 'IMV™ Médio dos clientes',
      value: metrics.imvMedio + '%',
      icon: TrendingUp,
      color: 'text-[#0A3D78]',
      bg: 'bg-[#EAF3FC]'
    }
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 max-w-3xl">
      {items.map((item) => (
        <div 
          key={item.label} 
          className="bg-white rounded-lg p-4 text-center shadow-sm border border-[#D7DEE8]"
        >
          <div className={`w-10 h-10 rounded-lg ${item.bg} flex items-center justify-center mx-auto mb-2`}>
            <item.icon className={`w-5 h-5 ${item.color}`} />
          </div>
          <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
          <p className="text-sm text-[#5E6C84]">{item.label}</p>
        </div>
      ))}
    </div>
  )
}
