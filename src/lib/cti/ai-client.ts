/**
 * Cliente para chamadas à API Gemini
 */
export async function chamarGemini(
  prompt: string,
  apiKey: string,
  model: string = 'gemini-pro'
): Promise<string> {
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 2048,
          topP: 0.95,
        },
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('Erro Gemini:', error)
      throw new Error(error.error?.message || 'Erro ao chamar Gemini')
    }

    const data = await response.json()
    return data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sem resposta'
  } catch (error: any) {
    console.error('Erro no Gemini:', error)
    throw new Error(error.message || 'Erro ao chamar Gemini')
  }
}

/**
 * Cliente para chamadas à API OpenAI (fallback)
 */
export async function chamarOpenAI(
  prompt: string,
  apiKey: string,
  model: string = 'gpt-3.5-turbo'
): Promise<string> {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'system',
            content: 'Você é um especialista em gestão empresarial e consultoria organizacional. Suas respostas são técnicas, detalhadas e estruturadas.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2048,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || 'Erro ao chamar OpenAI')
    }

    const data = await response.json()
    return data.choices?.[0]?.message?.content || 'Sem resposta'
  } catch (error: any) {
    console.error('Erro no OpenAI:', error)
    throw new Error(error.message || 'Erro ao chamar OpenAI')
  }
}

/**
 * Cliente unificado para chamadas à IA
 */
export async function chamarIA(
  prompt: string,
  provider: string,
  apiKey: string,
  model: string
): Promise<string> {
  if (!apiKey) {
    throw new Error('Chave de API não configurada')
  }

  switch (provider) {
    case 'gemini':
      return await chamarGemini(prompt, apiKey, model || 'gemini-pro')
    case 'openai':
      return await chamarOpenAI(prompt, apiKey, model || 'gpt-3.5-turbo')
    default:
      throw new Error(`Provedor ${provider} não suportado`)
  }
}

/**
 * Testa a conexão com a IA
 */
export async function testarConexao(
  provider: string,
  apiKey: string,
  model: string
): Promise<{ success: boolean; message: string }> {
  try {
    const testPrompt = 'Responda apenas "OK" se você estiver funcionando.'
    const response = await chamarIA(testPrompt, provider, apiKey, model)
    return {
      success: true,
      message: 'Conexão estabelecida com sucesso!',
    }
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Falha ao conectar',
    }
  }
}
