"use client";

import { ContextSuggestion } from "@/lib/types/chat";

interface ChatSuggestionsProps {
  suggestions: ContextSuggestion[];
  onSelect: (prompt: string) => void;
}

export function ChatSuggestions({ suggestions, onSelect }: ChatSuggestionsProps) {
  return (
    <div role="menu" aria-label="Sugestões" className="flex flex-col items-center gap-2 p-4">
      {suggestions.map((suggestion) => (
        <button
          key={suggestion.prompt}
          type="button"
          role="menuitem"
          className="bg-muted hover:bg-muted/80 text-foreground rounded-lg px-3 py-2 text-sm cursor-pointer transition-colors"
          onClick={() => onSelect(suggestion.prompt)}
        >
          {suggestion.label}
        </button>
      ))}
    </div>
  );
}
