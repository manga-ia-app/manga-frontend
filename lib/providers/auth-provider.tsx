"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { User } from "@/lib/types";
import {
  login as apiLogin,
  logout as apiLogout,
  getTokenFromCookie,
  getRefreshTokenFromCookie,
  isTokenExpired,
  getTokenRemainingMs,
  refreshAccessToken,
  removeCookie,
  TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
} from "@/lib/api/auth";
import logger from "@/lib/logger";

export interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

function extractUserFromToken(token: string): User | null {
  const payload = decodeJwtPayload(token);
  if (!payload) return null;

  const givenName = (payload.given_name as string) || "";
  const familyName = (payload.family_name as string) || "";
  const nome = `${givenName} ${familyName}`.trim()
    || (payload.nome as string)
    || (payload.name as string)
    || "";

  return {
    id: (payload.sub as string) || (payload.id as string) || "",
    nome,
    email: (payload.email as string) || "",
    role: (payload.role as User["role"]) || "Viewer",
    tenantId: (payload.TenantId as string) || (payload.tenantId as string) || "",
    ativo: true,
    criadoEm: "",
  };
}

// Renova o JWT 2 minutos antes de expirar
const REFRESH_BUFFER_MS = 2 * 60 * 1000;

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearRefreshTimer = useCallback(() => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
  }, []);

  const scheduleRefresh = useCallback(
    (token: string) => {
      clearRefreshTimer();
      const remainingMs = getTokenRemainingMs(token);

      // Se não tem refresh token no cookie, não agenda (sessão antiga sem refresh)
      if (!getRefreshTokenFromCookie()) {
        logger.warn("auth:schedule — sem refresh token no cookie, não agendando renovação");
        return;
      }

      // Agenda o refresh 2 minutos antes da expiração (mínimo 30s)
      const delay = Math.max(remainingMs - REFRESH_BUFFER_MS, 30_000);
      logger.info(`auth:schedule — JWT expira em ${Math.round(remainingMs / 1000)}s, refresh agendado em ${Math.round(delay / 1000)}s`);

      refreshTimerRef.current = setTimeout(async () => {
        logger.info("auth:refresh — iniciando renovação do token");
        const result = await refreshAccessToken();
        if (result) {
          logger.info("auth:refresh — token renovado com sucesso");
          const extractedUser = extractUserFromToken(result.token);
          setUser(extractedUser);
          scheduleRefresh(result.token);
        } else {
          logger.warn("auth:refresh — falha na renovação do token");
        }
        // Se refresh falhou, NÃO faz redirect aqui.
        // O interceptor do Axios cuidará do redirect quando uma request real falhar com 401.
      }, delay);
    },
    [clearRefreshTimer]
  );

  // Inicializar auth state
  useEffect(() => {
    const token = getTokenFromCookie();
    const hasRefreshToken = !!getRefreshTokenFromCookie();

    logger.info(`auth:init — jwt=${token ? "presente" : "ausente"}, refreshToken=${hasRefreshToken ? "presente" : "ausente"}, jwtExpirado=${token ? isTokenExpired(token) : "n/a"}`);

    if (token && !isTokenExpired(token)) {
      const extractedUser = extractUserFromToken(token);
      setUser(extractedUser);
      logger.info(`auth:init — sessão restaurada para ${extractedUser?.email}`);
      scheduleRefresh(token);
    } else if (hasRefreshToken) {
      logger.info("auth:init — sem JWT válido, tentando refresh silencioso");
      refreshAccessToken().then((result) => {
        if (result) {
          const extractedUser = extractUserFromToken(result.token);
          setUser(extractedUser);
          logger.info(`auth:init — refresh silencioso OK para ${extractedUser?.email}`);
          scheduleRefresh(result.token);
        } else {
          logger.warn("auth:init — refresh silencioso falhou, limpando cookies");
          removeCookie(TOKEN_COOKIE);
          removeCookie(REFRESH_TOKEN_COOKIE);
        }
        setIsLoading(false);
      });
      return () => clearRefreshTimer();
    } else if (token) {
      logger.warn("auth:init — JWT expirado sem refresh token, limpando");
      removeCookie(TOKEN_COOKIE);
    }

    setIsLoading(false);
    return () => clearRefreshTimer();
  }, [scheduleRefresh, clearRefreshTimer]);

  const login = useCallback(
    async (email: string, password: string) => {
      logger.info(`auth:login — tentativa para ${email}`);
      const response = await apiLogin(email, password);
      const extractedUser = extractUserFromToken(response.token);
      setUser(
        extractedUser || {
          id: "",
          nome: `${response.firstName} ${response.lastName}`.trim(),
          email: response.email,
          role: "Viewer" as User["role"],
          tenantId: response.tenantId,
          ativo: true,
          criadoEm: "",
        }
      );
      logger.info(`auth:login — sucesso para ${email}`);
      scheduleRefresh(response.token);
    },
    [scheduleRefresh]
  );

  const logout = useCallback(() => {
    logger.info(`auth:logout — usuário ${user?.email} saindo`);
    clearRefreshTimer();
    setUser(null);
    apiLogout();
  }, [clearRefreshTimer, user?.email]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isAuthenticated: !!user,
      login,
      logout,
    }),
    [user, isLoading, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
