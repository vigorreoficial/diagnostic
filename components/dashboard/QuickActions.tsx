import { FileText, BarChart3, BookOpen, Plus } from 'lucide-react'
import Link from 'next/link'

export function QuickActions() {
  const actions = [
    { 
      label: 'Novo Diagnóstico', 
      icon: Plus, 
      href: '/diagnosticos/novo',
      color: 'bg-vigorre-primary text-white'
    },
    { 
      label: 'Relatórios', 
      icon: FileText, 
      href: '/relatorios',
      color: 'bg-white text-vigorre-dark border-vigorre-gray-medium'
    },
    { 
      label: 'Dashboard', 
      icon: BarChart3, 
      href: '/dashboard',
      color: 'bg-white text-vigorre-dark border-vigorre-gray-medium'
    },
    { 
      label: 'Knowledge Hub™', 
      icon: BookOpen, 
      href: '/knowledge-hub',
      color: 'bg-white text-vigorre-dark border-vigorre-gray-medium'
    },
  ]

  return (
    <section>
      <h2 className="text-lg font-semibold text-vigorre-secondary mb-4">
        Ações rápidas
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {actions.map((action) => (
          <Link
            key={action.label}
            href={action.href}
            className={`${action.color} border rounded-xl p-6 text-center hover:shadow-md transition-all flex flex-col items-center justify-center gap-2`}
          >
            <action.icon className="w-6 h-6" />
            <span className="text-sm font-medium">
              {action.label}
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}
