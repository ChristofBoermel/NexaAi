// proxy.ts (Next.js 16 rename of middleware.ts).
// Runs on every request before route matching. Keep it lean, it blocks the response.

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(_request: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
