import { getToken } from 'next-auth/jwt'
import { NextResponse } from 'next/server'

export async function middleware(request) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  })

  const { pathname } = request.nextUrl

  // If trying to access dashboard
  if (pathname.startsWith('/dashboard')) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    if (token.role === 'subscriber') {
      return NextResponse.redirect(new URL('/reader', request.url))
    }
  }

  // If trying to access reader area
  if (pathname.startsWith('/reader')) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    if (['admin', 'writer', 'editor'].includes(token.role)) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  // If already logged in, don't show login/register page
  if (pathname.startsWith('/login') || pathname.startsWith('/register')) {
    if (token) {
      if (token.role === 'subscriber') {
        return NextResponse.redirect(new URL('/reader', request.url))
      }
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/reader/:path*', '/login', '/register'],
}