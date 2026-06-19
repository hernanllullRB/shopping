import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_PAGES = new Set(['/login', '/register']);
const PUBLIC_API_PREFIXES = ['/api/auth/login', '/api/auth/register', '/api/docs', '/api/products'];

function isPublicApi(pathname: string): boolean {
  return PUBLIC_API_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/') || pathname.startsWith(p + '?'));
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/_next') || pathname.startsWith('/favicon') || pathname.includes('.')) {
    return NextResponse.next();
  }

  if (pathname.startsWith('/api/')) {
    if (isPublicApi(pathname)) return NextResponse.next();
    return NextResponse.next();
  }

  if (PUBLIC_PAGES.has(pathname)) return NextResponse.next();

  const token = request.cookies.get('token')?.value;
  if (!token) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
