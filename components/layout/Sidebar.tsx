'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
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
  LogOut
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

const menuItems = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'Diagnósticos', href: '/diagnosticos', icon: ClipboardList },
  { label: 'Clientes', href: '/clientes', icon: Building2 },
  { label: 'Colaboradores', href: '/colaboradores', icon: Users },
  { label: 'Relatórios', href: '/relatorios', icon: FileText },
  { label: 'Knowledge Hub™', href: '/knowledge-hub', icon: BookOpen },
  { label: 'Análises', href: '/analises', icon: BarChart3 },
]

const adminItems = [
  { label: 'Configurações', href: '/configuracoes', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside className="w-64 bg-white border-r border-vigorre-gray-medium h-screen sticky top-0 overflow-y-auto flex-shrink-0 hidden md:block">
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="p-6 border-b border-vigorre-gray-medium">
          <div className="flex flex-col">
            <span className="text-lg font-bold text-vigorre-secondary">
              Vigorre Diagnostics™
            </span>
            <span className="text-xs text-vigorre-gray-dark">
              Dados que transformam decisões.
            </span>
          </div>
        </div>

        {/* Menu */}
        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-vigorre-very-light text-vigorre-primary"
                    : "text-vigorre-gray-dark hover:bg-vigorre-very-light hover:text-vigorre-primary"
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            )
          })}

          {/* Admin items - only for admin users */}
          {/* <div className="pt-4 mt-4 border-t border-vigorre-gray-medium">
            {adminItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  pathname === item.href
                    ? "bg-vigorre-very-light text-vigorre-primary"
                    : "text-vigorre-gray-dark hover:bg-vigorre-very-light hover:text-vigorre-primary"
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            ))}
          </div> */}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-vigorre-gray-medium">
          <Link
            href="/perfil"
            className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-vigorre-gray-dark hover:bg-vigorre-very-light hover:text-vigorre-primary transition-colors"
          >
            <User className="w-5 h-5" />
            Meu Perfil
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 transition-colors mt-1"
          >
            <LogOut className="w-5 h-5" />
            Sair
          </button>
        </div>
      </div>
    </aside>
  )
}
