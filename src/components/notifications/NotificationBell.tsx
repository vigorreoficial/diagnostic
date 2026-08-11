'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Bell, Check, CheckCheck, X, Clock, AlertCircle, Info, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { createClient } from '@/lib/supabase/client'
import { notificationService } from '@/lib/notifications/notification-service'
import { toast } from 'sonner'

interface Notificacao {
  id: string
  titulo: string
  mensagem: string
  tipo: 'INFO' | 'ALERTA' | 'SUCESSO' | 'PERIGO'
  status: 'NAO_LIDA' | 'LIDA' | 'ARQUIVADA'
  link: string | null
  created_at: string
}

const TIPO_ICONS: Record<string, any> = {
  'INFO': Info,
  'ALERTA': AlertCircle,
  'SUCESSO': CheckCircle,
  'PERIGO': AlertCircle
}

const TIPO_CORES: Record<string, string> = {
  'INFO': 'text-blue-500 bg-blue-50',
  'ALERTA': 'text-yellow-500 bg-yellow-50',
  'SUCESSO': 'text-green-500 bg-green-50',
  'PERIGO': 'text-red-500 bg-red-50'
}

const TIPO_EMOJIS: Record<string, string> = {
  'INFO': 'ℹ️',
  'ALERTA': '⚠️',
  'SUCESSO': '✅',
  'PERIGO': '🔴'
}

export function NotificationBell() {
  const supabase = createClient()
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([])
  const [naoLidas, setNaoLidas] = useState(0)
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [userData, setUserData] = useState<any>(null)

  useEffect(() => {
    const fetchUserAndNotifications = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase
          .from('usuarios')
          .select('*')
          .eq('user_id', user.id)
          .single()
        setUserData(data)
        await carregarNotificacoes(data?.id)
      }
    }

    fetchUserAndNotifications()

    // Configurar recarga periódica (a cada 60 segundos)
    const interval = setInterval(() => {
      if (userData?.id) {
        carregarNotificacoes(userData.id)
      }
    }, 60000)

    return () => clearInterval(interval)
  }, [supabase])

  const carregarNotificacoes = async (usuarioId: string) => {
    if (!usuarioId) return

    setLoading(true)
    try {
      const naoLidas = await notificationService.contarNaoLidas(usuarioId)
      setNaoLidas(naoLidas)

      const notificacoes = await notificationService.buscarNotificacoes(usuarioId, 10)
      setNotificacoes(notificacoes)
    } catch (error) {
      console.error('Erro ao carregar notificações:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsRead = async (id: string) => {
    await notificationService.marcarComoLida(id)
    if (userData?.id) {
      await carregarNotificacoes(userData.id)
    }
    toast.success('Notificação marcada como lida')
  }

  const handleMarkAllAsRead = async () => {
    if (userData?.id) {
      await notificationService.marcarTodasComoLidas(userData.id)
      await carregarNotificacoes(userData.id)
      toast.success('Todas as notificações marcadas como lidas')
    }
  }

  const formatarData = (data: string) => {
    const agora = new Date()
    const diff = agora.getTime() - new Date(data).getTime()
    const minutos = Math.floor(diff / (1000 * 60))

    if (minutos < 1) return 'Agora mesmo'
    if (minutos < 60) return `${minutos} min`
    if (minutos < 1440) return `${Math.floor(minutos / 60)}h`
    return new Date(data).toLocaleDateString('pt-BR')
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5 text-[#5E6C84]" />
          {naoLidas > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-medium rounded-full flex items-center justify-center animate-pulse">
              {naoLidas > 9 ? '9+' : naoLidas}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-h-[450px] overflow-y-auto">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span className="font-semibold">Notificações</span>
          {naoLidas > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="text-xs text-[#0F5FA8] hover:underline flex items-center gap-1"
            >
              <CheckCheck className="w-3 h-3" />
              Marcar todas
            </button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {loading ? (
          <div className="py-6 text-center text-sm text-[#5E6C84]">
            Carregando...
          </div>
        ) : notificacoes.length === 0 ? (
          <div className="py-8 text-center text-sm text-[#5E6C84]">
            <Bell className="w-8 h-8 mx-auto mb-2 text-[#D7DEE8]" />
            Nenhuma notificação
          </div>
        ) : (
          notificacoes.map((notificacao) => {
            const Icon = TIPO_ICONS[notificacao.tipo] || Info
            const cor = TIPO_CORES[notificacao.tipo] || 'text-gray-500 bg-gray-50'
            const emoji = TIPO_EMOJIS[notificacao.tipo] || 'ℹ️'
            const isNaoLida = notificacao.status === 'NAO_LIDA'

            return (
              <DropdownMenuItem
                key={notificacao.id}
                className={`flex flex-col items-start gap-1 p-3 cursor-pointer hover:bg-[#F7F8FA] ${isNaoLida ? 'border-l-2 border-l-[#0F5FA8]' : ''}`}
                onClick={() => {
                  if (isNaoLida) {
                    handleMarkAsRead(notificacao.id)
                  }
                  setIsOpen(false)
                  if (notificacao.link) {
                    window.location.href = notificacao.link
                  }
                }}
              >
                <div className="flex items-center gap-2 w-full">
                  <div className={`p-1 rounded ${cor}`}>
                    <Icon className="w-3 h-3" />
                  </div>
                  <span className={`text-sm font-medium ${isNaoLida ? 'text-[#0A3D78]' : 'text-[#5E6C84]'}`}>
                    {notificacao.titulo}
                  </span>
                  {isNaoLida && (
                    <span className="ml-auto w-2 h-2 bg-[#0F5FA8] rounded-full flex-shrink-0" />
                  )}
                </div>
                <p className="text-xs text-[#5E6C84] line-clamp-2 w-full">
                  {notificacao.mensagem}
                </p>
                <div className="flex items-center gap-2 w-full">
                  <span className="text-[10px] text-[#D7DEE8]">
                    {formatarData(notificacao.created_at)}
                  </span>
                  {isNaoLida && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleMarkAsRead(notificacao.id)
                      }}
                      className="text-[10px] text-[#0F5FA8] hover:underline ml-auto"
                    >
                      Marcar como lida
                    </button>
                  )}
                </div>
              </DropdownMenuItem>
            )
          })
        )}

        {notificacoes.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="justify-center">
              <Link href="/notificacoes" className="text-sm text-[#0F5FA8] hover:underline">
                Ver todas as notificações
              </Link>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
