'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Building2,
  Users,
  FileText,
  ClipboardList,
  BarChart3,
  BookOpen,
  Settings,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Brain,
  Download,
  Menu,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

const menuItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, description: 'Visão geral do sistema' },
  { label: 'Diagnósticos', href: '/diagnosticos', icon: ClipboardList, description: 'Gerenciar diagnósticos' },
  { label: 'Clientes', href: '/clientes', icon: Building2, description: 'Empresas atendidas' },
  { label: 'Colaboradores', href: '/colaboradores', icon: Users, description: 'Equipe Vigorre' },
  { label: 'CTI™', href: '/cti', icon: Brain, description: 'Corpo Técnico Inteligente' },
  { label: 'Relatórios', href: '/relatorios', icon: FileText, description: 'Relatórios gerados' },
  { label: 'Análises', href: '/analises', icon: BarChart3, description: 'Métricas e indicadores' },
  { label: 'Knowledge Hub™', href: '/knowledge-hub', icon: BookOpen, description: 'Base de conhecimento' },
]

const adminItems = [
  { label: 'Perguntas', href: '/perguntas', icon: FileText, description: 'Gerenciar perguntas' },
  { label: 'Configurações IA', href: '/configuracoes', icon: Settings, description: 'Configurar IA' },
  { label: 'Exportar Dados', href: '/exportar', icon: Download, description: 'Exportar dados' },
]

interface SidebarProps {
  isCollapsed?: boolean
  onToggle?: () => void
}

export function Sidebar({ isCollapsed = false, onToggle }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [userData, setUserData] = useState<any>(null)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase
          .from('usuarios')
          .select('*')
          .eq('user_id', user.id)
          .single()
        setUserData(data)
      }
    }
    getUser()
  }, [supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const getInitials = (nome: string) => {
    if (!nome) return 'V'
    return nome
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const isAdmin = userData?.perfil === 'ADMIN'
  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard' || pathname === '/'
    return pathname.startsWith(href)
  }

  // Mobile Menu
  const MobileMenu = () => (
    <>
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-[#0a0f1a] shadow-xl transform transition-transform duration-300 ease-in-out md:hidden",
        isMobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b border-[#D7DEE8] dark:border-[#1a2a3a]">
            <div>
              <span className="text-lg font-bold text-[#0A3D78] dark:text-[#6BA3E0]">
                Vigorre Diagnostics™
              </span>
              <span className="block text-xs text-[#5E6C84] dark:text-[#94a3b8]">
                Dados que transformam decisões.
              </span>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setIsMobileOpen(false)}>
              <X className="w-5 h-5 dark:text-white" />
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <nav className="space-y-1">
              {menuItems.map((item) => {
                const active = isActive(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                      active ? "bg-[#EAF3FC] dark:bg-[#1a2a3a] text-[#0F5FA8] dark:text-[#4D90D9]" : "text-[#5E6C84] dark:text-[#94a3b8] hover:bg-[#EAF3FC] dark:hover:bg-[#1a2a3a] hover:text-[#0F5FA8] dark:hover:text-[#4D90D9]"
                    )}
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </Link>
                )
              })}
              {isAdmin && (
                <div className="pt-2 mt-2 border-t border-[#D7DEE8] dark:border-[#1a2a3a]">
                  {adminItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMobileOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                        isActive(item.href) ? "bg-[#EAF3FC] dark:bg-[#1a2a3a] text-[#0F5FA8] dark:text-[#4D90D9]" : "text-[#5E6C84] dark:text-[#94a3b8] hover:bg-[#EAF3FC] dark:hover:bg-[#1a2a3a] hover:text-[#0F5FA8] dark:hover:text-[#4D90D9]"
                      )}
                    >
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  ))}
                </div>
              )}
            </nav>
          </div>
          <div className="p-4 border-t border-[#D7DEE8] dark:border-[#1a2a3a] space-y-2">
            <Link href="/perfil" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-[#EAF3FC] dark:hover:bg-[#1a2a3a] transition-colors">
              <User className="w-5 h-5 text-[#5E6C84] dark:text-[#94a3b8]" />
              <span className="text-[#1C1F26] dark:text-white">Meu Perfil</span>
            </Link>
            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors">
              <LogOut className="w-5 h-5" />
              <span>Sair</span>
            </button>
          </div>
        </div>
      </div>
    </>
  )

  // Desktop Sidebar
  const DesktopSidebar = () => (
    <aside className={cn(
      "hidden md:flex md:flex-col bg-white dark:bg-[#0a0f1a] border-r border-[#D7DEE8] dark:border-[#1a2a3a] h-screen fixed left-0 top-0 bottom-0 z-30 transition-all duration-300 ease-in-out",
      isCollapsed ? "w-[72px]" : "w-[280px]"
    )}>
      {/* Logo */}
      <div className={cn(
        "h-16 flex items-center border-b border-[#D7DEE8] dark:border-[#1a2a3a] flex-shrink-0",
        isCollapsed ? "px-3 justify-center" : "px-4 justify-between"
      )}>
        {!isCollapsed ? (
          <Link href="/dashboard" className="flex flex-col">
            <span className="text-lg font-bold text-[#0A3D78] dark:text-[#6BA3E0]">
              Vigorre Diagnostics™
            </span>
            <span className="text-[10px] text-[#5E6C84] dark:text-[#94a3b8] leading-tight">
              Dados que transformam decisões.
            </span>
          </Link>
        ) : (
          <Link href="/dashboard" className="flex flex-col items-center">
            <span className="text-lg font-bold text-[#0A3D78] dark:text-[#6BA3E0]">VD</span>
            <span className="text-[8px] text-[#5E6C84] dark:text-[#94a3b8] leading-tight text-center">v3.0</span>
          </Link>
        )}
        {onToggle && (
          <Button variant="ghost" size="icon" onClick={onToggle} className="hidden lg:flex h-8 w-8">
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </Button>
        )}
      </div>

      {/* Navegação */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative",
                  active ? "bg-[#EAF3FC] dark:bg-[#1a2a3a] text-[#0F5FA8] dark:text-[#4D90D9]" : "text-[#5E6C84] dark:text-[#94a3b8] hover:bg-[#EAF3FC] dark:hover:bg-[#1a2a3a] hover:text-[#0F5FA8] dark:hover:text-[#4D90D9]"
                )}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!isCollapsed ? (
                  <span className="truncate">{item.label}</span>
                ) : (
                  <span className="absolute left-full ml-2 px-2.5 py-1.5 bg-[#1C1F26] dark:bg-[#2a3a4a] text-white text-xs rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-lg">
                    {item.label}
                  </span>
                )}
                {active && !isCollapsed && <span className="ml-auto w-1.5 h-6 bg-[#0F5FA8] dark:bg-[#4D90D9] rounded-full" />}
              </Link>
            )
          })}

          {/* Admin Items */}
          {isAdmin && (
            <div className="pt-2 mt-2 border-t border-[#D7DEE8] dark:border-[#1a2a3a]">
              <p className={cn("text-[10px] font-semibold text-[#5E6C84] dark:text-[#94a3b8] uppercase tracking-wider px-3 py-1", isCollapsed && "text-center")}>
                {!isCollapsed ? 'Administração' : '⚙️'}
              </p>
              {adminItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative",
                    isActive(item.href) ? "bg-[#EAF3FC] dark:bg-[#1a2a3a] text-[#0F5FA8] dark:text-[#4D90D9]" : "text-[#5E6C84] dark:text-[#94a3b8] hover:bg-[#EAF3FC] dark:hover:bg-[#1a2a3a] hover:text-[#0F5FA8] dark:hover:text-[#4D90D9]"
                  )}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {!isCollapsed ? <span className="truncate">{item.label}</span> : null}
                </Link>
              ))}
            </div>
          )}
        </nav>
      </ScrollArea>

      {/* Footer */}
      <div className="flex-shrink-0 p-3 border-t border-[#D7DEE8] dark:border-[#1a2a3a] space-y-1">
        <Link
          href="/perfil"
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#5E6C84] dark:text-[#94a3b8] hover:bg-[#EAF3FC] dark:hover:bg-[#1a2a3a] hover:text-[#0F5FA8] dark:hover:text-[#4D90D9] transition-colors group relative",
            isCollapsed && "justify-center"
          )}
        >
          <Avatar className="w-8 h-8 bg-[#0F5FA8] dark:bg-[#1A6FB8] text-white flex-shrink-0">
            <AvatarFallback className="text-xs font-medium">
              {userData?.nome ? getInitials(userData.nome) : 'V'}
            </AvatarFallback>
          </Avatar>
          {!isCollapsed ? (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#1C1F26] dark:text-white truncate">
                {userData?.nome || 'Usuário'}
              </p>
              <p className="text-[11px] text-[#5E6C84] dark:text-[#94a3b8] truncate">
                {userData?.perfil || '—'}
              </p>
            </div>
          ) : (
            <span className="absolute left-full ml-2 px-2.5 py-1.5 bg-[#1C1F26] dark:bg-[#2a3a4a] text-white text-xs rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-lg">
              Meu Perfil
            </span>
          )}
        </Link>

        <button
          onClick={handleLogout}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors group relative",
            isCollapsed && "justify-center"
          )}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed ? <span>Sair</span> : null}
        </button>
      </div>
    </aside>
  )

  return (
    <>
      <button
        className="fixed bottom-6 right-6 z-40 md:hidden bg-[#0F5FA8] dark:bg-[#1A6FB8] text-white p-3 rounded-full shadow-lg hover:bg-[#0A3D78] dark:hover:bg-[#1A4D88] transition-colors"
        onClick={() => setIsMobileOpen(true)}
      >
        <Menu className="w-6 h-6" />
      </button>
      <DesktopSidebar />
      <MobileMenu />
    </>
  )
}
