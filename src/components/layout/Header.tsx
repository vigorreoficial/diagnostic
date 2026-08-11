// src/components/layout/Header.tsx
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Menu, User, Settings, LogOut } from 'lucide-react'
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
import { ThemeToggle } from '@/components/ui/theme-toggle'

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
        // ✅ CORREÇÃO: usar 'user_id' (nome real da coluna)
        const { data } = await supabase
          .from('usuarios')
          .select('*')
          .eq('user_id', user.id) // ✅ Correto: user_id (não auth_user_id)
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
    <header className="bg-white dark:bg-[#0a0f1a] border-b border-[#D7DEE8] dark:border-[#1a2a3a] h-16 flex items-center px-4 md:px-6 flex-shrink-0">
      <Button 
        variant="ghost" 
        size="icon" 
        className="md:hidden mr-2"
        onClick={onMenuClick}
      >
        <Menu className="w-5 h-5" />
      </Button>

      <div className="flex-1 flex items-center gap-3">
        {/* Logo + Nome */}
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="relative w-10 h-10 flex-shrink-0">
            <Image
              src="/logo-vigorre.png"
              alt="Vigorre Diagnostics"
              fill
              className="object-contain rounded-lg"
              priority
            />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-lg font-semibold text-[#0A3D78] dark:text-[#6BA3E0]">
              Vigorre Diagnostics™
            </h1>
            <p className="text-[10px] text-[#5E6C84] dark:text-[#94a3b8] -mt-0.5 leading-tight">
              Dados que transformam decisões.
            </p>
          </div>
        </Link>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        {/* Toggle tema escuro */}
        <ThemeToggle />

        {/* Notificações */}
        <NotificationBell />

        {/* Perfil */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-3 px-2">
              <Avatar className="w-8 h-8 bg-[#0F5FA8] dark:bg-[#1A6FB8] text-white">
                <AvatarFallback className="text-xs font-medium">
                  {userData?.nome ? getInitials(userData.nome) : 'V'}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium text-[#1C1F26] dark:text-[#94a3b8] hidden sm:inline">
                {userData?.nome || user?.email?.split('@')[0] || 'Usuário'}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="font-medium dark:text-white">{userData?.nome || 'Usuário'}</span>
                <span className="text-xs text-[#5E6C84] dark:text-[#94a3b8]">{user?.email}</span>
                <span className="text-xs text-[#0F5FA8] dark:text-[#4D90D9] mt-1 font-medium">
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
            <DropdownMenuItem onClick={handleLogout} className="text-red-500 dark:text-red-400">
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
