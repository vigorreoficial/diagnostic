interface MetricCardsProps {
  metrics: {
    emAndamento: number
    relatoriosGerados: number
    imvMedio: number
  }
}

export function MetricCards({ metrics }: MetricCardsProps) {
  const items = [
    {
      label: 'Diagnósticos em andamento',
      value: metrics.emAndamento,
      color: 'text-vigorre-primary'
    },
    {
      label: 'Relatórios gerados',
      value: metrics.relatoriosGerados,
      color: 'text-vigorre-light'
    },
    {
      label: 'IMV™ Médio dos clientes',
      value: metrics.imvMedio + '%',
      color: 'text-vigorre-secondary'
    }
  ]

  return (
    <div className="grid grid-cols-3 gap-4 mt-6 max-w-2xl">
      {items.map((item) => (
        <div key={item.label} className="bg-white rounded-lg p-4 text-center shadow-sm border border-vigorre-gray-medium">
          <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
          <p className="text-sm text-vigorre-gray-dark">{item.label}</p>
        </div>
      ))}
    </div>
  )
}
