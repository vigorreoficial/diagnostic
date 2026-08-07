'use client'

import MetricCards from './MetricCards'

interface HeroProps {
  user?: any
  metrics?: {
    emAndamento: number
    relatoriosGerados: number
    imvMedio: number
  }
}

export function Hero({ user, metrics = { emAndamento: 0, relatoriosGerados: 0, imvMedio: 0 } }: HeroProps) {
  const nome = user?.user_metadata?.nome || user?.email?.split('@')[0] || 'Consultor'

  return (
    <section className="bg-[#EAF3FC] rounded-2xl p-6 md:p-8 mb-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#0A3D78]">
            Bem-vindo(a), {nome}!
          </h1>
          <p className="text-[#5E6C84] mt-1">
            Vigorre Diagnostics™ 3.0 "QUANTUM" está pronto para uso.
          </p>
        </div>
        <div className="flex gap-3">
          <button className="bg-[#0F5FA8] text-white px-6 py-2 rounded-lg font-medium hover:bg-[#0A3D78] transition-colors text-sm">
            + Novo Diagnóstico
          </button>
          <button className="border border-[#D7DEE8] text-[#1C1F26] px-6 py-2 rounded-lg font-medium hover:bg-[#EAF3FC] transition-colors text-sm">
            Ver todos
          </button>
        </div>
      </div>
      <MetricCards metrics={metrics} />
    </section>
  )
}
