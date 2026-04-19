"use client";

import { ToolAction } from "@/lib/types/chat";
import { Search, Pencil, ArrowRight } from "lucide-react";

const ICON_MAP: Record<ToolAction["type"], typeof Search> = {
  read: Search,
  write: Pencil,
  navigate: ArrowRight,
};

interface ChatToolIndicatorProps {
  actions: ToolAction[];
}

export function ChatToolIndicator({ actions }: ChatToolIndicatorProps) {
  if (!actions.length) return null;

  // Deduplicate by label
  const unique = actions.filter(
    (a, i, arr) => arr.findIndex((b) => b.label === a.label) === i
  );

  return (
    <div className="flex flex-wrap gap-1.5 mt-1.5">
      {unique.map((action, i) => {
        const Icon = ICON_MAP[action.type];
        return (
          <span
            key={i}
            className="inline-flex items-center gap-1 text-[11px] text-muted-foreground bg-muted/50 rounded-full px-2 py-0.5"
          >
            <Icon className="h-3 w-3" />
            {action.label}
          </span>
        );
      })}
    </div>
  );
}
