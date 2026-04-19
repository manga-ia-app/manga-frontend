"use client";

import { useCallback, useRef, useState } from "react";
import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  IRetryPolicy,
  LogLevel,
  RetryContext,
} from "@microsoft/signalr";
import { AI_HUB_URL } from "../chat/constants";
import { getTokenFromCookie, isTokenExpired } from "../api/auth";

// ── Event payload types ──────────────────────────────────────────────

export interface AiChunkPayload {
  sessionId: string;
  text: string;
}

export interface AiCompletedPayload {
  sessionId: string;
  result: { reply: string } | null;
}

export interface AiErrorPayload {
  sessionId: string;
  code: string;
  message: string;
}

export interface AiNavigatePayload {
  sessionId: string;
  route: string;
  parameters?: Record<string, string>;
}

export interface AiElicitationPayload {
  sessionId: string;
  message: string;
  inputType: "text" | "choice" | "confirmation";
  choices?: string[];
  schema?: object;
}

export interface AiConfirmationPreviewPayload {
  sessionId: string;
  toolName: string;
  previewData: {
    requestId?: string;
    message: string;
    before?: Record<string, unknown> | null;
    after?: Record<string, unknown> | null;
    impact?: Record<string, unknown> | null;
    warnings?: string[];
    blocked?: boolean;
  };
}

export interface AiToolExecutedPayload {
  sessionId: string;
  toolName: string;
  accessLevel: string;
}

// ── Listener map ─────────────────────────────────────────────────────

export interface SignalRListeners {
  onChunk?: (payload: AiChunkPayload) => void;
  onCompleted?: (payload: AiCompletedPayload) => void;
  onError?: (payload: AiErrorPayload) => void;
  onNavigate?: (payload: AiNavigatePayload) => void;
  onElicitation?: (payload: AiElicitationPayload) => void;
  onConfirmationPreview?: (payload: AiConfirmationPreviewPayload) => void;
  onToolExecuted?: (payload: AiToolExecutedPayload) => void;
}

// ── Hook return type ─────────────────────────────────────────────────

export interface UseSignalRReturn {
  invoke: <T = void>(method: string, ...args: unknown[]) => Promise<T>;
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
}

// ── Retry policy: stops if token expired, backs off otherwise ────────

const RETRY_DELAYS_MS = [1_000, 2_000, 5_000, 10_000, 30_000];
const MAX_RETRIES = RETRY_DELAYS_MS.length;

class TokenAwareRetryPolicy implements IRetryPolicy {
  nextRetryDelayInMilliseconds(retryContext: RetryContext): number | null {
    // Stop retrying if token is expired or missing
    const token = getTokenFromCookie();
    if (!token || isTokenExpired(token)) {
      return null; // null = stop retrying
    }

    // Stop after max retries
    if (retryContext.previousRetryCount >= MAX_RETRIES) {
      return null;
    }

    return RETRY_DELAYS_MS[retryContext.previousRetryCount] ?? 30_000;
  }
}

// ── Hook ─────────────────────────────────────────────────────────────

export function useSignalR(listeners?: SignalRListeners): UseSignalRReturn {
  const [isConnected, setIsConnected] = useState(false);
  const connectionRef = useRef<HubConnection | null>(null);
  const listenersRef = useRef(listeners);
  listenersRef.current = listeners;

  const buildConnection = useCallback((): HubConnection => {
    const connection = new HubConnectionBuilder()
      .withUrl(AI_HUB_URL, {
        accessTokenFactory: () => getTokenFromCookie() ?? "",
        withCredentials: true,
      })
      .withAutomaticReconnect(new TokenAwareRetryPolicy())
      .configureLogging(LogLevel.None)
      .build();

    // ── Connection lifecycle ───────────────────────────────────────
    connection.onreconnecting(() => setIsConnected(false));
    connection.onreconnected(() => setIsConnected(true));
    connection.onclose(() => setIsConnected(false));

    // ── Event listeners ────────────────────────────────────────────
    connection.on("ai:chunk", (payload: AiChunkPayload) => {
      listenersRef.current?.onChunk?.(payload);
    });

    connection.on("ai:completed", (payload: AiCompletedPayload) => {
      listenersRef.current?.onCompleted?.(payload);
    });

    connection.on("ai:error", (payload: AiErrorPayload) => {
      listenersRef.current?.onError?.(payload);
    });

    connection.on("ai:navigate", (payload: AiNavigatePayload) => {
      listenersRef.current?.onNavigate?.(payload);
    });

    connection.on("ai:elicitation", (payload: AiElicitationPayload) => {
      listenersRef.current?.onElicitation?.(payload);
    });

    connection.on("ai:confirmation_preview", (payload: AiConfirmationPreviewPayload) => {
      listenersRef.current?.onConfirmationPreview?.(payload);
    });

    connection.on("ai:tool_executed", (payload: AiToolExecutedPayload) => {
      listenersRef.current?.onToolExecuted?.(payload);
    });

    return connection;
  }, []);

  const connect = useCallback(async () => {
    let conn = connectionRef.current;

    if (conn && conn.state === HubConnectionState.Connected) {
      return;
    }

    // Don't attempt connection if token is expired/missing
    const token = getTokenFromCookie();
    if (!token || isTokenExpired(token)) {
      setIsConnected(false);
      return;
    }

    if (!conn || conn.state === HubConnectionState.Disconnected) {
      if (conn) {
        connectionRef.current = null;
      }
      conn = buildConnection();
      connectionRef.current = conn;
    }

    await conn.start();
    setIsConnected(true);
  }, [buildConnection]);

  const disconnect = useCallback(async () => {
    const conn = connectionRef.current;
    if (!conn) return;

    await conn.stop();
    connectionRef.current = null;
    setIsConnected(false);
  }, []);

  const invoke = useCallback(
    async <T = void>(method: string, ...args: unknown[]): Promise<T> => {
      const conn = connectionRef.current;
      if (!conn || conn.state !== HubConnectionState.Connected) {
        throw new Error(
          "SignalR connection is not active. Call connect() first."
        );
      }
      return conn.invoke<T>(method, ...args);
    },
    []
  );

  return { invoke, isConnected, connect, disconnect };
}
