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
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

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

  // Menu mobile (overlay)
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
        "fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-xl transform transition-transform duration-300 md:hidden",
        isMobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b">
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
          <div className="flex-1 overflow-y-auto p-4">
            <NavContent userData={userData} pathname={pathname} onNavigate={() => setIsMobileOpen(false)} />
          </div>
          <div className="p-4 border-t">
            <FooterContent userData={userData} onLogout={handleLogout} />
          </div>
        </div>
      </div>
    </>
  )

  // Desktop sidebar
  const DesktopSidebar = () => (
    <aside className={cn(
      "hidden md:flex md:flex-col bg-white border-r border-vigorre-gray-medium h-screen sticky top-0 flex-shrink-0 transition-all duration-300",
      isCollapsed ? "w-20" : "w-64"
    )}>
      {/* Logo */}
      <div className={cn(
        "p-4 border-b border-vigorre-gray-medium flex items-center",
        isCollapsed ? "justify-center" : "justify-between"
      )}>
        {!isCollapsed ? (
          <div>
            <span className="text-lg font-bold text-vigorre-secondary">
              Vigorre Diagnostics™
            </span>
            <span className="block text-xs text-vigorre-gray-dark">
              Dados que transformam decisões.
            </span>
          </div>
        ) : (
          <span className="text-xl font-bold text-vigorre-secondary">VD</span>
        )}
        {onToggle && (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onToggle}
            className="hidden lg:flex"
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </Button>
        )}
      </div>

      {/* Navegação */}
      <div className="flex-1 overflow-y-auto p-3">
        <NavContent userData={userData} pathname={pathname} isCollapsed={isCollapsed} />
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-vigorre-gray-medium">
        <FooterContent userData={userData} onLogout={handleLogout} isCollapsed={isCollapsed} />
      </div>
    </aside>
  )

  return (
    <>
      {/* Botão para abrir menu mobile */}
      <button
        className="fixed bottom-4 right-4 z-30 md:hidden bg-vigorre-primary text-white p-3 rounded-full shadow-lg"
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
// COMPONENTES INTERNOS
// ============================================

interface NavContentProps {
  userData: any
  pathname: string
  isCollapsed?: boolean
  onNavigate?: () => void
}

function NavContent({ userData, pathname, isCollapsed = false, onNavigate }: NavContentProps) {
  const isAdmin = userData?.perfil === 'ADMIN'

  return (
    <nav className="space-y-1">
      {menuItems.map((item) => {
        const isActive = pathname === item.href
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative",
              isActive
                ? "bg-vigorre-very-light text-vigorre-primary"
                : "text-vigorre-gray-dark hover:bg-vigorre-very-light hover:text-vigorre-primary"
            )}
          >
            <item.icon className={cn(
              "w-5 h-5 flex-shrink-0",
              isActive && "text-vigorre-primary"
            )} />
            
            {!isCollapsed ? (
              <span className="truncate">{item.label}</span>
            ) : (
              // Tooltip para sidebar colapsada
              <span className="absolute left-full ml-2 px-2 py-1 bg-vigorre-dark text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">
                {item.label}
                <span className="block text-[10px] font-normal text-gray-300">
                  {item.description}
                </span>
              </span>
            )}
          </Link>
        )
      })}

      {/* Admin items */}
      {isAdmin && (
        <div className="pt-2 mt-2 border-t border-vigorre-gray-medium">
          {adminItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative",
                  isActive
                    ? "bg-vigorre-very-light text-vigorre-primary"
                    : "text-vigorre-gray-dark hover:bg-vigorre-very-light hover:text-vigorre-primary"
                )}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!isCollapsed ? (
                  <span className="truncate">{item.label}</span>
                ) : (
                  <span className="absolute left-full ml-2 px-2 py-1 bg-vigorre-dark text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">
                    {item.label}
                  </span>
                )}
              </Link>
            )
          })}
        </div>
      )}
    </nav>
  )
}

interface FooterContentProps {
  userData: any
  onLogout: () => void
  isCollapsed?: boolean
}

function FooterContent({ userData, onLogout, isCollapsed = false }: FooterContentProps) {
  return (
    <div className="space-y-2">
      {/* Perfil */}
      <Link
        href="/perfil"
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-vigorre-gray-dark hover:bg-vigorre-very-light hover:text-vigorre-primary transition-colors group relative",
          isCollapsed && "justify-center"
        )}
      >
        <Avatar className="w-8 h-8 bg-vigorre-primary text-white flex-shrink-0">
          <AvatarFallback>
            {userData?.nome ? getInitials(userData.nome) : 'V'}
          </AvatarFallback>
        </Avatar>
        
        {!isCollapsed ? (
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-vigorre-dark truncate">
              {userData?.nome || 'Usuário'}
            </p>
            <p className="text-xs text-vigorre-gray-dark truncate">
              {userData?.perfil || '—'}
            </p>
          </div>
        ) : (
          <span className="absolute left-full ml-2 px-2 py-1 bg-vigorre-dark text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">
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
          <span className="absolute left-full ml-2 px-2 py-1 bg-vigorre-dark text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">
            Sair
          </span>
        )}
      </button>
    </div>
  )
}
