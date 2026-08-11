'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ArrowLeft,
  User,
  Mail,
  Shield,
  Briefcase,
  Award,
  Calendar,
  Pencil,
  Loader2,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { toast } from 'sonner'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

export default function DetalhesColaboradorPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [colaborador, setColaborador] = useState<any>(null)
  const [userData, setUserData] = useState<any>(null)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)

      try {
        const id = params.id as string

        // Buscar usuário logado
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data } = await supabase
            .from('usuarios')
            .select('*')
            .eq('user_id', user.id)
            .single()
          setUserData(data)

          // Verificar se é ADMIN
          if (data?.perfil !== 'ADMIN') {
            toast.error('Acesso negado')
            router.push('/')
            return
          }
        }

        // Buscar colaborador
        const { data, error } = await supabase
          .from('usuarios')
          .select('*')
          .eq('id', id)
          .single()

        if (error) {
          toast.error('Colaborador não encontrado')
          router.push('/colaboradores')
          return
        }

        setColaborador(data)
      } catch (error) {
        toast.error('Erro ao carregar dados')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [params.id, supabase, router])

  const getInitials = (nome: string) => {
    if (!nome) return '??'
    return nome
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getPerfilLabel = (perfil: string) => {
    const labels: Record<string, string> = {
      'ADMIN': 'Administrador',
      'DIRETOR': 'Diretor',
      'GESTOR': 'Gestor de Projetos',
      'CONSULTOR': 'Consultor',
      'AUDITOR': 'Auditor',
      'ESPECIALISTA': 'Especialista',
      'CLIENTE': 'Cliente',
    }
    return labels[perfil] || perfil
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#0F5FA8]" />
      </div>
    )
  }

  if (!colaborador) {
    return (
      <div className="text-center py-12">
        <p className="text-[#5E6C84]">Colaborador não encontrado</p>
        <Button className="mt-4" onClick={() => router.push('/colaboradores')}>
          Voltar para colaboradores
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="text-[#5E6C84] hover:text-[#0F5FA8]"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-[#0A3D78]">
              {colaborador.nome}
            </h1>
            <p className="text-[#5E6C84]">{colaborador.email}</p>
          </div>
        </div>
        <Link href={`/colaboradores/${colaborador.id}/editar`}>
          <Button variant="outline">
            <Pencil className="w-4 h-4 mr-2" />
            Editar
          </Button>
        </Link>
      </div>

      {/* Informações do Colaborador */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-[#0A3D78]">Informações Pessoais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-[#F7F8FA] rounded-lg">
              <Avatar className="w-16 h-16 bg-[#0F5FA8] text-white">
                <AvatarFallback className="text-lg font-medium">
                  {getInitials(colaborador.nome)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-[#1C1F26]">{colaborador.nome}</p>
                <p className="text-sm text-[#5E6C84]">{colaborador.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <User className="w-4 h-4 text-[#5E6C84]" />
              <span className="text-[#5E6C84]">Perfil:</span>
              <span className="text-[#1C1F26] font-medium">
                {getPerfilLabel(colaborador.perfil)}
              </span>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <Shield className="w-4 h-4 text-[#5E6C84]" />
              <span className="text-[#5E6C84]">Status:</span>
              {colaborador.ativo ? (
                <span className="text-green-600 font-medium flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" /> Ativo
                </span>
              ) : (
                <span className="text-red-600 font-medium flex items-center gap-1">
                  <XCircle className="w-4 h-4" /> Inativo
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-[#5E6C84]" />
              <span className="text-[#5E6C84]">Cadastro:</span>
              <span className="text-[#1C1F26] font-medium">
                {colaborador.created_at ? new Date(colaborador.created_at).toLocaleDateString('pt-BR') : '—'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-[#0A3D78]">Informações Profissionais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 text-sm">
              <Briefcase className="w-4 h-4 text-[#5E6C84]" />
              <span className="text-[#5E6C84]">Especialização:</span>
              <span className="text-[#1C1F26] font-medium">
                {colaborador.especializacao || 'Não definida'}
              </span>
            </div>

            <div className="flex items-start gap-2 text-sm">
              <Award className="w-4 h-4 text-[#5E6C84] mt-0.5" />
              <div>
                <span className="text-[#5E6C84]">Competências:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {colaborador.competencias && Array.isArray(colaborador.competencias) && colaborador.competencias.length > 0 ? (
                    colaborador.competencias.map((comp: string, i: number) => (
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

            <div className="p-4 bg-[#EAF3FC] rounded-lg mt-4">
              <p className="text-sm text-[#0F5FA8] font-medium">🔑 Acesso</p>
              <p className="text-xs text-[#5E6C84] mt-1">
                Este colaborador pode acessar o sistema com seu email e senha.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
