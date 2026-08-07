interface HeroProps {
  user: any
  metrics: {
    emAndamento: number
    relatoriosGerados: number
    imvMedio: number
  }
}

export function Hero({ user, metrics }: HeroProps) {
  const nome = user?.user_metadata?.nome || user?.email?.split('@')[0] || 'Consultor'

  return (
    <section className="bg-vigorre-very-light rounded-2xl p-6 md:p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-vigorre-secondary">
            Bem-vindo(a), {nome}!
          </h1>
          <p className="text-vigorre-gray-dark mt-1">
            Vigorre Diagnostics™ 3.0 "QUANTUM" está pronto para uso.
          </p>
        </div>
        <div className="flex gap-3">
          <button className="bg-vigorre-primary text-white px-6 py-2 rounded-lg font-medium hover:bg-vigorre-secondary transition-colors text-sm">
            + Novo Diagnóstico
          </button>
          <button className="border border-vigorre-gray-medium text-vigorre-dark px-6 py-2 rounded-lg font-medium hover:bg-vigorre-very-light transition-colors text-sm">
            Ver todos
          </button>
        </div>
      </div>
      <MetricCards metrics={metrics} />
    </section>
  )
}
