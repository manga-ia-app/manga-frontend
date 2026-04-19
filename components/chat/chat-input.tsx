"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Square } from "lucide-react";

interface ChatInputProps {
  onSend: (message: string) => void;
  onStop?: () => void;
  disabled?: boolean;
  isThrottled?: boolean;
  cooldownRemaining?: number;
  isStreaming?: boolean;
  placeholder?: string;
}

export function ChatInput({
  onSend,
  onStop,
  disabled = false,
  isThrottled = false,
  cooldownRemaining = 0,
  isStreaming = false,
  placeholder = "Pergunte algo sobre seu escritório...",
}: ChatInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      const lineHeight = 20;
      const maxHeight = lineHeight * 4;
      textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
    }
  }, [value]);

  const canSend =
    value.trim().length > 0 && !disabled && !isThrottled && !isStreaming;

  function handleSubmit() {
    if (!canSend) return;
    onSend(value.trim());
    setValue("");
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  return (
    <div>
      <div className="flex items-end gap-2 border-t px-3 py-2">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          aria-label="Mensagem para o assistente"
          rows={1}
          disabled={disabled}
          className="w-full resize-none border-0 bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none"
        />
        {isStreaming ? (
          <button
            type="button"
            onClick={onStop}
            title="Parar resposta"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            <Square size={14} />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSend}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-50"
          >
            <Send size={16} />
          </button>
        )}
      </div>
      {isThrottled && (
        <p className="px-6 pb-2 text-xs text-muted-foreground">
          Aguarde {Math.ceil(cooldownRemaining / 1000)}s...
        </p>
      )}
    </div>
  );
}
