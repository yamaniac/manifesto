import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

// Rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map();

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 100; // 100 requests per minute

// Security headers
const securityHeaders = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
};

// Rate limiting function
const checkRateLimit = (ip) => {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW;
  
  if (!rateLimitStore.has(ip)) {
    rateLimitStore.set(ip, []);
  }
  
  const requests = rateLimitStore.get(ip);
  const validRequests = requests.filter(timestamp => timestamp > windowStart);
  
  if (validRequests.length >= MAX_REQUESTS_PER_WINDOW) {
    return false; // Rate limited
  }
  
  validRequests.push(now);
  rateLimitStore.set(ip, validRequests);
  return true; // Allowed
};

// Clean up old rate limit entries
setInterval(() => {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW;
  
  for (const [ip, requests] of rateLimitStore.entries()) {
    const validRequests = requests.filter(timestamp => timestamp > windowStart);
    if (validRequests.length === 0) {
      rateLimitStore.delete(ip);
    } else {
      rateLimitStore.set(ip, validRequests);
    }
  }
}, RATE_LIMIT_WINDOW);

export async function updateSession(request) {
  // Get client IP for rate limiting
  const ip = request.headers.get('x-forwarded-for') || 
             request.headers.get('x-real-ip') || 
             'unknown';
  
  // Check rate limiting
  if (!checkRateLimit(ip)) {
    return new NextResponse('Too Many Requests', { 
      status: 429,
      headers: {
        'Retry-After': '60',
        ...securityHeaders
      }
    });
  }

  let supabaseResponse = NextResponse.next({
    request,
  });

  // Add security headers to all responses
  Object.entries(securityHeaders).forEach(([key, value]) => {
    supabaseResponse.headers.set(key, value);
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
          
          // Re-add security headers after creating new response
          Object.entries(securityHeaders).forEach(([key, value]) => {
            supabaseResponse.headers.set(key, value);
          });
        },
      },
    }
  );

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Additional security checks
    if (user) {
      // Check if user is banned or suspended (you can implement this logic)
      // const userStatus = await checkUserStatus(user.id);
      // if (userStatus === 'banned' || userStatus === 'suspended') {
      //   return NextResponse.redirect(new URL('/login?error=account_suspended', request.url));
      // }
    }

    // Protected routes that require authentication
    const protectedRoutes = ['/admin', '/affirmations'];
    const isProtectedRoute = protectedRoutes.some(route => 
      request.nextUrl.pathname.startsWith(route)
    );

    if (isProtectedRoute && !user) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('redirect', request.nextUrl.pathname);
      return NextResponse.redirect(url);
    }

    // Admin routes that require super admin privileges
    const adminRoutes = ['/admin'];
    const isAdminRoute = adminRoutes.some(route => 
      request.nextUrl.pathname.startsWith(route)
    );

    if (isAdminRoute && user) {
      try {
        // Check if user has super admin role
        const { data: roles, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'super_admin');

        if (error || !roles || roles.length === 0) {
          // User doesn't have super admin role, redirect to access denied
          const url = request.nextUrl.clone();
          url.pathname = '/';
          return NextResponse.redirect(url);
        }
      } catch (error) {
        console.error('Error checking admin privileges:', error);
        // On error, redirect to home page for security
        const url = request.nextUrl.clone();
        url.pathname = '/';
        return NextResponse.redirect(url);
      }
    }

    // Public routes that don't require authentication
    const publicRoutes = ['/login', '/auth', '/'];
    const isPublicRoute = publicRoutes.some(route => 
      request.nextUrl.pathname.startsWith(route)
    );

    // Redirect authenticated users away from login page
    if (isPublicRoute && user && request.nextUrl.pathname === '/login') {
      const url = request.nextUrl.clone();
      url.pathname = '/';
      return NextResponse.redirect(url);
    }

    // If no user and not on public routes, redirect to login
    if (!user && !isPublicRoute) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }

  } catch (error) {
    console.error('Middleware error:', error);
    // On error, redirect to login for security
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
  // creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object here instead of the supabaseResponse object

  return supabaseResponse;
}
