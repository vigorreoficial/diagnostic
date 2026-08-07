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
  Menu,
  X,
  Home,
  Briefcase,
  TrendingUp,
  Award
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

// ============================================
// MENU ITEMS
// ============================================

const menuItems = [
  { 
    label: 'Dashboard', 
    href: '/', 
    icon: LayoutDashboard,
    description: 'Visão geral do sistema'
  },
  { 
    label: 'Diagnósticos', 
    href: '/diagnosticos', 
    icon: ClipboardList,
    description: 'Gerenciar diagnósticos'
  },
  { 
    label: 'Clientes', 
    href: '/clientes', 
    icon: Building2,
    description: 'Empresas atendidas'
  },
  { 
    label: 'Colaboradores', 
    href: '/colaboradores', 
    icon: Users,
    description: 'Equipe Vigorre'
  },
  { 
    label: 'Relatórios', 
    href: '/relatorios', 
    icon: FileText,
    description: 'Relatórios gerados'
  },
  { 
    label: 'Knowledge Hub™', 
    href: '/knowledge-hub', 
    icon: BookOpen,
    description: 'Base de conhecimento'
  },
  { 
    label: 'Análises', 
    href: '/analises', 
    icon: BarChart3,
    description: 'Métricas e indicadores'
  },
]

const adminItems = [
  { 
    label: 'Configurações', 
    href: '/configuracoes', 
    icon: Settings,
    description: 'Configurações do sistema'
  },
]

// ============================================
// SIDEBAR COMPONENT
// ============================================

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
          .eq('auth_user_id', user.id)
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
    return nome
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const isAdmin = userData?.perfil === 'ADMIN'

  // ============================================
  // MOBILE MENU
  // ============================================

  const MobileMenu = () => (
    <>
      {/* Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
      
      {/* Menu mobile */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-xl transform transition-transform duration-300 ease-in-out md:hidden",
        isMobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Header do menu mobile */}
          <div className="flex items-center justify-between p-4 border-b border-vigorre-gray-medium">
            <div>
              <span className="text-lg font-bold text-vigorre-secondary">
                Vigorre Diagnostics™
              </span>
              <span className="block text-xs text-vigorre-gray-dark">
                Dados que transformam decisões.
              </span>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setIsMobileOpen(false)}>
              <X className="w-5 h-5" />
            </Button>
          </div>
          
          {/* Conteúdo do menu mobile */}
          <div className="flex-1 overflow-y-auto p-4">
            <NavContent 
              userData={userData} 
              pathname={pathname} 
              isAdmin={isAdmin}
              onNavigate={() => setIsMobileOpen(false)} 
            />
          </div>
          
          {/* Footer do menu mobile */}
          <div className="p-4 border-t border-vigorre-gray-medium">
            <FooterContent 
              userData={userData} 
              onLogout={handleLogout} 
              isCollapsed={false}
            />
          </div>
        </div>
      </div>
    </>
  )

  // ============================================
  // DESKTOP SIDEBAR
  // ============================================

  const DesktopSidebar = () => (
    <aside className={cn(
      "hidden md:flex md:flex-col bg-white border-r border-vigorre-gray-medium h-screen fixed left-0 top-0 bottom-0 z-30 transition-all duration-300 ease-in-out",
      isCollapsed ? "w-[72px]" : "w-[280px]"
    )}>
      {/* Logo */}
      <div className={cn(
        "h-16 flex items-center border-b border-vigorre-gray-medium flex-shrink-0",
        isCollapsed ? "px-3 justify-center" : "px-4 justify-between"
      )}>
        {!isCollapsed ? (
          <Link href="/" className="flex flex-col">
            <span className="text-lg font-bold text-vigorre-secondary">
              Vigorre Diagnostics™
            </span>
            <span className="text-[10px] text-vigorre-gray-dark leading-tight">
              Dados que transformam decisões.
            </span>
          </Link>
        ) : (
          <Link href="/" className="flex flex-col items-center">
            <span className="text-lg font-bold text-vigorre-secondary">VD</span>
            <span className="text-[8px] text-vigorre-gray-dark leading-tight text-center">v3.0</span>
          </Link>
        )}
        {onToggle && (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onToggle}
            className="hidden lg:flex flex-shrink-0 h-8 w-8"
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </Button>
        )}
      </div>

      {/* Navegação com Scroll */}
      <ScrollArea className="flex-1 px-3 py-4">
        <NavContent 
          userData={userData} 
          pathname={pathname} 
          isAdmin={isAdmin}
          isCollapsed={isCollapsed}
        />
      </ScrollArea>

      {/* Footer com Perfil */}
      <div className="flex-shrink-0 p-3 border-t border-vigorre-gray-medium">
        <FooterContent 
          userData={userData} 
          onLogout={handleLogout} 
          isCollapsed={isCollapsed}
        />
      </div>
    </aside>
  )

  // ============================================
  // RENDER
  // ============================================

  return (
    <>
      {/* Botão flutuante para abrir menu mobile */}
      <button
        className="fixed bottom-6 right-6 z-40 md:hidden bg-vigorre-primary text-white p-3 rounded-full shadow-lg hover:bg-vigorre-secondary transition-colors"
        onClick={() => setIsMobileOpen(true)}
      >
        <Menu className="w-6 h-6" />
      </button>

      <DesktopSidebar />
      <MobileMenu />
    </>
  )
}

// ============================================
// NAV CONTENT - MENU PRINCIPAL
// ============================================

interface NavContentProps {
  userData: any
  pathname: string
  isAdmin: boolean
  isCollapsed?: boolean
  onNavigate?: () => void
}

function NavContent({ 
  userData, 
  pathname, 
  isAdmin, 
  isCollapsed = false, 
  onNavigate 
}: NavContentProps) {
  
  // Função para verificar se o link está ativo
  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/'
    }
    return pathname.startsWith(href)
  }

  return (
    <nav className="space-y-1">
      {/* Itens principais do menu */}
      {menuItems.map((item) => {
        const active = isActive(item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative",
              active
                ? "bg-vigorre-very-light text-vigorre-primary"
                : "text-vigorre-gray-dark hover:bg-vigorre-very-light hover:text-vigorre-primary"
            )}
          >
            <item.icon className={cn(
              "w-5 h-5 flex-shrink-0",
              active && "text-vigorre-primary"
            )} />
            
            {!isCollapsed ? (
              <span className="truncate">{item.label}</span>
            ) : (
              /* Tooltip para sidebar colapsada */
              <span className="absolute left-full ml-2 px-2.5 py-1.5 bg-vigorre-dark text-white text-xs rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-lg">
                {item.label}
                <span className="block text-[10px] font-normal text-gray-300">
                  {item.description}
                </span>
              </span>
            )}
            
            {/* Indicador de página ativa */}
            {active && !isCollapsed && (
              <span className="ml-auto w-1.5 h-6 bg-vigorre-primary rounded-full" />
            )}
            {active && isCollapsed && (
              <span className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-vigorre-primary rounded-full" />
            )}
          </Link>
        )
      })}

      {/* Itens administrativos */}
      {isAdmin && (
        <div className="pt-2 mt-2 border-t border-vigorre-gray-medium">
          <p className={cn(
            "text-[10px] font-semibold text-vigorre-gray-dark uppercase tracking-wider px-3 py-1",
            isCollapsed && "text-center"
          )}>
            {!isCollapsed ? 'Administração' : '⚙️'}
          </p>
          {adminItems.map((item) => {
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative",
                  active
                    ? "bg-vigorre-very-light text-vigorre-primary"
                    : "text-vigorre-gray-dark hover:bg-vigorre-very-light hover:text-vigorre-primary"
                )}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!isCollapsed ? (
                  <span className="truncate">{item.label}</span>
                ) : (
                  <span className="absolute left-full ml-2 px-2.5 py-1.5 bg-vigorre-dark text-white text-xs rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-lg">
                    {item.label}
                  </span>
                )}
                {active && !isCollapsed && (
                  <span className="ml-auto w-1.5 h-6 bg-vigorre-primary rounded-full" />
                )}
              </Link>
            )
          })}
        </div>
      )}
    </nav>
  )
}

// ============================================
// FOOTER CONTENT - PERFIL E SAIR
// ============================================

interface FooterContentProps {
  userData: any
  onLogout: () => void
  isCollapsed: boolean
}

function FooterContent({ userData, onLogout, isCollapsed }: FooterContentProps) {
  const getInitials = (nome: string) => {
    return nome
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="space-y-1">
      {/* Perfil */}
      <Link
        href="/perfil"
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-vigorre-gray-dark hover:bg-vigorre-very-light hover:text-vigorre-primary transition-colors group relative",
          isCollapsed && "justify-center"
        )}
      >
        <Avatar className="w-8 h-8 bg-vigorre-primary text-white flex-shrink-0">
          <AvatarFallback className="text-xs font-medium">
            {userData?.nome ? getInitials(userData.nome) : 'V'}
          </AvatarFallback>
        </Avatar>
        
        {!isCollapsed ? (
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-vigorre-dark truncate">
              {userData?.nome || 'Usuário'}
            </p>
            <p className="text-[11px] text-vigorre-gray-dark truncate">
              {userData?.perfil || '—'}
            </p>
          </div>
        ) : (
          <span className="absolute left-full ml-2 px-2.5 py-1.5 bg-vigorre-dark text-white text-xs rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-lg">
            Meu Perfil
          </span>
        )}
      </Link>

      {/* Logout */}
      <button
        onClick={onLogout}
        className={cn(
          "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 transition-colors group relative",
          isCollapsed && "justify-center"
        )}
      >
        <LogOut className="w-5 h-5 flex-shrink-0" />
        {!isCollapsed ? (
          <span>Sair</span>
        ) : (
          <span className="absolute left-full ml-2 px-2.5 py-1.5 bg-vigorre-dark text-white text-xs rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-lg">
            Sair
          </span>
        )}
      </button>
    </div>
  )
}
