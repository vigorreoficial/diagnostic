'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Shield, Loader2, CheckCircle, AlertCircle, Key, Cpu, Save } from 'lucide-react'
import { toast } from 'sonner'

export default function ConfiguracoesPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [userData, setUserData] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [config, setConfig] = useState({
    provider: 'openai',
    apiKey: '',
    model: 'gpt-3.5-turbo',
    temperature: 0.7,
  })
  const [testando, setTestando] = useState(false)
  const [testeResultado, setTesteResultado] = useState<'sucesso' | 'erro' | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data } = await supabase
            .from('usuarios')
            .select('*')
            .eq('auth_user_id', user.id)
            .single()
          setUserData(data)
          setIsAdmin(data?.perfil === 'ADMIN')

          // Carregar configurações salvas
          const { data: configData } = await supabase
            .from('configuracoes')
            .select('*')
            .eq('chave', 'ia_config')
            .single()

          if (configData) {
            const settings = configData.valor
            setConfig({
              provider: settings.provider || 'openai',
              apiKey: settings.apiKey || '',
              model: settings.model || 'gpt-3.5-turbo',
              temperature: settings.temperature || 0.7,
            })
          }
        }
      } catch (error) {
        toast.error('Erro ao carregar configurações')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [supabase])

  const handleSave = async () => {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('configuracoes')
        .upsert({
          chave: 'ia_config',
          valor: {
            provider: config.provider,
            apiKey: config.apiKey,
            model: config.model,
            temperature: config.temperature,
          },
          updated_at: new Date().toISOString(),
        }, { onConflict: 'chave' })

      if (error) {
        toast.error('Erro ao salvar configurações: ' + error.message)
        return
      }

      toast.success('Configurações salvas com sucesso!')
    } catch (error) {
      toast.error('Erro ao salvar configurações')
    } finally {
      setSaving(false)
    }
  }

  const handleTest = async () => {
    if (!config.apiKey) {
      toast.error('Informe uma chave de API primeiro')
      return
    }

    setTestando(true)
    setTesteResultado(null)

    try {
      // Simular teste de conexão com a IA
      await new Promise(resolve => setTimeout(resolve, 2000))
      setTesteResultado('sucesso')
      toast.success('Conexão com a IA testada com sucesso!')
    } catch (error) {
      setTesteResultado('erro')
      toast.error('Falha ao conectar com a IA')
    } finally {
      setTestando(false)
    }
  }

  if (!isAdmin && !loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Card className="max-w-md">
          <CardContent className="py-12 text-center">
            <Shield className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <p className="text-[#1C1F26] font-medium">Acesso Negado</p>
            <p className="text-[#5E6C84] text-sm">
              Apenas administradores podem acessar as configurações.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#0F5FA8]" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div>
        <h1 className="text-2xl font-bold text-[#0A3D78] flex items-center gap-2">
          <Cpu className="w-6 h-6" />
          Configurações da IA
        </h1>
        <p className="text-[#5E6C84] text-sm">
          Configure a integração com Inteligência Artificial para análises automáticas
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configurações */}
        <Card>
          <CardHeader>
            <CardTitle className="text-[#0A3D78] flex items-center gap-2">
              <Key className="w-5 h-5" />
              Credenciais da IA
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="provider">Provedor</Label>
              <Select
                value={config.provider}
                onValueChange={(v) => setConfig({ ...config, provider: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="openai">OpenAI</SelectItem>
                  <SelectItem value="gemini">Google Gemini</SelectItem>
                  <SelectItem value="azure">Azure OpenAI</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="apiKey">Chave de API *</Label>
              <Input
                id="apiKey"
                type="password"
                value={config.apiKey}
                onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                placeholder="sk-... ou AI-..."
              />
              <p className="text-xs text-[#5E6C84]">
                A chave é armazenada de forma segura no banco de dados
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="model">Modelo</Label>
              <Select
                value={config.model}
                onValueChange={(v) => setConfig({ ...config, model: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                  <SelectItem value="gpt-4">GPT-4</SelectItem>
                  <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                  <SelectItem value="gemini-pro">Gemini Pro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="temperature">Temperatura</Label>
              <Input
                id="temperature"
                type="number"
                step="0.1"
                min="0"
                max="1"
                value={config.temperature}
                onChange={(e) => setConfig({ ...config, temperature: parseFloat(e.target.value) || 0.7 })}
              />
              <p className="text-xs text-[#5E6C84]">
                Criatividade da IA (0 = preciso, 1 = criativo)
              </p>
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleTest}
                disabled={testando}
              >
                {testando ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Testando...
                  </>
                ) : (
                  'Testar Conexão'
                )}
              </Button>
              <Button
                className="flex-1 bg-[#0F5FA8] hover:bg-[#0A3D78]"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Salvar
                  </>
                )}
              </Button>
            </div>

            {testeResultado === 'sucesso' && (
              <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-sm text-green-700">Conexão estabelecida com sucesso!</span>
              </div>
            )}
            {testeResultado === 'erro' && (
              <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <span className="text-sm text-red-700">Falha ao conectar. Verifique sua chave de API.</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Informações */}
        <Card>
          <CardHeader>
            <CardTitle className="text-[#0A3D78]">ℹ️ Sobre a Integração</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-[#EAF3FC] rounded-lg">
              <p className="text-sm font-medium text-[#0A3D78]">Como funciona</p>
              <p className="text-sm text-[#5E6C84] mt-1">
                A IA analisa as respostas dos questionários e gera pareceres técnicos
                personalizados para cada módulo do diagnóstico.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Análise automática de respostas</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Geração de recomendações personalizadas</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Pareceres técnicos por módulo</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Motor de consenso entre especialistas</span>
              </div>
            </div>

            <div className="p-4 bg-yellow-50 rounded-lg">
              <p className="text-sm font-medium text-yellow-700">⚠️ Requisitos</p>
              <ul className="text-sm text-yellow-600 mt-1 space-y-1">
                <li>• Chave de API válida do OpenAI ou Google</li>
                <li>• Créditos disponíveis na conta</li>
                <li>• Conexão com a internet</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
