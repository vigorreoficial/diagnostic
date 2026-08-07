'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Search, Building2, Users, Calendar } from 'lucide-react'

export default function ClientesPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [clientes, setClientes] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const fetchClientes = async () => {
      const { data } = await supabase
        .from('empresas')
        .select('*')
        .order('created_at', { ascending: false })
      
      setClientes(data || [])
      setLoading(false)
    }

    fetchClientes()
  }, [supabase])

  const filteredClientes = clientes.filter(cliente =>
    cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.cnpj?.includes(searchTerm)
  )

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-vigorre-secondary">
            Clientes
          </h1>
          <p className="text-vigorre-gray-dark">
            Gerencie as empresas atendidas pela Vigorre
          </p>
        </div>
        <Button className="bg-vigorre-primary hover:bg-vigorre-secondary">
          <Plus className="w-4 h-4 mr-2" />
          Novo Cliente
        </Button>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-vigorre-gray-dark" />
          <Input
            placeholder="Buscar cliente por nome ou CNPJ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Lista de Clientes */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-vigorre-primary"></div>
        </div>
      ) : filteredClientes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="w-12 h-12 text-vigorre-gray-medium mx-auto mb-4" />
            <p className="text-vigorre-gray-dark">
              {clientes.length === 0 
                ? 'Nenhum cliente cadastrado ainda.' 
                : 'Nenhum cliente encontrado com esse filtro.'}
            </p>
            <Button variant="outline" className="mt-4">
              <Plus className="w-4 h-4 mr-2" />
              Cadastrar primeiro cliente
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClientes.map((cliente) => (
            <Card key={cliente.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-vigorre-secondary">
                  {cliente.nome}
                </CardTitle>
                {cliente.nome_fantasia && (
                  <p className="text-sm text-vigorre-gray-dark">
                    {cliente.nome_fantasia}
                  </p>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-vigorre-gray-dark">
                  <Building2 className="w-4 h-4" />
                  <span>CNPJ: {cliente.cnpj || '—'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-vigorre-gray-dark">
                  <Users className="w-4 h-4" />
                  <span>Porte: {cliente.porte || '—'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-vigorre-gray-dark">
                  <Calendar className="w-4 h-4" />
                  <span>Cadastro: {new Date(cliente.created_at).toLocaleDateString('pt-BR')}</span>
                </div>
                <div className="pt-3 flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    Ver Diagnósticos
                  </Button>
                  <Button size="sm" className="flex-1 bg-vigorre-primary hover:bg-vigorre-secondary">
                    Novo Diagnóstico
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
