import axios from "axios";
import logger from "@/lib/logger";
import {
  TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  removeCookie,
  getTokenFromCookie,
  refreshAccessToken,
} from "./auth";

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5100/api",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  const token = getTokenFromCookie();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const url = originalRequest?.url || "unknown";

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      typeof window !== "undefined"
    ) {
      logger.warn(`http:401 — ${url}, tentando refresh`);
      originalRequest._retry = true;

      const refreshed = await refreshAccessToken();
      if (refreshed) {
        logger.info(`http:401 — refresh OK, re-executando ${url}`);
        originalRequest.headers.Authorization = `Bearer ${refreshed.token}`;
        return apiClient(originalRequest);
      }

      logger.error(`http:401 — refresh falhou para ${url}, redirecionando para login`);
      removeCookie(TOKEN_COOKIE);
      removeCookie(REFRESH_TOKEN_COOKIE);
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

export default apiClient;
