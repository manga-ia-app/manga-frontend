"use client";

import { MessageCircle } from "lucide-react";

interface ChatTriggerProps {
  isOpen: boolean;
  onClick: () => void;
}

export function ChatTrigger({ isOpen, onClick }: ChatTriggerProps) {
  if (isOpen) return null;

  return (
    <button
      onClick={onClick}
      className="fixed bottom-4 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 active:scale-95"
      aria-label="Abrir chat (Ctrl+K)"
      title="Chat (Ctrl+K)"
    >
      <MessageCircle size={22} />
    </button>
  );
}
