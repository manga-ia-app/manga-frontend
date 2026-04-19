"use client";

import { RotateCcw, X, AlertTriangle, Loader2, WifiOff, Maximize2, Minimize2 } from "lucide-react";

interface ChatHeaderProps {
  isConnected: boolean;
  isAiAvailable: boolean;
  isExpanded?: boolean;
  onClearHistory: () => void;
  onToggleExpand?: () => void;
  onClose: () => void;
}

export function ChatHeader({
  isConnected,
  isAiAvailable,
  isExpanded = false,
  onClearHistory,
  onToggleExpand,
  onClose,
}: ChatHeaderProps) {
  // 3 states: connected (green), reconnecting (yellow pulse), disconnected (red)
  const dotClass = isConnected
    ? "bg-green-400"
    : isAiAvailable
      ? "bg-amber-400 animate-pulse"
      : "bg-red-400";

  const statusLabel = isConnected
    ? "Conectado"
    : isAiAvailable
      ? "Reconectando..."
      : "Desconectado";

  return (
    <div>
      <div className="flex items-center justify-between px-4 py-3 bg-primary text-primary-foreground">
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${dotClass}`}
            title={statusLabel}
          />
          <span className="text-sm font-semibold">Manga Assistente</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onClearHistory}
            aria-label="Nova conversa"
            className="flex items-center gap-1.5 p-1.5 rounded-md hover:bg-primary-foreground/10 text-xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Nova conversa</span>
          </button>
          {onToggleExpand && (
            <button
              onClick={onToggleExpand}
              aria-label={isExpanded ? "Reduzir chat" : "Expandir chat"}
              title={isExpanded ? "Reduzir" : "Expandir"}
              className="p-1.5 rounded-md hover:bg-primary-foreground/10"
            >
              {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          )}
          <button
            onClick={onClose}
            aria-label="Fechar chat"
            className="p-1.5 rounded-md hover:bg-primary-foreground/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
      {!isAiAvailable && (
        <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-800 border-b border-amber-200 text-xs">
          <WifiOff className="w-3.5 h-3.5 flex-shrink-0" />
          <span>Assistente indisponível — navegação básica ativa</span>
        </div>
      )}
      {isAiAvailable && !isConnected && (
        <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 border-b border-blue-200 text-xs">
          <Loader2 className="w-3.5 h-3.5 flex-shrink-0 animate-spin" />
          <span>Reconectando ao assistente...</span>
        </div>
      )}
    </div>
  );
}
