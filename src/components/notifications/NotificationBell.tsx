'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Bell } from 'lucide-react'
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

const TIPO_ICONS: Record<string, string> = {
  'INFO': 'ℹ️',
  'ALERTA': '⚠️',
  'SUCESSO': '✅',
  'PERIGO': '🔴'
}

export function NotificationBell() {
  const supabase = createClient()
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([])
  const [naoLidas, setNaoLidas] = useState(0)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    // Buscar notificações (mock)
    const mockNotificacoes: Notificacao[] = [
      {
        id: '1',
        titulo: 'Diagnóstico concluído',
        mensagem: 'ABC Indústrias - 100% concluído',
        tipo: 'SUCESSO',
        status: 'NAO_LIDA',
        link: '/diagnosticos/6e097572-bed7-4b8a-a044-69eafb580350',
        created_at: new Date().toISOString()
      },
      {
        id: '2',
        titulo: 'Novo diagnóstico criado',
        mensagem: 'XYZ Serviços aguarda análise',
        tipo: 'INFO',
        status: 'NAO_LIDA',
        link: '/diagnosticos/novo',
        created_at: new Date().toISOString()
      }
    ]

    setNotificacoes(mockNotificacoes)
    setNaoLidas(mockNotificacoes.filter(n => n.status === 'NAO_LIDA').length)
  }, [])

  const handleMarkAsRead = (id: string) => {
    setNotificacoes(notificacoes.map(n =>
      n.id === id ? { ...n, status: 'LIDA' } : n
    ))
    setNaoLidas(naoLidas - 1)
    toast.success('Notificação marcada como lida')
  }

  const formatarData = (data: string) => {
    const agora = new Date()
    const diff = agora.getTime() - new Date(data).getTime()
    const minutos = Math.floor(diff / (1000 * 60))

    if (minutos < 1) return 'Agora mesmo'
    if (minutos < 60) return `${minutos} min`
    return new Date(data).toLocaleDateString('pt-BR')
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5 text-[#5E6C84]" />
          {naoLidas > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-medium rounded-full flex items-center justify-center">
              {naoLidas > 9 ? '9+' : naoLidas}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-h-[400px] overflow-y-auto">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notificações</span>
          {naoLidas > 0 && (
            <button
              onClick={() => {
                setNotificacoes(notificacoes.map(n =>
                  n.status === 'NAO_LIDA' ? { ...n, status: 'LIDA' } : n
                ))
                setNaoLidas(0)
                toast.success('Todas as notificações marcadas como lidas')
              }}
              className="text-xs text-[#0F5FA8] hover:underline"
            >
              Marcar todas como lidas
            </button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {notificacoes.length === 0 ? (
          <div className="py-6 text-center text-sm text-[#5E6C84]">
            Nenhuma notificação
          </div>
        ) : (
          notificacoes.slice(0, 5).map((notificacao) => (
            <DropdownMenuItem
              key={notificacao.id}
              className="flex flex-col items-start gap-1 p-3 cursor-pointer hover:bg-[#F7F8FA]"
              onClick={() => {
                if (notificacao.status === 'NAO_LIDA') {
                  handleMarkAsRead(notificacao.id)
                }
                setIsOpen(false)
                if (notificacao.link) {
                  window.location.href = notificacao.link
                }
              }}
            >
              <div className="flex items-center gap-2 w-full">
                <span>{TIPO_ICONS[notificacao.tipo]}</span>
                <span className={`text-sm font-medium ${notificacao.status === 'NAO_LIDA' ? 'text-[#0A3D78]' : 'text-[#5E6C84]'}`}>
                  {notificacao.titulo}
                </span>
                {notificacao.status === 'NAO_LIDA' && (
                  <span className="ml-auto w-2 h-2 bg-[#0F5FA8] rounded-full" />
                )}
              </div>
              <p className="text-xs text-[#5E6C84] truncate w-full">
                {notificacao.mensagem}
              </p>
              <span className="text-[10px] text-[#D7DEE8]">
                {formatarData(notificacao.created_at)}
              </span>
            </DropdownMenuItem>
          ))
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem className="justify-center">
          <Link href="/notificacoes" className="text-sm text-[#0F5FA8] hover:underline">
            Ver todas as notificações
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
