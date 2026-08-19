const fetch = require('node-fetch')

// Configuração
const config = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://cevlornqbvwshuuoswcj.supabase.co',
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  pingEndpoint: process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}/api/ping`
    : 'http://localhost:3000/api/ping'
}

async function pingSupabase() {
  const timestamp = new Date().toISOString()
  
  try {
    console.log(`[${timestamp}] 🚀 Pingando Supabase...`)
    
    const response = await fetch(config.pingEndpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    const data = await response.json()
    
    if (response.status === 200) {
      console.log(`[${timestamp}] ✅ Supabase ativo! Status: ${response.status}`)
      console.log(`[${timestamp}] 📊 Resposta:`, JSON.stringify(data, null, 2))
    } else {
      console.log(`[${timestamp}] ⚠️ Resposta inesperada: ${response.status}`)
      console.log(`[${timestamp}] 📊 Detalhes:`, JSON.stringify(data, null, 2))
    }
    
    return data
  } catch (error) {
    console.error(`[${timestamp}] ❌ Erro ao pingar:`, error.message)
    
    // Tenta pingar diretamente o Supabase se o endpoint falhar
    console.log(`[${timestamp}] 🔄 Tentando pingar diretamente o Supabase...`)
    
    try {
      const directResponse = await fetch(`${config.supabaseUrl}/rest/v1/`, {
        headers: {
          'apikey': config.supabaseKey,
          'Authorization': `Bearer ${config.supabaseKey}`
        }
      })
      
      if (directResponse.status === 200) {
        console.log(`[${timestamp}] ✅ Supabase respondeu diretamente!`)
        return { status: 'ok', method: 'direct' }
      }
    } catch (directError) {
      console.error(`[${timestamp}] ❌ Falha no ping direto:`, directError.message)
    }
  }
}

// Função principal
async function main() {
  console.log('🔄 Iniciando Keep-Alive do Supabase...')
  console.log(`📍 Endpoint: ${config.pingEndpoint}`)
  console.log(`🕐 Intervalo: 6 horas`)
  console.log('----------------------------------------')
  
  // Executa imediatamente
  await pingSupabase()
  
  // Configura o intervalo de 6 horas (21600000 ms)
  setInterval(async () => {
    await pingSupabase()
  }, 6 * 60 * 60 * 1000)
}

// Executa o script
if (require.main === module) {
  main().catch(console.error)
}

module.exports = { pingSupabase }
