import axios from 'axios';
import { TOKEN_COOKIE, REFRESH_TOKEN_COOKIE, removeCookie, getTokenFromCookie, refreshAccessToken } from './auth';

const aiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_AI_URL || 'http://localhost:5200',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

aiClient.interceptors.request.use((config) => {
  const token = getTokenFromCookie();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

aiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      typeof window !== 'undefined'
    ) {
      originalRequest._retry = true;

      const refreshed = await refreshAccessToken();
      if (refreshed) {
        originalRequest.headers.Authorization = `Bearer ${refreshed.token}`;
        return aiClient(originalRequest);
      }

      removeCookie(TOKEN_COOKIE);
      removeCookie(REFRESH_TOKEN_COOKIE);
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export interface ChatResponse {
  sessionId: string;
  reply: string;
  status: 'completed' | 'waiting_elicitation' | 'waiting_confirmation' | 'failed';
}

export interface SessionResponse {
  sessionId: string;
  workflowId: string | null;
  status: string;
  currentStep: number;
  totalSteps: number;
}

export interface UsageResponse {
  period: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  samplingCalls: number;
  planLimit: number | null;
}

export const chatMessage = async (
  message: string,
  context: string,
  entityId?: string
): Promise<ChatResponse> => {
  const { data } = await aiClient.post<ChatResponse>('/ai/chat', {
    message,
    context,
    entityId,
  });
  return data;
};

export const respondToElicitation = async (
  sessionId: string,
  response: string
): Promise<{ sessionId: string; status: string }> => {
  const { data } = await aiClient.post('/ai/respond', { sessionId, response });
  return data;
};

export const confirmWrite = async (
  sessionId: string,
  confirmed: boolean
): Promise<{ sessionId: string; status: string }> => {
  const { data } = await aiClient.post('/ai/confirm', { sessionId, confirmed });
  return data;
};

export const getSession = async (sessionId: string): Promise<SessionResponse> => {
  const { data } = await aiClient.get<SessionResponse>(`/ai/session/${sessionId}`);
  return data;
};

export const getCurrentUsage = async (): Promise<UsageResponse> => {
  const { data } = await aiClient.get<UsageResponse>('/ai/usage/current');
  return data;
};

export interface AiHealthResponse {
  status: 'healthy' | 'degraded' | 'unavailable';
  llmProvider?: string;
  uptime?: number;
  message?: string;
}

export const getAiHealth = async (): Promise<AiHealthResponse> => {
  try {
    // Python AI service health endpoint (LangGraph migration)
    const { data } = await aiClient.get('/health');
    return {
      status: data.graph_ready ? 'healthy' : 'degraded',
      message: data.graph_ready ? undefined : 'Graph not ready',
    };
  } catch {
    return { status: 'unavailable' };
  }
};

// Navigation routes removed — frontend owns routes directly in navigation-map.ts
