import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Auth is handled entirely client-side via AuthContext + localStorage.
// This middleware simply passes all requests through.
// (Server-side cookie-based auth can be added here in a future iteration.)
export function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
