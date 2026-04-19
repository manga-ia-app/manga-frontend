import axios from "axios";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  tenantNome?: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  email: string;
  firstName: string;
  lastName: string;
  tenantId: string;
}

export const TOKEN_COOKIE = "manga_token";
export const REFRESH_TOKEN_COOKIE = "manga_refresh_token";
const TOKEN_MAX_AGE = 60 * 60; // 1 hora
const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60; // 7 dias

function setCookie(name: string, value: string, maxAge: number) {
  document.cookie = `${name}=${value}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

export function removeCookie(name: string) {
  document.cookie = `${name}=; path=/; max-age=0`;
}

export function getTokenFromCookie(): string | null {
  if (typeof document === "undefined") return null;
  const cookies = document.cookie.split("; ");
  const tokenCookie = cookies.find((c) => c.startsWith(`${TOKEN_COOKIE}=`));
  return tokenCookie ? tokenCookie.substring(`${TOKEN_COOKIE}=`.length) : null;
}

export function getRefreshTokenFromCookie(): string | null {
  if (typeof document === "undefined") return null;
  const cookies = document.cookie.split("; ");
  const cookie = cookies.find((c) =>
    c.startsWith(`${REFRESH_TOKEN_COOKIE}=`)
  );
  return cookie
    ? cookie.substring(`${REFRESH_TOKEN_COOKIE}=`.length)
    : null;
}

/**
 * Decodifica o payload do JWT e verifica se o claim `exp` já passou.
 * Retorna true se o token estiver expirado ou inválido.
 */
export function isTokenExpired(token: string): boolean {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    const payload = JSON.parse(jsonPayload);
    if (!payload.exp) return true;
    return Date.now() >= payload.exp * 1000;
  } catch {
    return true;
  }
}

/**
 * Retorna os milissegundos restantes até o JWT expirar.
 * Retorna 0 se já estiver expirado ou inválido.
 */
export function getTokenRemainingMs(token: string): number {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    const payload = JSON.parse(jsonPayload);
    if (!payload.exp) return 0;
    const remaining = payload.exp * 1000 - Date.now();
    return remaining > 0 ? remaining : 0;
  } catch {
    return 0;
  }
}

function saveTokens(data: AuthResponse) {
  setCookie(TOKEN_COOKIE, data.token, TOKEN_MAX_AGE);
  setCookie(REFRESH_TOKEN_COOKIE, data.refreshToken, REFRESH_TOKEN_MAX_AGE);
}

// Axios instance separada para refresh (evita loop no interceptor do apiClient)
const authClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5100/api",
  headers: { "Content-Type": "application/json" },
});

let refreshPromise: Promise<AuthResponse | null> | null = null;

/**
 * Tenta renovar o JWT usando o refresh token.
 * Usa deduplicação para evitar chamadas simultâneas.
 */
export async function refreshAccessToken(): Promise<AuthResponse | null> {
  const refreshToken = getRefreshTokenFromCookie();
  if (!refreshToken) return null;

  if (refreshPromise) return refreshPromise;

  refreshPromise = authClient
    .post<AuthResponse>("/auth/refresh", { refreshToken })
    .then((res) => {
      saveTokens(res.data);
      return res.data;
    })
    .catch(() => {
      removeCookie(TOKEN_COOKIE);
      removeCookie(REFRESH_TOKEN_COOKIE);
      return null;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

export async function login(
  email: string,
  password: string
): Promise<AuthResponse> {
  const response = await authClient.post<AuthResponse>("/auth/login", {
    email,
    password,
  });
  saveTokens(response.data);
  return response.data;
}

export async function register(data: RegisterRequest): Promise<AuthResponse> {
  const response = await authClient.post<AuthResponse>(
    "/auth/register",
    data
  );
  return response.data;
}

export { register as registerUser };

export async function confirmEmail(token: string): Promise<void> {
  await authClient.post("/auth/confirm-email", { token });
}

export function logout(): void {
  removeCookie(TOKEN_COOKIE);
  removeCookie(REFRESH_TOKEN_COOKIE);
  if (typeof window !== "undefined") {
    window.location.href = "/login";
  }
}
