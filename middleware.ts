import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicPaths = ["/login", "/register", "/confirm-email", "/proposta"];
const TOKEN_COOKIE = "manga_token";
const REFRESH_TOKEN_COOKIE = "manga_refresh_token";

function isPublicPath(pathname: string): boolean {
  return publicPaths.some(
    (path) => pathname === path || pathname.startsWith(path + "/")
  );
}

/**
 * Decodifica o payload do JWT (base64) e verifica se `exp` já passou.
 * Apenas decodificação — sem validação de assinatura (Edge runtime limitado).
 */
function isJwtExpired(token: string): boolean {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return true;

    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(base64));

    if (!payload.exp) return true;
    return Date.now() >= payload.exp * 1000;
  } catch {
    return true;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(TOKEN_COOKIE)?.value;
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;

  // Token existe mas está expirado
  if (token && isJwtExpired(token)) {
    // Se tem refresh token, permite passar — o client-side fará o refresh
    if (refreshToken) {
      const response = NextResponse.next();
      // Remove apenas o JWT expirado; o refresh token permanece para o client-side usar
      response.cookies.delete(TOKEN_COOKIE);
      return response;
    }

    // Sem refresh token — redirecionar para login
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete(TOKEN_COOKIE);
    return response;
  }

  // Sem token e rota protegida
  if (!token && !isPublicPath(pathname)) {
    // Se tem refresh token, permite passar — o client-side fará o refresh
    if (refreshToken) {
      return NextResponse.next();
    }

    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Com token válido e tentando acessar página pública (login/register) → dashboard
  if (token && isPublicPath(pathname)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes (/api/...)
     * - static files (/_next/static/..., /_next/image/..., /favicon.ico, etc.)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*$).*)",
  ],
};
