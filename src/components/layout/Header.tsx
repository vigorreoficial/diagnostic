'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Bell, Menu, User, Settings, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { NotificationBell } from '@/components/notifications/NotificationBell'

interface HeaderProps {
  onMenuClick?: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)
  const [userData, setUserData] = useState<any>(null)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        const { data } = await supabase
          .from('usuarios')
          .select('*')
          .eq('auth_user_id', user.id)
          .single()
        setUserData(data)
      }
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

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <header className="bg-white border-b border-[#D7DEE8] h-16 flex items-center px-4 md:px-6 flex-shrink-0">
      <Button 
        variant="ghost" 
        size="icon" 
        className="md:hidden mr-2"
        onClick={onMenuClick}
      >
        <Menu className="w-5 h-5" />
      </Button>

      <div className="flex-1 flex items-center gap-4">
        <h1 className="text-lg font-semibold text-[#0A3D78] hidden md:block">
          Dashboard
        </h1>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        {/* Notificações */}
        <NotificationBell />

        {/* Perfil */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-3 px-2">
              <Avatar className="w-8 h-8 bg-[#0F5FA8] text-white">
                <AvatarFallback className="text-xs font-medium">
                  {userData?.nome ? getInitials(userData.nome) : 'V'}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium text-[#1C1F26] hidden sm:inline">
                {userData?.nome || user?.email?.split('@')[0] || 'Usuário'}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="font-medium">{userData?.nome || 'Usuário'}</span>
                <span className="text-xs text-[#5E6C84]">{user?.email}</span>
                <span className="text-xs text-[#0F5FA8] mt-1 font-medium">
                  {userData?.perfil || '—'}
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => window.location.href = '/perfil'}>
              <User className="w-4 h-4 mr-2" />
              Meu Perfil
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => window.location.href = '/configuracoes'}>
              <Settings className="w-4 h-4 mr-2" />
              Configurações
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-red-500">
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
