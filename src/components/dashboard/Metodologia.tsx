'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowRight, Target, ClipboardCheck, Brain, BarChart3, TrendingUp, FileText } from 'lucide-react'

export function Metodologia() {
  const fases = [
    { 
      numero: 1, 
      nome: 'PRÉ-DIAGNÓSTICO', 
      descricao: 'Coleta de dados básicos',
      icon: Target,
      cor: 'border-[#0F5FA8]'
    },
    { 
      numero: 2, 
      nome: 'DIAGNÓSTICO ESTRUTURADO', 
      descricao: 'Questionários e entrevistas',
      icon: ClipboardCheck,
      cor: 'border-[#4D90D9]'
    },
    { 
      numero: 3, 
      nome: 'VALIDAÇÃO TÉCNICA', 
      descricao: 'Revisão de evidências',
      icon: Brain,
      cor: 'border-[#0A3D78]'
    },
    { 
      numero: 4, 
      nome: 'ANÁLISE INTELIGENTE', 
      descricao: 'IA + CTI™ emitem pareceres',
      icon: Brain,
      cor: 'border-[#0F5FA8]'
    },
    { 
      numero: 5, 
      nome: 'CONSOLIDAÇÃO', 
      descricao: 'Cálculo do IMV™',
      icon: BarChart3,
      cor: 'border-[#4D90D9]'
    },
    { 
      numero: 6, 
      nome: 'PREDIÇÃO', 
      descricao: 'Projeção de evolução',
      icon: TrendingUp,
      cor: 'border-[#0A3D78]'
    },
    { 
      numero: 7, 
      nome: 'ENTREGA', 
      descricao: 'Relatórios e plano de ação',
      icon: FileText,
      cor: 'border-[#0F5FA8]'
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-[#0A3D78] flex items-center gap-2">
          <Target className="w-5 h-5" />
          Metodologia Vigorre® 3.0
        </CardTitle>
        <p className="text-sm text-[#5E6C84]">
          7 fases para um diagnóstico completo
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {fases.map((fase) => (
            <div 
              key={fase.numero}
              className={`flex items-start gap-3 p-3 rounded-lg border-l-4 ${fase.cor} bg-[#F7F8FA] hover:bg-[#EAF3FC] transition-colors`}
            >
              <span className="text-xs font-bold text-[#0F5FA8] bg-white px-2 py-1 rounded-full min-w-[24px] text-center">
                {fase.numero}
              </span>
              <div className="flex-1">
                <p className="text-sm font-medium text-[#1C1F26]">{fase.nome}</p>
                <p className="text-xs text-[#5E6C84]">{fase.descricao}</p>
              </div>
              {fase.numero < 7 && (
                <ArrowRight className="w-4 h-4 text-[#D7DEE8] flex-shrink-0" />
              )}
            </div>
          ))}
        </div>
        <button className="mt-4 text-sm text-[#0F5FA8] font-medium hover:underline">
          Ver detalhes da metodologia →
        </button>
      </CardContent>
    </Card>
  )
}
