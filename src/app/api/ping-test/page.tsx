'use client'

import { useState } from 'react'

export default function PingTest() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const testPing = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/ping')
      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({ error: 'Erro ao pingar' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">🧪 Teste de Keep-Alive</h1>
      
      <button
        onClick={testPing}
        disabled={loading}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
      >
        {loading ? 'Pingando...' : '🔔 Testar Ping'}
      </button>

      {result && (
        <div className="mt-4 p-4 bg-gray-100 rounded-lg">
          <pre className="whitespace-pre-wrap">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}
