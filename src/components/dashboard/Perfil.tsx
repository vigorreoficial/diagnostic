// src/components/dashboard/Perfil.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { User, Briefcase, Award, Calendar, Star } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

export function Perfil() {
  const supabase = createClient()
  const [userData, setUserData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // ✅ CORREÇÃO: usar 'user_id' (nome real da coluna)
        const { data } = await supabase
          .from('usuarios')
          .select('*')
          .eq('user_id', user.id) // ✅ Correto: user_id (não auth_user_id)
          .single()
        setUserData(data)
      }
      setLoading(false)
    }
    getUser()
  }, [supabase])

  const getInitials = (nome: string) => {
    return nome
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0F5FA8] mx-auto"></div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-[#0A3D78] flex items-center gap-2">
          <User className="w-5 h-5" />
          Meu Perfil
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 mb-4">
          <Avatar className="w-14 h-14 bg-[#0F5FA8] text-white">
            <AvatarFallback className="text-lg font-medium">
              {userData?.nome ? getInitials(userData.nome) : 'V'}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-[#1C1F26]">
              {userData?.nome || 'Usuário'}
            </p>
            <p className="text-sm text-[#5E6C84]">
              {userData?.perfil || '—'}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-[#F7F8FA]">
            <Briefcase className="w-4 h-4 text-[#0F5FA8]" />
            <div>
              <p className="text-xs text-[#5E6C84]">Especialização</p>
              <p className="text-sm font-medium text-[#1C1F26]">
                {userData?.especializacao || 'Não definida'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg bg-[#F7F8FA]">
            <Award className="w-4 h-4 text-[#0F5FA8]" />
            <div>
              <p className="text-xs text-[#5E6C84]">Competências</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {userData?.competencias && Array.isArray(userData.competencias) ? (
                  userData.competencias.slice(0, 3).map((comp: string, i: number) => (
                    <span key={i} className="px-2 py-0.5 bg-[#EAF3FC] text-[#0F5FA8] rounded-full text-xs">
                      {comp}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-[#5E6C84]">Nenhuma competência cadastrada</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg bg-[#F7F8FA]">
            <Calendar className="w-4 h-4 text-[#0F5FA8]" />
            <div>
              <p className="text-xs text-[#5E6C84]">Carga de trabalho</p>
              <p className="text-sm font-medium text-[#1C1F26]">
                {userData?.carga_trabalho || '0'} projetos ativos
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg bg-[#F7F8FA]">
            <Star className="w-4 h-4 text-yellow-500" />
            <div>
              <p className="text-xs text-[#5E6C84]">Performance</p>
              <p className="text-sm font-medium text-[#1C1F26]">
                {userData?.performance || '4.8'} / 5.0
              </p>
            </div>
          </div>
        </div>

        <button className="mt-4 text-sm text-[#0F5FA8] font-medium hover:underline">
          Editar Perfil →
        </button>
      </CardContent>
    </Card>
  )
}
