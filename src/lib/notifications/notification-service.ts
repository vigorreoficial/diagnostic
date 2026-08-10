import { createClient } from '@/lib/supabase/client'

type TipoNotificacao = 'INFO' | 'ALERTA' | 'SUCESSO' | 'PERIGO'
type StatusNotificacao = 'NAO_LIDA' | 'LIDA' | 'ARQUIVADA'

interface Notificacao {
  usuario_id: string
  titulo: string
  mensagem: string
  tipo: TipoNotificacao
  link?: string
}

export class NotificationService {
  private supabase = createClient()

  /**
   * Envia uma notificação para um usuário
   */
  async enviarNotificacao(notificacao: Notificacao): Promise<void> {
    try {
      await this.supabase
        .from('notificacoes')
        .insert({
          usuario_id: notificacao.usuario_id,
          titulo: notificacao.titulo,
          mensagem: notificacao.mensagem,
          tipo: notificacao.tipo,
          link: notificacao.link || null,
          status: 'NAO_LIDA',
          created_at: new Date().toISOString()
        })
    } catch (error) {
      console.error('Erro ao enviar notificação:', error)
    }
  }

  /**
   * Envia notificações para múltiplos usuários
   */
  async enviarNotificacoes(notificacao: Omit<Notificacao, 'usuario_id'>, usuariosIds: string[]): Promise<void> {
    try {
      const notificacoes = usuariosIds.map(usuario_id => ({
        usuario_id,
        titulo: notificacao.titulo,
        mensagem: notificacao.mensagem,
        tipo: notificacao.tipo,
        link: notificacao.link || null,
        status: 'NAO_LIDA',
        created_at: new Date().toISOString()
      }))

      await this.supabase
        .from('notificacoes')
        .insert(notificacoes)
    } catch (error) {
      console.error('Erro ao enviar notificações:', error)
    }
  }

  /**
   * Marca notificação como lida
   */
  async marcarComoLida(notificacaoId: string): Promise<void> {
    try {
      await this.supabase
        .from('notificacoes')
        .update({ status: 'LIDA' })
        .eq('id', notificacaoId)
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error)
    }
  }

  /**
   * Marca todas as notificações de um usuário como lidas
   */
  async marcarTodasComoLidas(usuarioId: string): Promise<void> {
    try {
      await this.supabase
        .from('notificacoes')
        .update({ status: 'LIDA' })
        .eq('usuario_id', usuarioId)
        .eq('status', 'NAO_LIDA')
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error)
    }
  }

  /**
   * Busca notificações de um usuário
   */
  async buscarNotificacoes(usuarioId: string, limite: number = 50): Promise<any[]> {
    try {
      const { data } = await this.supabase
        .from('notificacoes')
        .select('*')
        .eq('usuario_id', usuarioId)
        .order('created_at', { ascending: false })
        .limit(limite)

      return data || []
    } catch (error) {
      console.error('Erro ao buscar notificações:', error)
      return []
    }
  }

  /**
   * Busca notificações não lidas
   */
  async buscarNaoLidas(usuarioId: string): Promise<any[]> {
    try {
      const { data } = await this.supabase
        .from('notificacoes')
        .select('*')
        .eq('usuario_id', usuarioId)
        .eq('status', 'NAO_LIDA')
        .order('created_at', { ascending: false })

      return data || []
    } catch (error) {
      console.error('Erro ao buscar não lidas:', error)
      return []
    }
  }

  /**
   * Conta notificações não lidas
   */
  async contarNaoLidas(usuarioId: string): Promise<number> {
    try {
      const { count } = await this.supabase
        .from('notificacoes')
        .select('*', { count: 'exact', head: true })
        .eq('usuario_id', usuarioId)
        .eq('status', 'NAO_LIDA')

      return count || 0
    } catch (error) {
      console.error('Erro ao contar não lidas:', error)
      return 0
    }
  }

  /**
   * Notifica todos os ADMIN
   */
  async notificarAdmins(titulo: string, mensagem: string, tipo: TipoNotificacao, link?: string): Promise<void> {
    try {
      const { data: admins } = await this.supabase
        .from('usuarios')
        .select('id')
        .eq('perfil', 'ADMIN')
        .eq('ativo', true)

      if (admins && admins.length > 0) {
        await this.enviarNotificacoes(
          { titulo, mensagem, tipo, link },
          admins.map(a => a.id)
        )
      }
    } catch (error) {
      console.error('Erro ao notificar admins:', error)
    }
  }

  /**
   * Notifica os responsáveis de um diagnóstico
   */
  async notificarResponsaveisDiagnostico(diagnosticoId: string, titulo: string, mensagem: string, tipo: TipoNotificacao): Promise<void> {
    try {
      // Buscar diagnóstico e responsável
      const { data: diagnostico } = await this.supabase
        .from('projetos_diagnostico')
        .select('responsavel_id')
        .eq('id', diagnosticoId)
        .single()

      if (diagnostico?.responsavel_id) {
        await this.enviarNotificacao({
          usuario_id: diagnostico.responsavel_id,
          titulo,
          mensagem,
          tipo,
          link: `/diagnosticos/${diagnosticoId}`
        })
      }
    } catch (error) {
      console.error('Erro ao notificar responsáveis:', error)
    }
  }

  /**
   * Notifica auditores de um diagnóstico
   */
  async notificarAuditores(diagnosticoId: string, titulo: string, mensagem: string, tipo: TipoNotificacao): Promise<void> {
    try {
      const { data: auditores } = await this.supabase
        .from('modulo_auditor')
        .select('auditor_id')
        .eq('projeto_id', diagnosticoId)

      if (auditores && auditores.length > 0) {
        await this.enviarNotificacoes(
          { titulo, mensagem, tipo, link: `/diagnosticos/${diagnosticoId}` },
          auditores.map(a => a.auditor_id)
        )
      }
    } catch (error) {
      console.error('Erro ao notificar auditores:', error)
    }
  }
}

export const notificationService = new NotificationService()
