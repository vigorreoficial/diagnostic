import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Criar resposta
  const response = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
          })
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // Verificar sessão
  const { data: { session } } = await supabase.auth.getSession()

  const isLoginPage = request.nextUrl.pathname === '/login'
  const isRoot = request.nextUrl.pathname === '/'

  // Se não tem sessão e não está na página de login -> vai para login
  if (!session && !isLoginPage) {
    const url = new URL('/login', request.url)
    return NextResponse.redirect(url)
  }

  // Se tem sessão e está na página de login -> vai para dashboard
  if (session && isLoginPage) {
    const url = new URL('/', request.url)
    return NextResponse.redirect(url)
  }

  // Se tem sessão e está na raiz -> vai para dashboard
  if (session && isRoot) {
    return NextResponse.next()
  }

  // Se não tem sessão e está na página de login -> mostra login
  if (!session && isLoginPage) {
    return NextResponse.next()
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
