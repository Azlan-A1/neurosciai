import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // This allows file uploads by disabling the default body size limit
  // for the /api/chat route
  if (request.nextUrl.pathname.startsWith('/api/chat')) {
    return NextResponse.next({
      headers: {
        'Connection': 'keep-alive',
        'Keep-Alive': 'timeout=60',
      },
    });
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: '/api/chat',
}; 