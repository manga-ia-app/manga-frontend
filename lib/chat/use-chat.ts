"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ChatContext, ChatMessage, ConfirmationPreview, NavigationOption, ToolAction } from "../types/chat";
import { matchNavigation, loadNavigationRoutes } from "./navigation-map";
import { useWebSocket } from "./use-websocket";
import { resolveContext, extractEntityId } from "./context-router";
import {
  CHAT_COOLDOWN_MS,
  CHAT_HISTORY_LIMIT,
  CHAT_HISTORY_ALERT_THRESHOLD,
  CHAT_RATE_LIMIT,
} from "./constants";

// ── State & Actions ─────────────────────────────────────────────────

interface ChatState {
  messages: ChatMessage[];
  isOpen: boolean;
  isStreaming: boolean;
  isConnected: boolean;
  isAiAvailable: boolean;
  currentContext: ChatContext;
  showHistoryAlert: boolean;
  pendingConfirmation: ConfirmationPreview | null;
  showRefreshHint: boolean;
}

type ChatAction =
  | { type: "TOGGLE_OPEN" }
  | { type: "SET_OPEN"; payload: boolean }
  | { type: "SET_CONNECTED"; payload: boolean }
  | { type: "SET_AI_AVAILABLE"; payload: boolean }
  | { type: "SET_CONTEXT"; payload: ChatContext }
  | { type: "ADD_USER_MESSAGE"; payload: ChatMessage }
  | { type: "ADD_ASSISTANT_MESSAGE"; payload: ChatMessage }
  | { type: "APPEND_CHUNK"; payload: string }
  | { type: "COMPLETE_ASSISTANT" }
  | { type: "ERROR_ASSISTANT"; payload: string }
  | { type: "CLEAR_HISTORY" }
  | { type: "SET_STREAMING"; payload: boolean }
  | { type: "SHOW_CONFIRMATION"; payload: ConfirmationPreview }
  | { type: "CLEAR_CONFIRMATION" }
  | { type: "SHOW_REFRESH_HINT" }
  | { type: "CLEAR_REFRESH_HINT" }
  | { type: "ADD_TOOL_ACTION"; payload: ToolAction };

const DEFAULT_CONTEXT: ChatContext = {
  route: "/",
  contextName: "",
  entityId: undefined,
};

const initialState: ChatState = {
  messages: [],
  isOpen: false,
  isStreaming: false,
  isConnected: false,
  isAiAvailable: true,
  currentContext: DEFAULT_CONTEXT,
  showHistoryAlert: false,
  pendingConfirmation: null,
  showRefreshHint: false,
};

function trimMessages(messages: ChatMessage[]): ChatMessage[] {
  if (messages.length > CHAT_HISTORY_LIMIT) {
    return messages.slice(messages.length - CHAT_HISTORY_LIMIT);
  }
  return messages;
}

function computeHistoryAlert(messages: ChatMessage[]): boolean {
  return messages.length >= CHAT_HISTORY_LIMIT * CHAT_HISTORY_ALERT_THRESHOLD;
}

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case "TOGGLE_OPEN":
      return { ...state, isOpen: !state.isOpen };

    case "SET_OPEN":
      return { ...state, isOpen: action.payload };

    case "SET_CONNECTED":
      return { ...state, isConnected: action.payload };

    case "SET_AI_AVAILABLE":
      return { ...state, isAiAvailable: action.payload };

    case "SET_CONTEXT":
      return { ...state, currentContext: action.payload };

    case "ADD_USER_MESSAGE": {
      const msgs = trimMessages([...state.messages, action.payload]);
      return {
        ...state,
        messages: msgs,
        showHistoryAlert: computeHistoryAlert(msgs),
      };
    }

    case "ADD_ASSISTANT_MESSAGE": {
      const msgs = trimMessages([...state.messages, action.payload]);
      return {
        ...state,
        messages: msgs,
        isStreaming: true,
        showHistoryAlert: computeHistoryAlert(msgs),
      };
    }

    case "APPEND_CHUNK": {
      const msgs = [...state.messages];
      const lastIdx = msgs.length - 1;
      if (lastIdx >= 0 && msgs[lastIdx].role === "assistant") {
        msgs[lastIdx] = {
          ...msgs[lastIdx],
          content: msgs[lastIdx].content + action.payload,
          status: "streaming",
        };
      } else {
        // Auto-create assistant message on first chunk (no placeholder needed)
        msgs.push({
          id: crypto.randomUUID(),
          role: "assistant",
          content: action.payload,
          timestamp: new Date(),
          status: "streaming",
        });
      }
      return { ...state, messages: msgs, isStreaming: true };
    }

    case "COMPLETE_ASSISTANT": {
      const msgs = [...state.messages];
      const lastIdx = msgs.length - 1;
      if (lastIdx >= 0 && msgs[lastIdx].role === "assistant") {
        msgs[lastIdx] = { ...msgs[lastIdx], status: "complete" };
      }
      return { ...state, messages: msgs, isStreaming: false };
    }

    case "ERROR_ASSISTANT": {
      const msgs = [...state.messages];
      const lastIdx = msgs.length - 1;
      if (lastIdx >= 0 && msgs[lastIdx].role === "assistant") {
        msgs[lastIdx] = {
          ...msgs[lastIdx],
          content: action.payload,
          status: "error",
        };
      }
      return { ...state, messages: msgs, isStreaming: false };
    }

    case "CLEAR_HISTORY":
      return {
        ...state,
        messages: [],
        showHistoryAlert: false,
        isStreaming: false,
      };

    case "SET_STREAMING":
      return { ...state, isStreaming: action.payload };

    case "SHOW_CONFIRMATION":
      return { ...state, pendingConfirmation: action.payload, isStreaming: false };

    case "CLEAR_CONFIRMATION":
      return { ...state, pendingConfirmation: null };

    case "SHOW_REFRESH_HINT":
      return { ...state, showRefreshHint: true };

    case "CLEAR_REFRESH_HINT":
      return { ...state, showRefreshHint: false };

    case "ADD_TOOL_ACTION": {
      const msgs = [...state.messages];
      // Attach to the last assistant message (or the one being streamed)
      for (let i = msgs.length - 1; i >= 0; i--) {
        if (msgs[i].role === "assistant") {
          const existing = msgs[i].toolActions ?? [];
          msgs[i] = { ...msgs[i], toolActions: [...existing, action.payload] };
          break;
        }
      }
      return { ...state, messages: msgs };
    }

    default:
      return state;
  }
}

// ── Hook ────────────────────────────────────────────────────────────

export function useChat() {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const pathname = usePathname();
  const router = useRouter();
  const routerRef = useRef(router);
  routerRef.current = router;

  const sessionIdRef = useRef<string | null>(null);
  const lastMessageTimestampRef = useRef<number>(0);
  const messageCountThisMinuteRef = useRef<number>(0);
  const hasConnectedRef = useRef(false);
  const awaitingWriteCompleteRef = useRef(false);
  const confirmedToolNameRef = useRef<string | null>(null);
  const sendMessageRef = useRef<((text: string) => void) | null>(null);

  // ── Tool label mapping (humanized, no technical data) ──────────

  const humanizeToolName = useCallback((toolName: string, accessLevel: string): ToolAction => {
    const labels: Record<string, string> = {
      ListarCargos: "Consultou cargos",
      ObterCargo: "Consultou cargo",
      ListarGrupos: "Consultou grupos",
      ListarColaboradores: "Consultou colaboradores",
      ObterColaborador: "Consultou colaborador",
      CriarCargo: "Cadastrou cargo",
      AtualizarCargo: "Atualizou cargo",
      ExcluirCargo: "Removeu cargo",
      ExcluirCargosBatch: "Removeu cargos",
      CriarGrupo: "Cadastrou grupo",
      AtualizarGrupo: "Atualizou grupo",
      ExcluirGrupo: "Removeu grupo",
      CriarColaborador: "Cadastrou colaborador",
      AtualizarColaborador: "Atualizou colaborador",
      DesativarColaborador: "Desativou colaborador",
    };
    const type = accessLevel === "Write" ? "write" : "read";
    return { label: labels[toolName] ?? toolName, type: type as ToolAction["type"] };
  }, []);

  // ── WebSocket integration (Python AI Service) ──────────────────

  const { send, isConnected, currentStatus, connect } = useWebSocket({
    onChunk: (payload) => {
      dispatch({ type: "APPEND_CHUNK", payload: payload.text });
    },
    onCompleted: (payload) => {
      dispatch({ type: "COMPLETE_ASSISTANT" });

      // Handle navigation suggestion from Python service
      if (payload.navigationSuggestion) {
        const navOption: NavigationOption = {
          label: payload.navigationSuggestion.label,
          route: payload.navigationSuggestion.route,
        };
        // Attach to the last assistant message
        const msgs = [...state.messages];
        for (let i = msgs.length - 1; i >= 0; i--) {
          if (msgs[i].role === "assistant") {
            msgs[i] = { ...msgs[i], navigationOptions: [navOption] };
            break;
          }
        }
      }

      if (awaitingWriteCompleteRef.current) {
        awaitingWriteCompleteRef.current = false;
        window.dispatchEvent(new CustomEvent("manga:data:changed", {
          detail: { toolName: confirmedToolNameRef.current },
        }));
        confirmedToolNameRef.current = null;
      }
    },
    onError: (payload) => {
      dispatch({ type: "ERROR_ASSISTANT", payload: payload.message });
      if (payload.code === "jwt_expired" || payload.code === "confirmation_expired") {
        sessionIdRef.current = null;
        dispatch({ type: "CLEAR_CONFIRMATION" });
      }
    },
    onConfirmationPreview: (payload) => {
      confirmedToolNameRef.current = payload.toolName;
      dispatch({
        type: "SHOW_CONFIRMATION",
        payload: { toolName: payload.toolName, previewData: payload.previewData },
      });
    },
    onToolExecuted: (payload) => {
      const action = humanizeToolName(payload.toolName, payload.accessLevel);
      dispatch({ type: "ADD_TOOL_ACTION", payload: action });
    },
  });

  // Sync isConnected from SignalR hook into reducer state
  useEffect(() => {
    dispatch({ type: "SET_CONNECTED", payload: isConnected });
  }, [isConnected]);

  // ── Context routing ─────────────────────────────────────────────

  useEffect(() => {
    const resolved = resolveContext(pathname);
    const entityId = extractEntityId(pathname);

    const context: ChatContext = resolved
      ? { route: pathname, contextName: resolved.contextName, entityId }
      : { route: pathname, contextName: "", entityId: undefined };

    // If streaming and user navigates, cancel the stream
    if (state.isStreaming) {
      dispatch({ type: "COMPLETE_ASSISTANT" });
    }

    dispatch({ type: "SET_CONTEXT", payload: context });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // ── Throttle: reset message count every 60s ─────────────────────

  useEffect(() => {
    const interval = setInterval(() => {
      messageCountThisMinuteRef.current = 0;
    }, 60_000);
    return () => clearInterval(interval);
  }, []);

  // ── Health polling ────────────────────────────────────────────

  useEffect(() => {
    // Load navigation routes from API (runs once, cached after)
    loadNavigationRoutes();

    let timer: ReturnType<typeof setTimeout>;

    async function poll() {
      try {
        const { getAiHealth } = await import("@/lib/api/ai");
        const health = await getAiHealth();
        const available = health.status === "healthy";
        dispatch({ type: "SET_AI_AVAILABLE", payload: available });
        const interval = available ? 5 * 60_000 : 30_000;
        timer = setTimeout(poll, interval);
      } catch {
        dispatch({ type: "SET_AI_AVAILABLE", payload: false });
        timer = setTimeout(poll, 30_000);
      }
    }

    poll();
    return () => clearTimeout(timer);
  }, []);

  // ── Throttle state (ticks every 500ms so UI updates) ───────────

  const [throttleTick, setThrottleTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setThrottleTick(Date.now()), 500);
    return () => clearInterval(interval);
  }, []);

  const elapsed = throttleTick - lastMessageTimestampRef.current;
  const cooldownRemaining =
    elapsed < CHAT_COOLDOWN_MS ? CHAT_COOLDOWN_MS - elapsed : 0;
  const isThrottled =
    cooldownRemaining > 0 ||
    messageCountThisMinuteRef.current >= CHAT_RATE_LIMIT;

  // ── sendMessage ─────────────────────────────────────────────────

  const sendMessage = useCallback(
    async (text: string) => {
      const currentNow = Date.now();
      const currentElapsed = currentNow - lastMessageTimestampRef.current;

      if (
        currentElapsed < CHAT_COOLDOWN_MS ||
        messageCountThisMinuteRef.current >= CHAT_RATE_LIMIT
      ) {
        return;
      }

      // Cancel current stream if one is in progress
      if (state.isStreaming) {
        dispatch({ type: "COMPLETE_ASSISTANT" });
      }

      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: text,
        timestamp: new Date(),
        status: "complete",
      };

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "",
        timestamp: new Date(),
        status: "streaming",
      };

      dispatch({ type: "ADD_USER_MESSAGE", payload: userMessage });

      lastMessageTimestampRef.current = currentNow;
      messageCountThisMinuteRef.current += 1;

      // ── Local navigation fallback when AI is unavailable ──────────
      if (!state.isAiAvailable) {
        // Check for creation intent on pages that support it
        const CREATION_KEYWORDS = /\b(cadastrar|criar|adicionar|novo|nova)\b/i;
        const currentRouteCtx = resolveContext(pathname);

        if (CREATION_KEYWORDS.test(text) && currentRouteCtx?.supportsCreation) {
          const creationMessage: ChatMessage = {
            id: crypto.randomUUID(),
            role: "assistant",
            content:
              "Criação via chat requer o assistente de IA. Use o botão 'Novo' na tela atual.",
            timestamp: new Date(),
            status: "complete",
          };
          dispatch({ type: "ADD_ASSISTANT_MESSAGE", payload: creationMessage });
          dispatch({ type: "COMPLETE_ASSISTANT" });
          return;
        }

        const matches = matchNavigation(text);

        if (matches.length === 1) {
          const confirmMessage: ChatMessage = {
            id: crypto.randomUUID(),
            role: "assistant",
            content: `Navegando para ${matches[0].label}...`,
            timestamp: new Date(),
            status: "complete",
          };
          dispatch({ type: "ADD_ASSISTANT_MESSAGE", payload: confirmMessage });
          dispatch({ type: "COMPLETE_ASSISTANT" });
          router.push(matches[0].route);
        } else if (matches.length > 1) {
          const navOptions: NavigationOption[] = matches.map((m) => ({
            label: m.label,
            route: m.route,
            icon: m.icon,
          }));
          const multiMessage: ChatMessage = {
            id: crypto.randomUUID(),
            role: "assistant",
            content: "Encontrei algumas opções:",
            timestamp: new Date(),
            status: "complete",
            navigationOptions: navOptions,
          };
          dispatch({ type: "ADD_ASSISTANT_MESSAGE", payload: multiMessage });
          dispatch({ type: "COMPLETE_ASSISTANT" });
        } else {
          const noMatchMessage: ChatMessage = {
            id: crypto.randomUUID(),
            role: "assistant",
            content:
              "Não encontrei uma tela correspondente. Tente ser mais específico.",
            timestamp: new Date(),
            status: "complete",
          };
          dispatch({ type: "ADD_ASSISTANT_MESSAGE", payload: noMatchMessage });
          dispatch({ type: "COMPLETE_ASSISTANT" });
        }
        return;
      }

      // ── WebSocket AI path ──────────────────────────────────────────
      dispatch({ type: "ADD_ASSISTANT_MESSAGE", payload: assistantMessage });

      try {
        if (!sessionIdRef.current) {
          sessionIdRef.current = crypto.randomUUID();
        }
        send("message", {
          session_id: sessionIdRef.current,
          content: text,
          context: state.currentContext.contextName,
        });
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : "Erro ao enviar mensagem.";
        dispatch({ type: "ERROR_ASSISTANT", payload: errorMsg });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [send, state.currentContext, state.isAiAvailable, state.messages, router, pathname]
  );

  // Keep ref in sync for use in useEffect (avoids dependency loop)
  sendMessageRef.current = sendMessage;

  // ── stopStreaming ──────────────────────────────────────────────

  const stopStreaming = useCallback(() => {
    dispatch({ type: "COMPLETE_ASSISTANT" });
  }, []);

  // ── clearHistory ────────────────────────────────────────────────

  const clearHistory = useCallback(() => {
    dispatch({ type: "CLEAR_HISTORY" });
    sessionIdRef.current = null;
  }, []);

  // ── toggleOpen ──────────────────────────────────────────────────

  const toggleOpen = useCallback(() => {
    const willOpen = !state.isOpen;
    dispatch({ type: "TOGGLE_OPEN" });

    if (willOpen && !hasConnectedRef.current) {
      hasConnectedRef.current = true;
      connect().catch((err) => {
        console.error("[useChat] Failed to connect SignalR:", err);
      });
    }
  }, [state.isOpen, connect]);

  // ── setIsOpen ───────────────────────────────────────────────────

  const setIsOpen = useCallback(
    (open: boolean) => {
      dispatch({ type: "SET_OPEN", payload: open });

      if (open && !hasConnectedRef.current) {
        hasConnectedRef.current = true;
        connect().catch((err) => {
          console.error("[useChat] Failed to connect SignalR:", err);
        });
      }
    },
    [connect]
  );

  // ── confirmAction ───────────────────────────────────────────────

  const confirmAction = useCallback(
    async (confirmed: boolean) => {
      if (!sessionIdRef.current) return;
      dispatch({ type: "CLEAR_CONFIRMATION" });

      if (confirmed) {
        awaitingWriteCompleteRef.current = true;
      }

      try {
        send(confirmed ? "confirm" : "cancel", {
          session_id: sessionIdRef.current,
        });
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Erro ao confirmar ação.";
        dispatch({ type: "ERROR_ASSISTANT", payload: errorMsg });
      }
    },
    [send]
  );

  // ── refreshPage ────────────────────────────────────────────────

  const refreshPage = useCallback(() => {
    dispatch({ type: "CLEAR_REFRESH_HINT" });
    router.refresh();
  }, [router]);

  // ── Return ──────────────────────────────────────────────────────

  const isProcessing = currentStatus !== "idle";

  return {
    messages: state.messages,
    isOpen: state.isOpen,
    isStreaming: state.isStreaming,
    isConnected: state.isConnected,
    isAiAvailable: state.isAiAvailable,
    isProcessing,
    currentStatus,
    currentContext: state.currentContext,
    showHistoryAlert: state.showHistoryAlert,
    pendingConfirmation: state.pendingConfirmation,
    showRefreshHint: state.showRefreshHint,
    isThrottled,
    cooldownRemaining,
    sendMessage,
    stopStreaming,
    clearHistory,
    toggleOpen,
    setIsOpen,
    confirmAction,
    refreshPage,
    sessionId: sessionIdRef.current,
  };
}
