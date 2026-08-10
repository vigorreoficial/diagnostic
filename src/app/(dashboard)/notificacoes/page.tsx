'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { notificationService } from '@/lib/notifications/notification-service'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Bell,
  CheckCircle,
  Clock,
  AlertCircle,
  Info,
  FileText,
  Users,
  TrendingUp,
  Loader2,
  CheckCheck,
  Trash2,
  Search,
  Archive
} from 'lucide-react'
import { toast } from 'sonner'

type TipoNotificacao = 'INFO' | 'ALERTA' | 'SUCESSO' | 'PERIGO'
type StatusNotificacao = 'NAO_LIDA' | 'LIDA' | 'ARQUIVADA'

interface Notificacao {
  id: string
  titulo: string
  mensagem: string
  tipo: TipoNotificacao
  status: StatusNotificacao
  link: string | null
  created_at: string
}

const TIPO_LABELS: Record<TipoNotificacao, string> = {
  'INFO': 'Informação',
  'ALERTA': 'Alerta',
  'SUCESSO': 'Sucesso',
  'PERIGO': 'Perigo'
}

const TIPO_ICONS: Record<TipoNotificacao, any> = {
  'INFO': Info,
  'ALERTA': AlertCircle,
  'SUCESSO': CheckCircle,
  'PERIGO': AlertCircle
}

const TIPO_COLORS: Record<TipoNotificacao, string> = {
  'INFO': 'bg-blue-100 text-blue-700 border-blue-200',
  'ALERTA': 'bg-yellow-100 text-yellow-700 border-yellow-200',
  'SUCESSO': 'bg-green-100 text-green-700 border-green-200',
  'PERIGO': 'bg-red-100 text-red-700 border-red-200'
}

const STATUS_LABELS: Record<StatusNotificacao, string> = {
  'NAO_LIDA': 'Não lida',
  'LIDA': 'Lida',
  'ARQUIVADA': 'Arquivada'
}

export default function NotificacoesPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([])
  const [filteredNotificacoes, setFilteredNotificacoes] = useState<Notificacao[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterTipo, setFilterTipo] = useState<string>('TODOS')
  const [filterStatus, setFilterStatus] = useState<string>('TODOS')
  const [userData, setUserData] = useState<any>(null)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)

      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data } = await supabase
            .from('usuarios')
            .select('*')
            .eq('auth_user_id', user.id)
            .single()
          setUserData(data)

          if (data?.id) {
            const notificacoes = await notificationService.buscarNotificacoes(data.id, 100)
            setNotificacoes(notificacoes)
            setFilteredNotificacoes(notificacoes)
          }
        }
      } catch (error) {
        toast.error('Erro ao carregar notificações')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [supabase])

  useEffect(() => {
    let filtered = [...notificacoes]

    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(n =>
        n.titulo.toLowerCase().includes(term) ||
        n.mensagem.toLowerCase().includes(term)
      )
    }

    if (filterTipo !== 'TODOS') {
      filtered = filtered.filter(n => n.tipo === filterTipo)
    }

    if (filterStatus !== 'TODOS') {
      filtered = filtered.filter(n => n.status === filterStatus)
    }

    setFilteredNotificacoes(filtered)
  }, [searchTerm, filterTipo, filterStatus, notificacoes])

  const handleMarkAsRead = async (id: string) => {
    await notificationService.marcarComoLida(id)
    setNotificacoes(notificacoes.map(n =>
      n.id === id ? { ...n, status: 'LIDA' } : n
    ))
    toast.success('Notificação marcada como lida')
  }

  const handleMarkAllAsRead = async () => {
    if (userData?.id) {
      await notificationService.marcarTodasComoLidas(userData.id)
      setNotificacoes(notificacoes.map(n =>
        n.status === 'NAO_LIDA' ? { ...n, status: 'LIDA' } : n
      ))
      toast.success('Todas as notificações marcadas como lidas')
    }
  }

  const handleArchive = async (id: string) => {
    // Implementar arquivamento
    setNotificacoes(notificacoes.map(n =>
      n.id === id ? { ...n, status: 'ARQUIVADA' } : n
    ))
    toast.success('Notificação arquivada')
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta notificação?')) {
      return
    }
    setNotificacoes(notificacoes.filter(n => n.id !== id))
    toast.success('Notificação excluída')
  }

  const formatarData = (data: string) => {
    const agora = new Date()
    const diff = agora.getTime() - new Date(data).getTime()
    const minutos = Math.floor(diff / (1000 * 60))
    const horas = Math.floor(diff / (1000 * 60 * 60))
    const dias = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (minutos < 1) return 'Agora mesmo'
    if (minutos < 60) return `${minutos} min atrás`
    if (horas < 24) return `${horas} h atrás`
    if (dias < 7) return `${dias} d atrás`
    return new Date(data).toLocaleDateString('pt-BR')
  }

  const naoLidas = notificacoes.filter(n => n.status === 'NAO_LIDA').length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#0F5FA8]" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0A3D78] flex items-center gap-2">
            <Bell className="w-6 h-6" />
            Notificações
          </h1>
          <p className="text-[#5E6C84] text-sm">
            {naoLidas > 0 ? `Você tem ${naoLidas} notificação${naoLidas > 1 ? 'ões' : ''} não lida${naoLidas > 1 ? 's' : ''}` : 'Todas as notificações estão lidas'}
          </p>
        </div>
        {naoLidas > 0 && (
          <Button
            variant="outline"
            onClick={handleMarkAllAsRead}
            className="flex items-center gap-2"
          >
            <CheckCheck className="w-4 h-4" />
            Marcar todas como lidas
          </Button>
        )}
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5E6C84]" />
          <Input
            placeholder="Buscar notificações..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={filterTipo} onValueChange={setFilterTipo}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="TODOS">Todos os tipos</SelectItem>
            <SelectItem value="INFO">ℹ️ Informação</SelectItem>
            <SelectItem value="ALERTA">⚠️ Alerta</SelectItem>
            <SelectItem value="SUCESSO">✅ Sucesso</SelectItem>
            <SelectItem value="PERIGO">🔴 Perigo</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="TODOS">Todos os status</SelectItem>
            <SelectItem value="NAO_LIDA">Não lida</SelectItem>
            <SelectItem value="LIDA">Lida</SelectItem>
            <SelectItem value="ARQUIVADA">Arquivada</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Lista de Notificações */}
      {filteredNotificacoes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Bell className="w-12 h-12 text-[#D7DEE8] mx-auto mb-4" />
            <p className="text-[#5E6C84]">
              {notificacoes.length === 0
                ? 'Nenhuma notificação ainda.'
                : 'Nenhuma notificação encontrada com esses filtros.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredNotificacoes.map((notificacao) => {
            const Icon = TIPO_ICONS[notificacao.tipo] || Info
            const isNaoLida = notificacao.status === 'NAO_LIDA'

            return (
              <Card
                key={notificacao.id}
                className={`hover:shadow-md transition-shadow ${isNaoLida ? 'border-l-4 border-l-[#0F5FA8]' : ''}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-lg ${TIPO_COLORS[notificacao.tipo]}`}>
                      <Icon className="w-5 h-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className={`font-medium ${isNaoLida ? 'text-[#0A3D78]' : 'text-[#5E6C84]'}`}>
                            {notificacao.titulo}
                          </p>
                          <p className="text-sm text-[#5E6C84] mt-1">
                            {notificacao.mensagem}
                          </p>
                          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs">
                            <span className={`px-2 py-0.5 rounded-full ${TIPO_COLORS[notificacao.tipo]}`}>
                              {TIPO_LABELS[notificacao.tipo]}
                            </span>
                            <span className="text-[#5E6C84]">
                              {STATUS_LABELS[notificacao.status]}
                            </span>
                            <span className="text-[#5E6C84]">
                              {formatarData(notificacao.created_at)}
                            </span>
                            {notificacao.link && (
                              <a
                                href={notificacao.link}
                                className="text-[#0F5FA8] hover:underline font-medium"
                              >
                                Ver detalhes →
                              </a>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 flex-shrink-0">
                          {notificacao.status === 'NAO_LIDA' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMarkAsRead(notificacao.id)}
                              className="text-[#0F5FA8] hover:text-[#0A3D78]"
                            >
                              <CheckCircle className="w-4 h-4" />
                              <span className="sr-only">Marcar como lida</span>
                            </Button>
                          )}
                          {notificacao.status !== 'ARQUIVADA' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleArchive(notificacao.id)}
                              className="text-[#5E6C84] hover:text-[#0F5FA8]"
                            >
                              <Archive className="w-4 h-4" />
                              <span className="sr-only">Arquivar</span>
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(notificacao.id)}
                            className="text-[#5E6C84] hover:text-red-500"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span className="sr-only">Excluir</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
