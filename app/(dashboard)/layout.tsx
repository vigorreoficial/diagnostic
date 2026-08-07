import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar fixa */}
      <Sidebar />
      
      {/* Conteúdo principal com scroll */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header fixo */}
        <Header />
        
        {/* Conteúdo com scroll */}
        <main className="flex-1 overflow-y-auto bg-vigorre-gray-light p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
