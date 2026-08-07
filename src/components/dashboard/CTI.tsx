'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Brain, Zap, Shield, TrendingUp, Award } from 'lucide-react'

export function CTI() {
  const especialistas = [
    { nome: 'Estrategista Sistêmico', area: 'Estratégia', icon: Brain },
    { nome: 'Especialista em RH', area: 'Recursos Humanos', icon: Users },
    { nome: 'Especialista em DP', area: 'Depto. Pessoal', icon: Users },
    { nome: 'Jurista Trabalhista', area: 'Jurídico', icon: Shield },
    { nome: 'Especialista em SST', area: 'Saúde e Segurança', icon: Shield },
    { nome: 'Nutricionista Clínico', area: 'Nutrição', icon: Award },
    { nome: 'Especialista em Finanças', area: 'Financeiro', icon: TrendingUp },
    { nome: 'Especialista em Qualidade', area: 'Qualidade', icon: Award },
    { nome: 'Especialista Lean/6σ', area: 'Melhoria Contínua', icon: Zap },
    { nome: 'Especialista em Operações', area: 'Operações', icon: Brain },
    { nome: 'Especialista em TI', area: 'Tecnologia', icon: Brain },
    { nome: 'Especialista em Agro', area: 'Agronegócio', icon: Award },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-[#0A3D78] flex items-center gap-2">
          <Brain className="w-5 h-5" />
          CTI™ - Corpo Técnico Inteligente
        </CardTitle>
        <p className="text-sm text-[#5E6C84]">
          15 especialistas virtuais em rede
        </p>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2 mb-4">
          {especialistas.slice(0, 6).map((esp, index) => (
            <span 
              key={index}
              className="px-3 py-1 bg-[#EAF3FC] text-[#0F5FA8] rounded-full text-xs font-medium"
            >
              {esp.nome}
            </span>
          ))}
          <span className="px-3 py-1 bg-[#0F5FA8] text-white rounded-full text-xs font-medium">
            +{especialistas.length - 6} especialistas
          </span>
        </div>
        <div className="p-4 bg-[#EAF3FC] rounded-lg">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-[#0F5FA8] flex items-center justify-center flex-shrink-0">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-[#1C1F26]">
                Motor de Consenso
              </p>
              <p className="text-xs text-[#5E6C84]">
                Coleta pareceres, identifica convergências e gera recomendação consolidada
              </p>
            </div>
          </div>
        </div>
        <button className="mt-4 text-sm text-[#0F5FA8] font-medium hover:underline">
          Consultar CTI™ para um diagnóstico →
        </button>
      </CardContent>
    </Card>
  )
}
