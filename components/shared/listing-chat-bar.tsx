"use client";

import { useState } from "react";
import { MessageCircle } from "lucide-react";

interface ListingChatBarProps {
  contextName: string;
  placeholder?: string;
}

export function ListingChatBar({
  contextName,
  placeholder = "Pergunte ao assistente...",
}: ListingChatBarProps) {
  const [input, setInput] = useState("");

  function handleSubmit() {
    const message = input.trim();
    if (!message) return;

    window.dispatchEvent(
      new CustomEvent("manga:chat:open", {
        detail: { message, contextName },
      })
    );
    setInput("");
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  return (
    <div className="flex items-center gap-2 rounded-lg border bg-muted/50 px-3 py-2 text-sm">
      <MessageCircle className="h-4 w-4 shrink-0 text-muted-foreground" />
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="bg-transparent border-0 outline-none flex-1 placeholder:text-muted-foreground"
      />
    </div>
  );
}
