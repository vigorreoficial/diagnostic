// src/lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

// ✅ Tipo para as opções de cookie (compatível com @supabase/ssr)
type CookieOptions = {
  domain?: string
  path?: string
  secure?: boolean
  sameSite?: 'lax' | 'strict' | 'none'
  maxAge?: number
  httpOnly?: boolean
}

type Cookie = {
  name: string
  value: string
  options?: CookieOptions
}

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll(): Cookie[] {
          // No browser, document.cookie é uma string; precisamos parsear
          if (typeof document === 'undefined') return []
          return document.cookie.split(';').map((cookie) => {
            const [name, value] = cookie.trim().split('=')
            return { name, value }
          })
        },
        // ✅ CORREÇÃO: Tipagem explícita para cookiesToSet
        setAll(cookiesToSet: Cookie[]): void {
          if (typeof document === 'undefined') return
          cookiesToSet.forEach(({ name, value, options }) => {
            // Cria string de cookie com opções básicas
            let cookie = `${name}=${value}`
            if (options?.domain) cookie += `; Domain=${options.domain}`
            if (options?.path) cookie += `; Path=${options.path}`
            if (options?.secure) cookie += '; Secure'
            if (options?.sameSite) cookie += `; SameSite=${options.sameSite}`
            if (options?.maxAge) cookie += `; Max-Age=${options.maxAge}`
            if (options?.httpOnly) cookie += '; HttpOnly'
            document.cookie = cookie
          })
        },
      },
    }
  )
}
