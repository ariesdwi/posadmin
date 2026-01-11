import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const userCookie = request.cookies.get('user');
  const path = request.nextUrl.pathname;
  
  // Allow login page always
  if (path === '/login') {
    return NextResponse.next();
  }
  
  // Redirect to login if no user cookie
  if (!userCookie) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  try {
    const user = JSON.parse(userCookie.value);
    
    // Protect /admin/* routes - only ADMIN can access
    if (path.startsWith('/admin')) {
      if (user.role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/', request.url));
      }
    }
    
    // Redirect ADMIN trying to access business owner routes
    if (!path.startsWith('/admin') && !path.startsWith('/login') && user.role === 'ADMIN') {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    }
    
    return NextResponse.next();
  } catch (error) {
    // Invalid user cookie, redirect to login
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
