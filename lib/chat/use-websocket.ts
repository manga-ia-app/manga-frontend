"use client";

import { useCallback, useRef, useState } from "react";
import { getTokenFromCookie, isTokenExpired } from "../api/auth";

const AI_SERVICE_URL = process.env.NEXT_PUBLIC_AI_SERVICE_URL || "ws://localhost:5200";

// ── Event payload types (same interface as SignalR for compatibility) ──

export interface AiChunkPayload {
  sessionId: string;
  text: string;
}

export interface AiCompletedPayload {
  sessionId: string;
  result: { reply: string } | null;
  navigationSuggestion?: { label: string; route: string } | null;
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

// ── Listener map ──

export interface WebSocketListeners {
  onChunk?: (payload: AiChunkPayload) => void;
  onCompleted?: (payload: AiCompletedPayload) => void;
  onError?: (payload: AiErrorPayload) => void;
  onNavigate?: (payload: AiNavigatePayload) => void;
  onElicitation?: (payload: AiElicitationPayload) => void;
  onConfirmationPreview?: (payload: AiConfirmationPreviewPayload) => void;
  onToolExecuted?: (payload: AiToolExecutedPayload) => void;
}

export type AiStatus = "idle" | "thinking" | "tool_calling" | "streaming" | "awaiting_confirmation";

// ── Hook return type ──

export interface UseWebSocketReturn {
  send: (type: string, data: Record<string, unknown>) => void;
  isConnected: boolean;
  currentStatus: AiStatus;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
}

// ── Reconnect config ──

const RECONNECT_DELAYS_MS = [1_000, 2_000, 5_000, 10_000, 30_000];
const MAX_RECONNECTS = RECONNECT_DELAYS_MS.length;

// ── Hook ──

export function useWebSocket(listeners?: WebSocketListeners): UseWebSocketReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<AiStatus>("idle");
  const wsRef = useRef<WebSocket | null>(null);
  const listenersRef = useRef(listeners);
  const reconnectCountRef = useRef(0);
  const sessionIdRef = useRef<string | null>(null);
  listenersRef.current = listeners;

  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const msg = JSON.parse(event.data);
      const sessionId = sessionIdRef.current || "";

      switch (msg.type) {
        case "thinking":
          setCurrentStatus("thinking");
          break;

        case "tool_calling":
          setCurrentStatus("tool_calling");
          listenersRef.current?.onToolExecuted?.({
            sessionId,
            toolName: msg.tool_name || "",
            accessLevel: "Read",
          });
          break;

        case "chunk":
          setCurrentStatus("streaming");
          listenersRef.current?.onChunk?.({
            sessionId,
            text: msg.content || "",
          });
          break;

        case "completed":
          setCurrentStatus("idle");
          listenersRef.current?.onCompleted?.({
            sessionId,
            result: msg.content ? { reply: msg.content } : null,
            navigationSuggestion: msg.navigation_suggestion || null,
          });
          break;

        case "error":
          setCurrentStatus("idle");
          listenersRef.current?.onError?.({
            sessionId,
            code: msg.error?.includes("expirada") ? "jwt_expired" : "chat_error",
            message: msg.error || msg.content || "Erro desconhecido",
          });
          break;

        case "timeout":
          setCurrentStatus("idle");
          listenersRef.current?.onError?.({
            sessionId,
            code: "timeout",
            message: msg.content || "A operação demorou demais.",
          });
          break;

        case "confirmation_required":
          setCurrentStatus("awaiting_confirmation");
          listenersRef.current?.onConfirmationPreview?.({
            sessionId,
            toolName: msg.tool_name || "",
            previewData: {
              message: msg.preview?.action
                ? `${msg.preview.action}${msg.preview.entity_name ? `: ${msg.preview.entity_name}` : ""}`
                : msg.tool_name || "",
              after: msg.preview?.details || msg.preview?.data || null,
              impact: msg.preview?.impact ? { description: msg.preview.impact } : null,
              warnings: msg.preview?.warnings || undefined,
            },
          });
          break;

        case "confirmation_expired":
          setCurrentStatus("idle");
          listenersRef.current?.onError?.({
            sessionId,
            code: "confirmation_expired",
            message: msg.content || "A confirmação expirou.",
          });
          break;

        case "tool_executed":
          listenersRef.current?.onToolExecuted?.({
            sessionId,
            toolName: msg.tool_name || "",
            accessLevel: msg.tool_type === "write" ? "Write" : "Read",
          });
          break;

        case "ping":
          // Respond to heartbeat
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
              type: "pong",
              session_id: sessionIdRef.current || "",
              jwt: "",
            }));
          }
          break;
      }
    } catch (err) {
      console.error("[WebSocket] Failed to parse message:", err);
    }
  }, []);

  const connect = useCallback(async () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    const token = getTokenFromCookie();
    if (!token || isTokenExpired(token)) {
      setIsConnected(false);
      return;
    }

    return new Promise<void>((resolve, reject) => {
      const ws = new WebSocket(`${AI_SERVICE_URL}/ws/chat`);

      ws.onopen = () => {
        setIsConnected(true);
        reconnectCountRef.current = 0;
        resolve();
      };

      ws.onmessage = handleMessage;

      ws.onclose = () => {
        setIsConnected(false);
        wsRef.current = null;

        // Auto-reconnect
        const token = getTokenFromCookie();
        if (token && !isTokenExpired(token) && reconnectCountRef.current < MAX_RECONNECTS) {
          const delay = RECONNECT_DELAYS_MS[reconnectCountRef.current] || 30_000;
          reconnectCountRef.current += 1;
          setTimeout(() => {
            connect().catch(() => {});
          }, delay);
        }
      };

      ws.onerror = () => {
        setIsConnected(false);
        reject(new Error("WebSocket connection failed"));
      };

      wsRef.current = ws;
    });
  }, [handleMessage]);

  const disconnect = useCallback(async () => {
    reconnectCountRef.current = MAX_RECONNECTS; // Prevent auto-reconnect
    wsRef.current?.close();
    wsRef.current = null;
    setIsConnected(false);
  }, []);

  const send = useCallback((type: string, data: Record<string, unknown>) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      throw new Error("WebSocket not connected");
    }

    const token = getTokenFromCookie() || "";
    const payload = { type, jwt: token, ...data };
    wsRef.current.send(JSON.stringify(payload));

    // Track session ID for event routing
    if (data.session_id) {
      sessionIdRef.current = data.session_id as string;
    }
  }, []);

  return { send, isConnected, currentStatus, connect, disconnect };
}
