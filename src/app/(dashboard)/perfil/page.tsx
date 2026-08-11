// src/app/(dashboard)/perfil/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { User, Mail, Shield, Briefcase, Award } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

export default function PerfilPage() {
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
    if (!nome) return 'V'
    return nome
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0F5FA8]"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#0A3D78] flex items-center gap-2">
        <User className="w-6 h-6" />
        Meu Perfil
      </h1>

      <Card>
        <CardHeader>
          <CardTitle>Informações Pessoais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4 p-4 bg-[#F7F8FA] rounded-lg">
            <Avatar className="w-16 h-16 bg-[#0F5FA8] text-white">
              <AvatarFallback className="text-lg font-medium">
                {getInitials(userData?.nome)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-[#1C1F26]">{userData?.nome || 'Usuário'}</p>
              <p className="text-sm text-[#5E6C84]">{userData?.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Shield className="w-4 h-4 text-[#5E6C84]" />
            <span className="text-[#5E6C84]">Perfil:</span>
            <span className="text-[#1C1F26] font-medium">{userData?.perfil || '—'}</span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Briefcase className="w-4 h-4 text-[#5E6C84]" />
            <span className="text-[#5E6C84]">Especialização:</span>
            <span className="text-[#1C1F26] font-medium">{userData?.especializacao || 'Não definida'}</span>
          </div>

          <div className="flex items-start gap-2 text-sm">
            <Award className="w-4 h-4 text-[#5E6C84] mt-0.5" />
            <div>
              <span className="text-[#5E6C84]">Competências:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {userData?.competencias && Array.isArray(userData.competencias) && userData.competencias.length > 0 ? (
                  userData.competencias.map((comp: string, i: number) => (
                    <span key={i} className="px-2 py-0.5 bg-[#EAF3FC] text-[#0F5FA8] rounded-full text-xs">
                      {comp}
                    </span>
                  ))
                ) : (
                  <span className="text-[#5E6C84] text-sm">Nenhuma competência cadastrada</span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
