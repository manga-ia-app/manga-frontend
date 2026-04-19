"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useChat } from "@/lib/chat/use-chat";
import { ChatHeader } from "./chat-header";
import { ChatMessageBubble } from "./chat-message";
import { ChatInput } from "./chat-input";
import { ChatTrigger } from "./chat-trigger";
import { ChatSuggestions } from "./chat-suggestions";
import { ChatConfirmationPreview } from "./chat-confirmation-preview";
import { getSuggestions } from "@/lib/chat/suggestions";

export function GlobalChatOverlay() {
  const {
    messages,
    isOpen,
    isStreaming,
    isConnected,
    isAiAvailable,
    showHistoryAlert,
    pendingConfirmation,
    isThrottled,
    cooldownRemaining,
    sendMessage,
    stopStreaming,
    clearHistory,
    toggleOpen,
    setIsOpen,
    confirmAction,
    currentContext,
  } = useChat();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const toggleExpand = useCallback(() => setIsExpanded((v) => !v), []);

  // Auto-scroll to bottom on new messages or streaming updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Listen for manga:chat:open events from ListingChatBar
  useEffect(() => {
    function handleChatOpen(e: Event) {
      const { message } = (e as CustomEvent<{ message: string; contextName: string }>).detail;
      setIsOpen(true);
      sendMessage(message);
    }
    window.addEventListener("manga:chat:open", handleChatOpen);
    return () => window.removeEventListener("manga:chat:open", handleChatOpen);
  }, [setIsOpen, sendMessage]);

  // Cmd/Ctrl+K to toggle chat + Escape to close
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        toggleOpen();
      }
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, toggleOpen, setIsOpen]);

  return (
    <>
      <ChatTrigger isOpen={isOpen} onClick={toggleOpen} />

      {isOpen && (
        <div
          role="dialog"
          aria-label="Chat do assistente Manga"
          className={`fixed bottom-4 right-4 z-50 flex flex-col rounded-xl border bg-background shadow-2xl animate-in slide-in-from-bottom-4 duration-300 transition-all ${
            isExpanded
              ? "w-[600px] h-[80vh] max-sm:w-[calc(100vw-2rem)]"
              : "w-[400px] h-[600px] max-h-[80vh] max-sm:w-[calc(100vw-2rem)] max-sm:right-4 max-sm:left-4"
          }`}
        >
          <ChatHeader
            isConnected={isConnected}
            isAiAvailable={isAiAvailable}
            isExpanded={isExpanded}
            onClearHistory={clearHistory}
            onToggleExpand={toggleExpand}
            onClose={() => setIsOpen(false)}
          />

          {/* Messages area */}
          <div aria-live="polite" className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
            {messages.length === 0 && (
              <div className="flex items-center justify-center h-full">
                <ChatSuggestions
                  suggestions={getSuggestions(currentContext.contextName)}
                  onSelect={sendMessage}
                />
              </div>
            )}

            {messages.map((msg) => (
              <ChatMessageBubble key={msg.id} message={msg} />
            ))}

            {showHistoryAlert && (
              <div className="text-center text-xs text-amber-600 bg-amber-50 rounded-md px-2 py-1">
                Conversa longa — considere iniciar uma nova sessão para melhores
                respostas.
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Confirmation preview — replaces input when active */}
          {pendingConfirmation && (
            <ChatConfirmationPreview
              preview={pendingConfirmation}
              onConfirm={() => confirmAction(true)}
              onCancel={() => confirmAction(false)}
            />
          )}

          {/* Input area — hidden during confirmation */}
          {!pendingConfirmation && (
            <ChatInput
              onSend={sendMessage}
              onStop={stopStreaming}
              isThrottled={isThrottled}
              cooldownRemaining={cooldownRemaining}
              isStreaming={isStreaming}
            />
          )}
        </div>
      )}
    </>
  );
}
